import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddPatientModal from './AddPatientModal';
import AdminPatientList from '../pages/b_admin/B_AdminPatientListPage';
import StaffPatientList from '../pages/c_staff/B_StaffPatientListPage';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('./AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('./ClinicPageTitle', () => () => null);
jest.mock('./ClinicPortalTools', () => ({ PortalSearch: () => null, RoleNotifications: () => null }));
jest.mock('./AIDiagnosticModal', () => () => null);
jest.mock('../utils/exportPDF', () => ({ exportPatientPDF: jest.fn() }));

const originalFetch = global.fetch;
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { global.fetch = originalFetch; });
const fill = () => {
  for (const [label, value] of [['First Name *', ' Jane '], ['Last Name *', ' Doe '], ['Email Address *', 'JANE@example.com'], ['Mobile Number *', '09123456789'], ['Password *', 'StrongPass123!'], ['Confirm Password *', 'StrongPass123!']]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
};

test('validates required data and password confirmation before sending a request', () => {
  render(<AddPatientModal onClose={jest.fn()} onCreated={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add Patient' }));
  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  fill();
  fireEvent.change(screen.getByLabelText('Confirm Password *'), { target: { value: 'WrongPassword1!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Patient' }));
  expect(screen.getByText('Passwords must match.')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('creates only a patient with normalized input, blocks duplicate submission and refreshes the list', async () => {
  let finish;
  global.fetch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const onCreated = jest.fn().mockResolvedValue();
  render(<AddPatientModal onClose={jest.fn()} onCreated={onCreated} />);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Add Patient' }));
  expect(screen.getByRole('button', { name: 'Adding Patient...' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('button', { name: 'Adding Patient...' }).closest('form'));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '09123456789', role: 'patient', branch: 'Gil Puyat, Pasay' });
  finish({ ok: true });
  expect(await screen.findByRole('status')).toHaveTextContent('Patient added successfully');
  expect(onCreated).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Add Patient' })).not.toBeInTheDocument();
});

test('shows duplicate-email errors and retains form details for correction', async () => {
  global.fetch.mockResolvedValue({ ok: false, json: async () => ({ message: 'Email already registered.', errors: { email: 'Email already registered.' } }) });
  render(<AddPatientModal onClose={jest.fn()} onCreated={jest.fn()} />);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Add Patient' }));
  await waitFor(() => expect(screen.getByLabelText('Email Address *')).toHaveAttribute('aria-invalid', 'true'));
  expect(screen.getByLabelText('First Name *')).toHaveValue(' Jane ');
  expect(screen.getByRole('button', { name: 'Add Patient' })).toBeEnabled();
});

test('list-refresh failure after creation does not permit creating the patient twice', async () => {
  global.fetch.mockResolvedValue({ ok: true });
  const onCreated = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce();
  render(<AddPatientModal onClose={jest.fn()} onCreated={onCreated} />);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Add Patient' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Retry refreshing list' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('list has been updated'));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(onCreated).toHaveBeenCalledTimes(2);
});

test.each([['admin', AdminPatientList], ['staff', StaffPatientList]])('%s button opens the form and updates its patient table after saving', async (_, Page) => {
  const patients = [{ id: 1, name: 'Existing Patient', contact: '09111111111' }];
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => patients })
    .mockResolvedValueOnce({ ok: true })
    .mockResolvedValueOnce({ ok: true, json: async () => [...patients, { id: 2, name: 'Jane Doe', contact: '09123456789' }] });
  render(<Page />);
  await screen.findByText('Existing Patient');
  fireEvent.click(screen.getByRole('button', { name: 'Add New Patient' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Add Patient' }));
  expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: 'Done' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('cancel closes without submitting', () => {
  const onClose = jest.fn();
  render(<AddPatientModal onClose={onClose} onCreated={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(global.fetch).not.toHaveBeenCalled();
});
