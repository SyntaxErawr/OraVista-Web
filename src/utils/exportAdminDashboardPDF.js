import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function exportAdminDashboardPDF({ stats, appointments, recentVisits, branchEarnings }) {
  const doc = new jsPDF();
  const generatedAt = new Date();
  doc.setFontSize(20);
  doc.text('OraVista Admin Dashboard Report', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${generatedAt.toLocaleString()}`, 14, 28);
  let y = 38;
  const section = (title, head, body) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.text(title, 14, y);
    autoTable(doc, {
      startY: y + 5, head: [head], body,
      theme: 'striped', headStyles: { fillColor: [8, 127, 140] },
      styles: { fontSize: 9, overflow: 'linebreak' }, margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 14;
  };
  section('Dashboard Summary', ['Metric', 'Value'], [
    ['Current date', generatedAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
    ['Total appointments', String(stats.totalAppointments)],
    ['Appointments today', String(stats.todayCount)],
    ['Dentist availability', `${stats.availableDentists}/${stats.totalDentists}`],
    ['Patients this month', String(stats.monthPatients)],
    ['Completed visits', String(recentVisits.length)],
    ['Patient growth', 'Growth analytics are not yet available on the dashboard.'],
  ]);
  const money = amount => `PHP ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  section('Branch Earnings', ['Branch', 'Earnings (PHP)'], [
    ...Object.entries(branchEarnings).map(([branch, amount]) => [branch, money(amount)]),
    ['Total', money(Object.values(branchEarnings).reduce((sum, amount) => sum + Number(amount || 0), 0))],
  ]);
  section('Report Scope', ['Dashboard section', 'Data scope'], [
    ['Schedule / total appointments', 'All appointments returned by the dashboard API, across all dates.'],
    ['Branch earnings', 'All non-cancelled appointment amounts returned by the dashboard API, across all dates.'],
    ['Recent patient visits', 'All completed appointments in the loaded dashboard data.'],
    ['Snapshot', 'Uses the loaded dashboard data at the time Generate Report was clicked.'],
  ]);
  section('Recent Patient Visits', ['Patient', 'Reference', 'Service', 'Time'],
    recentVisits.length ? recentVisits.map(visit => [visit.patientName, visit.booking_ref || `PT-100${visit.id}`, visit.serviceType || 'Check-up', visit.time || 'Completed']) : [['No recent patient visits recorded.', '', '', '']]);
  section('Appointment Schedule (All Dates)', ['Date', 'Time', 'Patient', 'Dentist', 'Service', 'Status'],
    appointments.length ? appointments.map(item => [item.date ? String(item.date).slice(0, 10) : 'N/A', item.time || 'N/A', item.patientName || 'Guest', item.dentist || 'N/A', item.serviceType || 'N/A', item.status || 'N/A']) : [['No appointments scheduled.', '', '', '', '', '']]);
  for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.text(`Page ${page} of ${doc.getNumberOfPages()}`, 14, 289);
  }
  const date = [generatedAt.getFullYear(), String(generatedAt.getMonth() + 1).padStart(2, '0'), String(generatedAt.getDate()).padStart(2, '0')].join('-');
  await doc.save(`OraVista_Admin_Dashboard_${date}.pdf`, { returnPromise: true });
}
