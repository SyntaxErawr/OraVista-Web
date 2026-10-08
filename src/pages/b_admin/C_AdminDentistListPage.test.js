import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminDentistList from './C_AdminDentistListPage';
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../components/ClinicPageTitle', () => () => null);
jest.mock('../../components/ClinicPortalTools', () => ({ RoleNotifications: () => null }));
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

test('all dentists including appointment-only entries appear across pagination and search', async () => {
  const dentists = Array.from({ length: 21 }, (_, id) => ({ id, first_name: `Dentist${id}`, last_name: 'Test', patient_count: id === 20 ? 4 : 0, status: id === 20 ? 'Busy' : 'Available' }));
  dentists.push({ id: null, directory_id: 'APPT-1', display_name: 'Dra. Appointment Dentist', appointment_only: true, patient_count: 2, status: 'Busy', branch: 'Main Branch' });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => dentists });
  render(<AdminDentistList />);
  await screen.findByText('Dr. Dentist0 Test');
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/dentists'));
  expect(screen.getByText('1-20 of 22')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Dr. Dentist20 Test')).toBeInTheDocument();
  expect(screen.getByText('4 assigned')).toBeInTheDocument();
  expect(screen.getByText('Dra. Appointment Dentist')).toBeInTheDocument();
  expect(screen.getByText(/No registered account/)).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Search by name, specialty, or ID...'), { target: { value: 'Appointment Dentist' } });
  await waitFor(() => expect(screen.getByText('1-1 of 1')).toBeInTheDocument());
  expect(screen.getByText('Dra. Appointment Dentist')).toBeInTheDocument();
});

test.each([{ ok: false }, { ok: true, json: async () => ({ message: 'Invalid response' }) }])('API failure is reported rather than shown as an empty dentist directory', async response => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch = jest.fn().mockResolvedValue(response);
  render(<AdminDentistList />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Dentists could not be loaded');
  expect(screen.queryByText(/No records found/)).not.toBeInTheDocument();
});
