import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import RecordsPage from './K_RecordsPage';
import { renderDiagnosticImage } from '../../utils/diagnosticImage';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn(), useLocation: () => ({ pathname: '/records' }) }), { virtual: true });
jest.mock('../../components/PatientAccount', () => () => null);
jest.mock('jspdf', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('jspdf-autotable', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../utils/diagnosticImage', () => ({
  getDiagnosticImageSource: record => record.ai_findings?.xray_image_path || null,
  renderDiagnosticImage: jest.fn(),
}));

const finalRecord = { id: 12, scan_date: '2026-10-07', clinical_notes: 'Dentist saved notes',
  ai_findings: { human_verified: true, xray_image_path: 'uploads/record_diagnostic_12_test.png', annotations: [{ name: 'Saved finding' }] } };
let pdf;
const originalFetch = global.fetch;

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 7, firstName: 'Test', lastName: 'Patient' }));
  global.fetch = jest.fn(async url => ({ ok: true, json: async () => url.includes('patient-final-diagnoses') ? [finalRecord] : {} }));
  renderDiagnosticImage.mockReset().mockResolvedValue({ dataUrl: 'data:image/png;base64,annotated', width: 2200, height: 1100 });
  pdf = { setFontSize: jest.fn(), setTextColor: jest.fn(), text: jest.fn(), setFont: jest.fn(), splitTextToSize: value => [value],
    addPage: jest.fn(), addImage: jest.fn(), save: jest.fn(), lastAutoTable: { finalY: 80 },
    internal: { getNumberOfPages: () => 0, pageSize: { getWidth: () => 210, getHeight: () => 297 } } };
  jsPDF.mockImplementation(() => pdf);
  autoTable.mockClear();
  autoTable.mockImplementation(doc => { doc.lastAutoTable = { finalY: 80 }; });
});
afterEach(() => { localStorage.clear(); global.fetch = originalFetch; jest.restoreAllMocks(); });

test('records displays the composed X-ray and PDF includes the same saved image with findings and notes', async () => {
  render(<RecordsPage />);
  expect(await screen.findByRole('img', { name: /X-ray with dentist-saved annotations/ })).toHaveAttribute('src', 'data:image/png;base64,annotated');
  fireEvent.click(screen.getByRole('button', { name: 'Download Report' }));
  await waitFor(() => expect(pdf.save).toHaveBeenCalledWith('Test_Patient_OraVista_Report.pdf'));
  expect(pdf.addImage).toHaveBeenCalledWith('data:image/png;base64,annotated', 'PNG', 14, 100, 182, 91);
  const body = autoTable.mock.calls.at(-1)[1].body.flat();
  expect(body).toContain('Saved finding');
  expect(body).toContain('Dentist saved notes');
});

test('large images move to another page and retain their proportions', async () => {
  renderDiagnosticImage.mockResolvedValue({ dataUrl: 'data:image/png;base64,tall', width: 100, height: 1000 });
  render(<RecordsPage />);
  await screen.findByRole('img', { name: /X-ray with dentist-saved annotations/ });
  fireEvent.click(screen.getByRole('button', { name: 'Download Report' }));
  await waitFor(() => expect(pdf.save).toHaveBeenCalled());
  expect(pdf.addPage).toHaveBeenCalledTimes(2);
  const [, , x, y, width, height] = pdf.addImage.mock.calls[0];
  expect(y).toBe(32);
  expect(width / height).toBeCloseTo(0.1);
  expect(x).toBeGreaterThan(14);
  expect(y + height).toBeLessThanOrEqual(277);
});

test('failed X-ray loading prevents an incomplete PDF download', async () => {
  const alert = jest.spyOn(window, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  renderDiagnosticImage.mockRejectedValue(new Error('The saved X-ray could not be loaded.'));
  render(<RecordsPage />);
  await screen.findByRole('button', { name: 'Retry X-ray' });
  fireEvent.click(screen.getByRole('button', { name: 'Download Report' }));
  await waitFor(() => expect(alert).toHaveBeenCalledWith(expect.stringContaining('Final diagnosis #12')));
  expect(pdf.save).not.toHaveBeenCalled();
});

test('legacy diagnoses without images still export their saved text and an explicit missing-image message', async () => {
  const legacy = { ...finalRecord, ai_findings: { human_verified: true, annotations: [] } };
  global.fetch.mockImplementation(async url => ({ ok: true, json: async () => url.includes('patient-final-diagnoses') ? [legacy] : {} }));
  renderDiagnosticImage.mockResolvedValue(null);
  render(<RecordsPage />);
  await screen.findByText('The original X-ray is unavailable for this saved diagnosis.');
  fireEvent.click(screen.getByRole('button', { name: 'Download Report' }));
  await waitFor(() => expect(pdf.save).toHaveBeenCalled());
  expect(pdf.addImage).not.toHaveBeenCalled();
  expect(pdf.text).toHaveBeenCalledWith('The original X-ray is unavailable for this saved diagnosis.', 14, 92);
  expect(autoTable.mock.calls.at(-1)[1].body.flat()).toContain('No findings retained in the saved final diagnosis.');
});
