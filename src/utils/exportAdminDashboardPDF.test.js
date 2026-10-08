import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportAdminDashboardPDF } from './exportAdminDashboardPDF';

jest.mock('jspdf', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('jspdf-autotable', () => ({ __esModule: true, default: jest.fn() }));

test('PDF contains each dashboard section, accurate revenue totals and the full schedule', async () => {
  const doc = { setFontSize: jest.fn(), text: jest.fn(), addPage: jest.fn(), setPage: jest.fn(), getNumberOfPages: () => 2, save: jest.fn().mockResolvedValue() };
  jsPDF.mockImplementation(() => doc);
  autoTable.mockImplementation(pdf => { pdf.lastAutoTable = { finalY: 260 }; });
  const appointments = Array.from({ length: 25 }, (_, id) => ({ id, date: '2026-10-08', patientName: `Patient ${id}`, status: 'Completed' }));
  await exportAdminDashboardPDF({
    stats: { totalAppointments: 25, todayCount: 3, availableDentists: 2, totalDentists: 4, monthPatients: 12 },
    appointments, recentVisits: appointments, branchEarnings: { Manila: '100.50', Quezon: '200.25' },
  });
  const tables = autoTable.mock.calls.map(([, options]) => options);
  expect(tables[0].body).toContainEqual(['Dentist availability', '2/4']);
  expect(tables[1].body).toContainEqual(['Total', 'PHP 300.75']);
  expect(tables[2].body.flat().join(' ')).toContain('across all dates');
  expect(tables[3].body).toHaveLength(25);
  expect(tables[4].body).toHaveLength(25);
  expect(doc.addPage).toHaveBeenCalled();
  expect(doc.setPage).toHaveBeenCalledWith(2);
  expect(doc.save).toHaveBeenCalledWith(expect.stringMatching(/^OraVista_Admin_Dashboard_\d{4}-\d{2}-\d{2}\.pdf$/), { returnPromise: true });
});
