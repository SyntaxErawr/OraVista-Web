import { drawPatientRecord, drawClinicHeader } from './clinicRecordLayout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to load image cleanly on the client side with CORS compatibility
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // prevent canvas taint issues
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

// Draw annotation bounding boxes and labels onto a clean canvas representation
const drawAnnotatedImage = (img, annotations, isVerified) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');

  // Draw base image
  ctx.drawImage(img, 0, 0);

  const borderColor = isVerified ? '#10b981' : '#ef4444';
  ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.005));

  annotations.forEach((ann) => {
    const box = ann.box;
    if (!box) return;

    // Scale box coordinates to canvas resolution
    const x = box.x_min * canvas.width;
    const y = box.y_min * canvas.height;
    const w = box.width * canvas.width;
    const h = box.height * canvas.height;

    // Draw box border
    ctx.strokeStyle = borderColor;
    ctx.strokeRect(x, y, w, h);

    // Draw label background
    const label = `${ann.name} (${Math.round(ann.confidence <= 1 ? ann.confidence * 100 : ann.confidence)}%)`;
    ctx.font = `bold ${Math.max(12, Math.round(canvas.width * 0.018))}px Helvetica`;
    const textWidth = ctx.measureText(label).width;
    const textHeight = Math.max(14, Math.round(canvas.width * 0.022));

    ctx.fillStyle = borderColor;
    ctx.fillRect(x - 1, y - textHeight - 2, textWidth + 6, textHeight + 2);

    // Draw label text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 2, y - 4);
  });

  return canvas.toDataURL('image/jpeg', 0.9);
};

// Helper to convert raw image to data url format via canvas
const getRawImageDataUrl = (img) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.9);
};

// Rotation-aligned personal use stamp helper without border
const addStamp = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  const text = "FOR PERSONAL USE ONLY";
  const angleDeg = 30;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();

    doc.setGState(new doc.GState({ opacity: 0.15 }));
    doc.setTextColor(76, 175, 80);
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");

    const pdfWidth = doc.internal.pageSize.width;
    const pdfHeight = doc.internal.pageSize.height;
    const cx = pdfWidth / 2;
    const cy = pdfHeight / 2;

    // Draw rotated text centered
    doc.text(text, cx, cy, { angle: angleDeg, align: "center", baseline: "middle" });

    doc.restoreGraphicsState();
  }
};

// Footer renderer
const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const pdfWidth = doc.internal.pageSize.width;
    const pdfHeight = doc.internal.pageSize.height;

    // Draw header / footer dividing rule
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(14, pdfHeight - 15, pdfWidth - 14, pdfHeight - 15);

    // Centered footer label and page count details
    doc.text("King Epres Dental Clinic - Patient Report - Confidential", pdfWidth / 2, pdfHeight - 10, { align: "center" });
    doc.text(`Page ${i} of ${pageCount}`, pdfWidth - 14, pdfHeight - 10, { align: "right" });
  }
};

// Dynamic page break handler helper
const checkPageBreak = (doc, currentY, neededHeight) => {
  if (currentY + neededHeight > 260) {
    doc.addPage();
    return 20;
  }
  return currentY;
};

