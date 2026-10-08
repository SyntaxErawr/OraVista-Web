import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminDashboard from './A_AdminDashboardPage';
import { exportAdminDashboardPDF } from '../../utils/exportAdminDashboardPDF';

jest.mock('../../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../components/ClinicPageTitle', () => () => null);
jest.mock('../../components/ClinicPortalTools', () => ({ PortalSearch: () => null, RoleNotifications: () => null }));
jest.mock('../../utils/exportAdminDashboardPDF', () => ({ exportAdminDashboardPDF: jest.fn() }));

const originalFetch = global.fetch;
const appointments = Array.from({ length: 12 }, (_, id) => ({ id, patientName: `Patient ${id}`, status: 'Completed', time: '09:00', serviceType: 'Cleaning' }));
beforeEach(() => {
  exportAdminDashboardPDF.mockReset().mockResolvedValue();
  global.fetch = jest.fn(async url => ({ ok: true, json: async () => url.endsWith('stats')
    ? { todayCount: 2, monthPatients: 10, availableDentists: 4, totalDentists: 5, schedule: appointments }
    : { Manila: '1200.50' } }));
});
afterEach(() => { global.fetch = originalFetch; });

test('refreshes completed visits from the API while keeping other dashboard data unchanged', async () => {
  render(<AdminDashboard />);
  const panel = screen.getByRole('region', { name: 'Recent Patient Visits' });
  const refresh = within(panel).getByRole('button', { name: 'Refresh recent patient visits' });
  await waitFor(() => expect(refresh).toBeEnabled());
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ schedule: [
    { id: 99, patientName: 'Newest Visit', status: 'Completed', date: '2026-10-08', time: '10:00' },
    { id: 100, patientName: 'Unfinished Visit', status: 'Confirmed', date: '2026-10-08' },
  ] }) });
  fireEvent.click(refresh);
  expect(await within(panel).findByText('Newest Visit')).toBeInTheDocument();
  expect(within(panel).queryByText('Unfinished Visit')).not.toBeInTheDocument();
  expect(screen.getByText('4/5')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(3);
});

test('shows progress and exports the entire dashboard, including appointments beyond page one', async () => {
  render(<AdminDashboard />);
  const button = screen.getByRole('button', { name: 'Generate Report' });
  expect(button).toBeDisabled();
  await waitFor(() => expect(button).toBeEnabled());
  expect(screen.getByText('4/5')).toBeInTheDocument();
  fireEvent.click(button);
  expect(screen.getByRole('dialog')).toHaveTextContent('Generating report...');
  expect(button).toBeDisabled();
  await screen.findByText('Report generated');
  expect(exportAdminDashboardPDF).toHaveBeenCalledWith(expect.objectContaining({
    appointments, recentVisits: appointments, branchEarnings: { Manila: '1200.50' },
    stats: expect.objectContaining({ totalAppointments: 12, availableDentists: 4 }),
  }));
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('reports PDF failures and allows another attempt', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  exportAdminDashboardPDF.mockRejectedValueOnce(new Error('Download failed'));
  render(<AdminDashboard />);
  const button = screen.getByRole('button', { name: 'Generate Report' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await screen.findByText('Unable to generate report');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(button);
  await screen.findByText('Report generated');
  jest.restoreAllMocks();
});

test('does not export misleading zero totals after a dashboard request fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch.mockResolvedValue({ ok: false });
  render(<AdminDashboard />);
  const button = screen.getByRole('button', { name: 'Generate Report' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  expect(screen.getByRole('dialog')).toHaveTextContent('Dashboard data could not be loaded');
  expect(exportAdminDashboardPDF).not.toHaveBeenCalled();
  jest.restoreAllMocks();
});
