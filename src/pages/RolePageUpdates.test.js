import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import StaffDashboard from './c_staff/A_StaffDashboardPage';
import DentistDashboard from './d_dentist/A_DentistDashboardPage';
import StaffDentistList from './c_staff/C_StaffDentistListPage';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('../components/ClinicPageTitle', () => () => null);
jest.mock('../components/ClinicPortalTools', () => ({ PortalSearch: () => null, RoleNotifications: () => null }));
const originalFetch = global.fetch;
const now = new Date();
const key = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = key(now);
const previous = key(new Date(now.getFullYear(), now.getMonth() - 1, 1));
const schedule = [
  { id: 1, patientId: 10, patientName: 'Older Visit', date: previous, growthDate: previous, time: '09:00', status: 'Completed' },
  { id: 2, patientId: 10, patientName: 'Newest Visit', date: today, growthDate: today, time: '10:00', status: 'Completed' },
  { id: 3, patientId: 11, patientName: 'New Patient', date: today, growthDate: today, time: '11:00', status: 'Completed' },
  { id: 4, patientId: 12, patientName: 'Pending Patient', date: today, growthDate: today, status: 'Pending' },
];
const stats = { todayCount: 3, availableDentists: 4, totalDentists: 5, monthPatients: 3, schedule };
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => stats }); });
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

test.each([['staff', StaffDashboard], ['dentist', DentistDashboard]])('%s dashboard shows growth, newest-first completed visits and supports refresh', async (_, Page) => {
  render(<Page />);
  const panel = screen.getByRole('region', { name: 'Recent Patient Visits' });
  expect(within(panel).getByRole('status')).toHaveTextContent('Loading');
  await within(panel).findByText('Newest Visit');
  expect(screen.getByText('4/5')).toBeInTheDocument();
  expect(within(panel).getAllByText(/^(Older Visit|Newest Visit|New Patient)$/).map(node => node.textContent)).toEqual(['New Patient', 'Newest Visit', 'Older Visit']);
  expect(within(panel).queryByText('Pending Patient')).not.toBeInTheDocument();
  const group = screen.getByRole('group', { name: 'Patient growth over the last six months' });
  expect(within(group).getAllByRole('button')).toHaveLength(6);
  expect(within(group).getByRole('button', { name: /2 patients, 1 new, 1 returning/ })).toBeInTheDocument();
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...stats, schedule: [{ ...schedule[1], patientName: 'Refreshed Visit' }] }) });
  fireEvent.click(within(panel).getByRole('button', { name: 'Refresh recent patient visits' }));
  await within(panel).findByText('Refreshed Visit');
  expect(within(panel).queryByText('Newest Visit')).not.toBeInTheDocument();
});

test('staff retains the schedule restriction to today, while growth uses earlier history', async () => {
  render(<StaffDashboard />);
  await screen.findByText('4/5');
  expect(screen.getAllByText('Older Visit')).toHaveLength(1);
  expect(screen.getByText('Pending Patient')).toBeInTheDocument();
});

test.each([['staff', StaffDashboard], ['dentist', DentistDashboard]])('%s dashboard does not misrepresent failed requests as empty visit data', async (_, Page) => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch.mockResolvedValue({ ok: false });
  render(<Page />);
  const panel = screen.getByRole('region', { name: 'Recent Patient Visits' });
  expect(await within(panel).findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.getByText(/Patient growth could not be loaded/)).toBeInTheDocument();
});

test('staff directory includes appointment-only dentists across pages with staff schedule actions', async () => {
  const data = Array.from({ length: 21 }, (_, id) => ({ id, first_name: `Dentist${id}`, last_name: 'Test', status: 'Available' }));
  data.push({ id: null, directory_id: 'APPT-1', display_name: 'Dra. Appointment Dentist', appointment_only: true, patient_count: 2, status: 'Busy', branch: 'Main Branch' });
  global.fetch.mockResolvedValue({ ok: true, json: async () => data });
  render(<StaffDentistList />);
  await screen.findByText('Dr. Dentist0 Test');
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/dentists'));
  expect(screen.getByRole('region', { name: 'Dentist directory table' })).toHaveStyle({ overflow: 'auto' });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Dra. Appointment Dentist')).toBeInTheDocument();
  expect(screen.getByText(/No registered account/)).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Search by name, specialty, or ID...'), { target: { value: 'Appointment Dentist' } });
  await waitFor(() => expect(screen.getByText('1-1 of 1')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /Details/ }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Main Branch');
});

test('staff directory reports load errors', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch.mockResolvedValue({ ok: false });
  render(<StaffDentistList />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Dentists could not be loaded');
});
