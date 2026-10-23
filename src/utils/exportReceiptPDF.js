import jsPDF from 'jspdf';
import { billingAmounts } from './billingAmounts';
import { drawTreatmentRecord } from './clinicRecordLayout';

export const exportReceiptPDF = (patient, payment) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawTreatmentRecord(doc, patient, payment, billingAmounts(payment));
  const reference = String(payment?.booking_ref || payment?.id || 'receipt').replace(/[^a-z0-9-_]/gi, '_');
  doc.save(`King_Epres_Treatment_Record_${reference}.pdf`);
};
