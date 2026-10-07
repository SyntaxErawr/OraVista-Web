import { getDiagnosticImageSource, getSavedAnnotationBoxes, renderDiagnosticImage } from './diagnosticImage';

const box = { x_min: 0.1, y_min: 0.2, width: 0.3, height: 0.4 };
const record = { ai_findings: { xray_image_path: 'uploads/record_diagnostic_12_test.png',
  annotations: [{ name: 'Dentist finding', box, confidence: 0.99 }],
  predictions: [{ name: 'Removed AI finding', box }] } };

test('image references must be diagnostic storage paths rather than temporary or unrelated files', () => {
  expect(getDiagnosticImageSource(record)).toMatch(/\/uploads\/record_diagnostic_12_test.png$/);
  for (const path of ['blob:test', 'javascript:alert(1)', 'uploads/record_other.png', 'uploads/../record_diagnostic_1.png']) {
    expect(getDiagnosticImageSource({ ai_findings: { xray_image_path: path } })).toBeNull();
  }
});

test('saved empty annotations never fall back to predictions and invalid boxes are omitted', () => {
  expect(getSavedAnnotationBoxes({ ai_findings: { annotations: [], predictions: record.ai_findings.predictions } })).toEqual([]);
  expect(getSavedAnnotationBoxes({ ai_findings: { annotations: [{ name: 'Invalid', box: { ...box, width: -1 } }] } })).toEqual([]);
});

test('image composition preserves aspect ratio and draws only saved final findings', async () => {
  const originalImage = global.Image;
  const context = { drawImage: jest.fn(), strokeRect: jest.fn(), fillRect: jest.fn(), fillText: jest.fn(), measureText: () => ({ width: 100 }) };
  const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  const toDataURL = jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,composed');
  global.Image = class {
    naturalWidth = 4400;
    naturalHeight = 2200;
    set src(value) { this.onload(); }
  };
  try {
    const image = await renderDiagnosticImage(record);
    expect(image).toEqual({ dataUrl: 'data:image/png;base64,composed', width: 2200, height: 1100 });
    expect(context.strokeRect).toHaveBeenCalledWith(220, 220, 660, 440);
    expect(context.fillText.mock.calls[0][0]).toBe('Dentist finding (99%)');
    expect(context.fillText).toHaveBeenCalledTimes(1);
    context.strokeRect.mockClear();
    context.fillText.mockClear();
    await renderDiagnosticImage({ ai_findings: { ...record.ai_findings, annotations: [] } });
    expect(context.strokeRect).not.toHaveBeenCalled();
    expect(context.fillText).not.toHaveBeenCalled();
  } finally {
    global.Image = originalImage;
    getContext.mockRestore();
    toDataURL.mockRestore();
  }
});

test('legacy missing images are explicit, while broken stored images fail instead of being silently omitted', async () => {
  expect(await renderDiagnosticImage({ ai_findings: { annotations: [] } })).toBeNull();
  const originalImage = global.Image;
  global.Image = class { set src(value) { this.onerror(); } };
  try {
    await expect(renderDiagnosticImage(record)).rejects.toThrow('could not be loaded');
  } finally { global.Image = originalImage; }
});
