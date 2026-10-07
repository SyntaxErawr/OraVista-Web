import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DentistDiagnostics from './E_DentistDiagnosticPage';

jest.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams('patient_id=7')] }), { virtual: true });
jest.mock('../../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../components/ClinicPageTitle', () => () => null);
jest.mock('../../components/ClinicPortalTools', () => ({ PortalSearch: () => null, RoleNotifications: () => null }));

const originalFetch = global.fetch;
const originalCreateURL = URL.createObjectURL;
const originalRevokeURL = URL.revokeObjectURL;
const originalConsoleError = console.error;
const reply = data => ({ ok: true, json: async () => data });
const saved = { id: 12, patient_id: 7, clinical_notes: 'Saved clinical notes', ai_findings: {
  human_verified: true, xray_image_path: 'uploads/record_diagnostic_12_test.png', annotations: [],
  predictions: [{ name: 'Removed prediction', box: { x_min: 0.1, y_min: 0.2, width: 0.3, height: 0.4 } }],
} };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
    // Existing portal styles mix border shorthand and longhand declarations.
    if (typeof message === 'string' && message.includes('a style property during rerender')) return;
    originalConsoleError(message, ...args);
  });
  URL.createObjectURL = jest.fn(() => 'blob:local-preview');
  URL.revokeObjectURL = jest.fn();
  global.fetch = jest.fn(async url => {
    if (url.endsWith('/api/patients')) return reply([{ id: 7, first_name: 'Test', last_name: 'Patient' }]);
    if (url.includes('patient-final-diagnoses')) return reply([]);
    if (url.endsWith('/upload')) return reply({ diagnostic_id: 12, patient_id: 7, file_path: '/temporary.png', predictions: [] });
    if (url.endsWith('/12/final')) return reply({ diagnostic: saved });
    throw new Error(`Unexpected request: ${url}`);
  });
});
afterEach(() => { global.fetch = originalFetch; URL.createObjectURL = originalCreateURL; URL.revokeObjectURL = originalRevokeURL; jest.restoreAllMocks(); });

test('saving a newly analyzed scan sends the original image and exact final annotations to the persistent server endpoint', async () => {
  const { container } = render(<DentistDiagnostics />);
  await screen.findByDisplayValue('Test Patient');
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('patient-final-diagnoses/7'), expect.anything()));
  const file = new File(['original scan'], 'scan.png', { type: 'image/png' });
  fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save Final Diagnosis' })).toBeEnabled());
  fireEvent.change(screen.getByPlaceholderText('Enter final diagnosis and recommendations here. AI findings are supportive only.'), { target: { value: 'Final dentist notes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Final Diagnosis' }));
  await screen.findByText('Final Diagnosis Saved');
  const [url, options] = global.fetch.mock.calls.find(([url]) => url.endsWith('/12/final'));
  expect(url).toContain('/api/diagnostic-imaging/12/final');
  expect(options.method).toBe('PUT');
  expect(options.body.get('xray').name).toBe('scan.png');
  expect(options.body.get('patient_id')).toBe('7');
  expect(options.body.get('clinical_notes')).toBe('Final dentist notes');
  expect(JSON.parse(options.body.get('annotations'))).toEqual([]);
});

test('reopening a saved diagnosis restores its persistent image, retains removed findings, and edits notes without reuploading', async () => {
  const fetchDefault = global.fetch.getMockImplementation();
  global.fetch.mockImplementation(async (url, options) => url.includes('patient-final-diagnoses') ? reply([saved]) : fetchDefault(url, options));
  render(<DentistDiagnostics />);
  const image = await screen.findByRole('img', { name: 'AI Analyzed Scan' });
  expect(image).toHaveAttribute('src', expect.stringContaining('/uploads/record_diagnostic_12_test.png'));
  expect(screen.queryByText('Removed prediction')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Clinical Notes' }));
  fireEvent.change(screen.getByDisplayValue('Saved clinical notes'), { target: { value: 'Updated notes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Final Diagnosis' }));
  await screen.findByText('Final Diagnosis Updated');
  const [, options] = global.fetch.mock.calls.find(([url]) => url.endsWith('/12/final'));
  expect(options.body.get('xray')).toBeNull();
  expect(options.body.get('clinical_notes')).toBe('Updated notes');
  expect(JSON.parse(options.body.get('annotations'))).toEqual([]);
  expect(screen.getByTitle('Remove image and upload another')).toBeInTheDocument();
});

test('failed analysis leaves saving disabled instead of inventing a diagnosis ID and findings', async () => {
  const fetchDefault = global.fetch.getMockImplementation();
  global.fetch.mockImplementation(async (url, options) => {
    if (url.endsWith('/upload')) throw new Error('Imaging service offline');
    return fetchDefault(url, options);
  });
  const { container } = render(<DentistDiagnostics />);
  await screen.findByDisplayValue('Test Patient');
  fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [new File(['scan'], 'scan.png', { type: 'image/png' })] } });
  await screen.findByText('Unable to Analyze X-ray');
  expect(screen.getByRole('button', { name: 'Save Final Diagnosis' })).toBeDisabled();
  expect(global.fetch.mock.calls.some(([url]) => url.endsWith('/final'))).toBe(false);
});