// Export Patient PDF handler
export const exportPatientPDF = async (patient, medicalInfo, history, records) => {
  const doc = new jsPDF();
  drawPatientRecord(doc, patient, medicalInfo || {});
  doc.addPage();
  drawClinicHeader(doc, patient?.selectedBranch || patient?.branch);
  let currentY = 42;

  // 1. HEADER
  doc.setFontSize(22);
  doc.setTextColor(0, 17, 102);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Clinical Report", 14, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, currentY);
  currentY += 6;

  doc.setDrawColor(0, 17, 102);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, 196, currentY);
  currentY += 12;

  // 2. PATIENT PROFILE CARD DETAILS
  doc.setFontSize(14);
  doc.setTextColor(0, 17, 102);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Profile Information", 14, currentY);
  currentY += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const leftLabelX = 14;
  const leftValueX = 45;
  const rightLabelX = 110;
  const rightValueX = 140;

  // Format fallbacks
  const name = patient?.name || patient?.firstName ? `${patient?.name || `${patient?.firstName} ${patient?.lastName || ''}`}` : "N/A";
  const patientId = patient?.id || patient?.dbId ? `PT-100${patient?.dbId || patient?.id}` : "N/A";
  const age = patient?.age ?? "N/A";
  const email = patient?.email || "N/A";
  const contact = patient?.contact || patient?.phone || "N/A";
  const address = patient?.address || "Not recorded";

  // Row 1
  doc.setFont("helvetica", "bold"); doc.text("Patient Name:", leftLabelX, currentY);
  doc.setFont("helvetica", "normal"); doc.text(name, leftValueX, currentY);
  doc.setFont("helvetica", "bold"); doc.text("Email Address:", rightLabelX, currentY);
  doc.setFont("helvetica", "normal"); doc.text(email, rightValueX, currentY);
  currentY += 6;

  // Row 2
  doc.setFont("helvetica", "bold"); doc.text("Patient ID:", leftLabelX, currentY);
  doc.setFont("helvetica", "normal"); doc.text(patientId, leftValueX, currentY);
  doc.setFont("helvetica", "bold"); doc.text("Phone Number:", rightLabelX, currentY);
  doc.setFont("helvetica", "normal"); doc.text(contact, rightValueX, currentY);
  currentY += 6;

  // Row 3
  doc.setFont("helvetica", "bold"); doc.text("Age:", leftLabelX, currentY);
  doc.setFont("helvetica", "normal"); doc.text(String(age), leftValueX, currentY);
  doc.setFont("helvetica", "bold"); doc.text("Home Address:", rightLabelX, currentY);
  doc.setFont("helvetica", "normal"); doc.text(address, rightValueX, currentY);
  currentY += 15;

  // 3. MEDICAL INFORMATION TABLE
  currentY = checkPageBreak(doc, currentY, 35);
  doc.setFontSize(13);
  doc.setTextColor(0, 17, 102);
  doc.setFont("helvetica", "bold");
  doc.text("Medical Information Summary", 14, currentY);
  currentY += 5;

  const medData = [
    [
      medicalInfo?.blood_type || medicalInfo?.bloodType || "N/A",
      medicalInfo?.allergies || "None",
      medicalInfo?.insurance || "None",
      medicalInfo?.policy_number || medicalInfo?.policyNumber || "N/A"
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Blood Type", "Allergies", "Insurance Company", "Policy Number"]],
    body: medData,
    theme: "striped",
    headStyles: { fillColor: [0, 17, 102], fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 }
  });
  currentY = doc.lastAutoTable.finalY + 15;

  // 4. VISIT HISTORY TABLE
  currentY = checkPageBreak(doc, currentY, 35);
  doc.setFontSize(13);
  doc.setTextColor(0, 17, 102);
  doc.setFont("helvetica", "bold");
  doc.text("Visit & Appointment History", 14, currentY);
  currentY += 5;

  const visitRows = history.map((visit) => [
    new Date(visit.appointment_date || visit.date).toLocaleDateString(),
    visit.service_type || visit.service || "N/A",
    visit.dentist_name || visit.dentist || "N/A",
    visit.status || "Scheduled"
  ]);

  if (visitRows.length === 0) {
    visitRows.push(["No visit history recorded.", "", "", ""]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [["Date", "Service Rendered", "Attending Dentist", "Status"]],
    body: visitRows,
    theme: "striped",
    headStyles: { fillColor: [0, 17, 102], fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 }
  });
  currentY = doc.lastAutoTable.finalY + 15;

  // 5. DENTAL X-RAY DIAGNOSTICS (BULLETS + IMAGE SIDE-BY-SIDE)
  currentY = checkPageBreak(doc, currentY, 40);
  doc.setFontSize(14);
  doc.setTextColor(0, 17, 102);
  doc.setFont("helvetica", "bold");
  doc.text("Dental X-Ray Diagnostics & Imaging", 14, currentY);
  currentY += 10;

  if (records && records.length > 0) {
    for (let recordIndex = 0; recordIndex < records.length; recordIndex++) {
      const rec = records[recordIndex];
      currentY = checkPageBreak(doc, currentY, 110);

      doc.setFontSize(11);
      doc.setTextColor(0, 17, 102);
      doc.setFont("helvetica", "bold");
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(9);
      doc.text(`Uploaded and Scanned: ${new Date(rec.upload_date).toLocaleDateString()}`, 14, currentY + 4);
      currentY += 10;

      // Extract annotations JSON
      let parsed = null;
      if (rec.ai_findings) {
        if (typeof rec.ai_findings === 'string') {
          try { parsed = JSON.parse(rec.ai_findings); } catch (e) {}
        } else {
          parsed = rec.ai_findings;
        }
      }

      const annotations = parsed?.annotations || parsed?.predictions || [];
      const isVerified = parsed?.human_verified === true;

      // Draw Raw & Annotated Images side-by-side using dynamic canvas drawing
      if (rec.file_path) {
        let imageUrl = rec.file_path;
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
          imageUrl = `https://oravista-server-474976105474.asia-southeast1.run.app/${imageUrl}`;
        }

        try {
          // Load image with CORS
          const img = await loadImage(imageUrl);

          const rawDataUrl = getRawImageDataUrl(img);
          const annotatedDataUrl = drawAnnotatedImage(img, annotations, isVerified);

          // Add images side by side (each 80mm width, 55mm height)
          doc.addImage(rawDataUrl, 'JPEG', 14, currentY, 82, 55);
          doc.addImage(annotatedDataUrl, 'JPEG', 104, currentY, 82, 55);
          currentY += 60;
        } catch (imgError) {
          console.error("CORS / Image Load Failure during PDF generation:", imgError);
          // Fallback placeholder rendering
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(245, 245, 245);
          doc.rect(14, currentY, 82, 30, 'FD');
          doc.rect(104, currentY, 82, 30, 'FD');

          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text("Image not loaded (CORS restriction)", 20, currentY + 16);
          doc.text("Image not loaded (CORS restriction)", 110, currentY + 16);
          currentY += 36;
        }
      } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("No imaging scan attachment available.", 14, currentY);
        currentY += 8;
      }

      // Annotations bullets
      currentY = checkPageBreak(doc, currentY, 30);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("AI Diagnostic Findings:", 14, currentY);
      currentY += 6;

      doc.setFont("helvetica", "normal");
      if (annotations.length > 0) {
        for (let annIndex = 0; annIndex < annotations.length; annIndex++) {
          const ann = annotations[annIndex];
          doc.text(`• ${ann.name} (${Math.round(ann.confidence <= 1 ? ann.confidence * 100 : ann.confidence)}% Confidence)`, 18, currentY);
          currentY += 5;
        }
      } else {
        doc.text("• No visual pathology annotations found.", 18, currentY);
        currentY += 5;
      }
      currentY += 4;

      // Clinical notes fallback
      currentY = checkPageBreak(doc, currentY, 30);
      doc.setFont("helvetica", "bold");
      doc.text("Clinical Advisory Notes:", 14, currentY);
      currentY += 6;

      doc.setFont("helvetica", "normal");
      const clinicalNotesText = rec.clinical_notes && rec.clinical_notes.trim() !== "" 
        ? rec.clinical_notes 
        : "No clinical advisory notes compiled.";
      
      const splitNotes = doc.splitTextToSize(clinicalNotesText, 175);
      doc.text(splitNotes, 14, currentY);
      currentY += splitNotes.length * 5 + 15;
    }
  } else {
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("No diagnostic scans or records uploaded for this patient.", 14, currentY);
    currentY += 15;
  }

  // 6. STAMP & FOOTER
  addFooter(doc);
  addStamp(doc);

  // 7. DOWNLOAD
  const docName = `${name.replace(/\s+/g, '_')}_Clinical_Report.pdf`;
  doc.save(docName);
};
