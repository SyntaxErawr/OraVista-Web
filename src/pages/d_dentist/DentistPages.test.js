import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DentistDashboard from './A_DentistDashboardPage';
import DentistPatientList from './B_DentistPatientListPage';
import DentistProfile from './C_DentistProfilePage';
import { clinicDay } from '../../utils/clinicAppointments';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../components/ClinicPageTitle', () => () => null);
jest.mock('../../components/ClinicPortalTools', () => ({ PortalSearch: () => null, RoleNotifications: () => null }));
jest.mock('../../components/PatientGrowthChart', () => () => null);

const originalFetch = global.fetch;
const user = { id: 7, role: 'dentist', firstName: 'Anna', lastName: 'Lee' };
const response = data => ({ ok: true, json: async () => data });
beforeEach(() => {
  localStorage.setItem('user', JSON.stringify(user));
  mockNavigate.mockClear();
  global.fetch = jest.fn();
});
afterEach(() => { global.fetch = originalFetch; localStorage.clear(); });

test('dashboard shows only today in the schedule and scopes visits to the logged-in dentist', async () => {
  global.fetch.mockResolvedValue(response({ availableDentists: 2, totalDentists: 3, schedule: [
    { id: 1, dentist: 'Dr. Anna Lee', patientName: 'Today Patient', patientId: 1, date: clinicDay(), status: 'Confirmed' },
    { id: 2, dentist: 'Dr. Anna Lee', patientName: 'Old Patient', patientId: 2, date: '2020-01-01', status: 'Completed' },
    { id: 3, dentist: 'Dr. Other Dentist', patientName: 'Other Patient', date: clinicDay(), status: 'Confirmed' },
  ] }));
  render(<DentistDashboard />);
  expect(await screen.findByText('Today Patient')).toBeInTheDocument();
  expect(screen.queryByText('Other Patient')).not.toBeInTheDocument();
  expect(screen.getByText('Old Patient')).toBeInTheDocument();
  expect(screen.getByText("Today's Schedule").parentElement).not.toHaveTextContent('Old Patient');
  expect(screen.getByText("Today's Appointments").parentElement).toHaveTextContent('1');
  expect(screen.getByText('Dr. Lee')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh recent patient visits' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
});

test('patient list derives procedures and upcoming visits and routes existing action buttons', async () => {
  global.fetch.mockImplementation(async url => response(url.endsWith('/patients') ? [{ id: 11, name: 'Alice Patient', contact: '12345', age: 0 }] : { schedule: [
    { id: 1, patientId: 11, date: '2020-01-01', status: 'Completed', serviceType: 'Cleaning' },
    { id: 2, patientId: 11, date: '2099-01-01', status: 'Confirmed' },
    { id: 3, patientId: 11, date: clinicDay(), status: 'Cancelled' },
  ] }));
  render(<DentistPatientList />);
  expect(await screen.findByText('Cleaning')).toBeInTheDocument();
  expect(screen.queryByText('Not Scheduled')).not.toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Quick search by name or ID...'), { target: { value: '12345' } });
  expect(screen.getByText('Alice Patient')).toBeInTheDocument();
  fireEvent.click(screen.getByTitle('Diagnostics'));
  expect(mockNavigate).toHaveBeenLastCalledWith('/dentist/diagnostics?patient_id=11');
  fireEvent.click(screen.getByTitle('Full Profile'));
  expect(mockNavigate).toHaveBeenLastCalledWith('/dentist/patient-profile/11');
});

test('profile loads the session dentist and opens an assigned patient', async () => {
  global.fetch.mockResolvedValue(response({ profile: { id: 7, first_name: 'Anna', last_name: 'Lee', email: 'anna@example.com' }, patients: [{ id: 11, name: 'Alice Patient' }], schedule: [] }));
  render(<DentistProfile />);
  expect(await screen.findByText('Dr. Anna Lee')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/dentist-profile/7'));
  expect(screen.getByText('No Visits')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'View Profile' }));
  expect(mockNavigate).toHaveBeenCalledWith('/dentist/patient-profile/11');
});

test('profile rejects a response for a different dentist', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch.mockResolvedValue(response({ profile: { id: 8, first_name: 'Other', last_name: 'Dentist' }, patients: [], schedule: [] }));
  render(<DentistProfile />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Your dentist profile could not be loaded');
  expect(screen.queryByText('Dr. Other Dentist')).not.toBeInTheDocument();
  jest.restoreAllMocks();
});

test('patient list reports request failures instead of an empty directory', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  global.fetch.mockResolvedValue({ ok: false });
  render(<DentistPatientList />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Patient data could not be loaded');
  jest.restoreAllMocks();
});
