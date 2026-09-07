import jsPDF from "jspdf";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : "";

export const exportReceiptPDF = (patient, payment) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 8;
  const tableTop = 50;
  const rowHeight = 6.25;
  const totalRows = 37;
  const columns = [
    { label: "DATE", width: 34 },
    { label: "Procedure/s done", width: 77 },
    { label: "Charge", width: 23 },
    { label: "Paid", width: 23 },
    { label: "Balance", width: 23 },
    { label: "Next Visit", width: 22 },
  ];
  const patientName = [patient?.firstName, patient?.lastName]
    .filter(Boolean)
    .join(" ");
  let receiptDetails = payment?.receipt_details || {};
  if (typeof receiptDetails === "string") {
    try {
      receiptDetails = JSON.parse(receiptDetails);
    } catch {
      receiptDetails = {};
    }
  }
  const amount = Number(payment?.amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Clinic header
  doc.setFillColor(203, 184, 121);
  doc.circle(57, 17, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("O", 57, 20, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text("ORAVISTA DENTAL CLINIC", 74, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(patient?.selectedBranch || patient?.branch || "Philippines", 74, 17);
  doc.text("E-mail: oravista.clinic@gmail.com", 74, 20.5);
  doc.text("Contact No.: 0977-373-0874", 74, 24);

  // Patient-information line
  doc.setFontSize(7);
  doc.text("Name:", margin, 38);
  doc.setLineWidth(0.25);
  doc.line(19, 38.6, 141, 38.6);
  doc.setFont("helvetica", "bold");
  doc.text(patientName || "N/A", 21, 37.5);
  doc.setFont("helvetica", "normal");
  doc.text("Age:", 142, 38);
  doc.line(151, 38.6, 168, 38.6);
  doc.text(patient?.age ? String(patient.age) : "", 152, 37.5);
  doc.text("Gender:", 169, 38);
  doc.line(182, 38.6, 202, 38.6);
  doc.text(patient?.sex || "", 183, 37.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TREATMENT RECORD", pageWidth / 2, 47, { align: "center" });

  // Treatment record grid
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const tableHeight = rowHeight * (totalRows + 1);
  doc.setLineWidth(0.25);
  doc.rect(margin, tableTop, tableWidth, tableHeight);

  let x = margin;
  columns.slice(0, -1).forEach((column) => {
    x += column.width;
    doc.line(x, tableTop, x, tableTop + tableHeight);
  });
  for (let row = 1; row <= totalRows; row += 1) {
    doc.line(margin, tableTop + row * rowHeight, margin + tableWidth, tableTop + row * rowHeight);
  }

  doc.setFontSize(6.5);
  x = margin;
  columns.forEach((column) => {
    doc.text(column.label, x + column.width / 2, tableTop + 4.1, { align: "center" });
    x += column.width;
  });

  // Paid transaction entered in the first treatment-record row.
  const paymentRowY = tableTop + rowHeight + 4.1;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  x = margin;
  const values = [
    formatDate(payment?.appointment_date),
    receiptDetails.procedure || payment?.service_type || "Payment received",
    `PHP ${receiptDetails.charge || amount}`,
    `PHP ${receiptDetails.paid || amount}`,
    `PHP ${receiptDetails.balance || "0.00"}`,
    receiptDetails.nextVisit || "",
  ];
  values.forEach((value, index) => {
    doc.text(String(value), x + columns[index].width / 2, paymentRowY, {
      align: "center",
      maxWidth: columns[index].width - 2,
    });
    x += columns[index].width;
  });

  // Personal-use watermark, matching the supplied treatment-record layout.
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.1 }));
  doc.setTextColor(0, 17, 102);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(31);
  doc.text("FOR PERSONAL USE ONLY", pageWidth / 2, 185, {
    angle: 42,
    align: "center",
  });
  doc.restoreGraphicsState();

  const reference = String(payment?.booking_ref || payment?.id || "receipt").replace(
    /[^a-z0-9-_]/gi,
    "_",
  );
  doc.save(`OraVista_Receipt_${reference}.pdf`);
};
