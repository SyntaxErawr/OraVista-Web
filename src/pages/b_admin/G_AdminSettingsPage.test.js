import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminSettings from './G_AdminSettingsPage';
jest.mock('../../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../components/ClinicPageTitle', () => () => null);
jest.mock('../../components/ClinicPortalTools', () => ({ PortalSearch: () => null, RoleNotifications: () => null }));

const originalFetch = global.fetch;
const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
let reload;
beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 7, role: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', phone: '09123456789' }));
  global.fetch = jest.fn();
  reload = jest.fn();
  Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});
afterEach(() => {
  localStorage.clear(); global.fetch = originalFetch;
  Object.defineProperty(window, 'location', locationDescriptor);
  jest.restoreAllMocks();
});

test('successful profile save confirms in a modal and reloads only after acknowledgement', async () => {
  global.fetch.mockResolvedValue({ ok: true });
  render(<AdminSettings />);
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Updated' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(await screen.findByRole('dialog')).toHaveTextContent('Profile updated successfully!');
  expect(window.alert).not.toHaveBeenCalled();
  expect(reload).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ firstName: 'Updated', role: 'admin' });
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({ id: 7, firstName: 'Updated' });
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  expect(reload).toHaveBeenCalledTimes(1);
});

test('server errors use a dismissible modal and preserve existing stored information', async () => {
  global.fetch.mockResolvedValue({ ok: false, json: async () => ({ message: 'Email already registered.' }) });
  render(<AdminSettings />);
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered.');
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(reload).not.toHaveBeenCalled();
  expect(window.alert).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem('user')).firstName).toBe('Admin');
});

test('pending saves prevent duplicate clicks and connection errors appear in the modal', async () => {
  let reject;
  global.fetch.mockImplementation(() => new Promise((resolve, fail) => { reject = fail; }));
  render(<AdminSettings />);
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  const saving = screen.getByRole('button', { name: 'Saving...' });
  expect(saving).toBeDisabled();
  fireEvent.click(saving);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  reject(new Error('offline'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection Error');
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled());
  expect(reload).not.toHaveBeenCalled();
  expect(window.alert).not.toHaveBeenCalled();
});
