import { API_BASE_URL } from '../config/api';

export function getDiagnosticImageSource(record) {
  const path = record?.ai_findings?.xray_image_path;
  if (typeof path !== 'string' || !/^\/?uploads\/record_diagnostic_[a-zA-Z0-9_.-]+\.(png|jpg)$/.test(path)) return null;
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
}

export function getSavedAnnotationBoxes(record) {
  const annotations = record?.ai_findings?.annotations;
  if (!Array.isArray(annotations)) return [];
  return annotations.filter(annotation => {
    const box = annotation?.box;
    if (!box) return false;
    const { x_min: x, y_min: y, width, height } = box;
    return [x, y, width, height].every(Number.isFinite) && x >= 0 && y >= 0 &&
      width > 0 && height > 0 && x + width <= 1.000001 && y + height <= 1.000001;
  });
}

// Records and PDFs use the same composition, based exclusively on saved final
// annotations. An empty annotations array must never restore AI predictions.
export async function renderDiagnosticImage(record) {
  const source = getDiagnosticImageSource(record);
  if (!source) return null;
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error('The saved X-ray took too long to load. Please try again.'));
    }, 20000);
    img.crossOrigin = 'anonymous';
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('The saved X-ray could not be loaded. Please try again.')); };
    img.src = source;
  });
  const scale = Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not prepare the annotated X-ray.');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const fontSize = Math.max(12, Math.round(canvas.width / 65));
  const padding = Math.max(3, Math.round(fontSize / 4));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.lineWidth = Math.max(2, canvas.width / 500);
  getSavedAnnotationBoxes(record).forEach(annotation => {
    const box = annotation.box;
    const x = box.x_min * canvas.width;
    const y = box.y_min * canvas.height;
    const width = box.width * canvas.width;
    const height = box.height * canvas.height;
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(x, y, width, height);
    const confidence = Number.isFinite(annotation.confidence)
      ? ` (${Math.round(annotation.confidence * 100)}%)` : '';
    const label = `${annotation.name || 'Saved finding'}${confidence}`;
    const labelWidth = Math.min(canvas.width, ctx.measureText(label).width + padding * 2);
    const labelHeight = Math.min(canvas.height, fontSize + padding * 2);
    const labelX = Math.max(0, Math.min(x, canvas.width - labelWidth));
    const labelY = Math.max(0, Math.min(y - labelHeight, canvas.height - labelHeight));
    ctx.fillStyle = '#10b981';
    ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, labelX + padding, labelY + labelHeight / 2, Math.max(1, labelWidth - padding * 2));
  });
  try {
    return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
  } catch {
    throw new Error('The saved X-ray could not be prepared. Please try again or contact the clinic.');
  }
}
