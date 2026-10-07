import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import SettingsPage from './L_SettingsPage';
import LoginPage from './B_LoginPage';
import DashboardPage from './J_DashboardPage';

const mockLocation = { pathname: '/settings' };
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(), useLocation: () => mockLocation,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });
const originalFetch = global.fetch;
const reply = (data, ok = true) => ({ ok, json: async () => data });
beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 7, firstName: 'Test', email: 'test@example.test' }));
  global.fetch = jest.fn(async () => reply({ challengeId: 'challenge-1' }));
});
afterEach(() => { localStorage.clear(); global.fetch = originalFetch; });

async function confirmPasswordChange() {
  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Change Password' }));
  fireEvent.change(screen.getByLabelText('old'), { target: { value: 'OldPassword1!' } });
  fireEvent.change(screen.getByLabelText('next'), { target: { value: 'NewPassword2!' } });
  fireEvent.change(screen.getByLabelText('confirm'), { target: { value: 'NewPassword2!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Confirm Changes?' })).getByRole('button', { name: 'Confirm', exact: true }));
}

test('password success waits for the existing update endpoint and prevents repeated requests', async () => {
  let finish;
  global.fetch.mockImplementation(async (url) => url.endsWith('/api/send-otp')
    ? reply({ challengeId: 'challenge-1' }) : url.endsWith('/api/verify-otp') ? reply({verificationToken: 'proof-1'}) : new Promise(resolve => { finish = resolve; }));
  await confirmPasswordChange();
  const dialog = await screen.findByRole('dialog', { name: 'Verification Required' });
  expect(within(dialog).getByRole('button', { name: 'Verify Code' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Enter 6-digit code'), { target: { value: '123456' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Verify Code' }));
  expect(screen.queryByText('Action Successful!')).not.toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Please wait...' })).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: 'Cancel Change' })).toBeDisabled();
  await waitFor(() => expect(global.fetch.mock.calls.some(([url]) => url.endsWith('/api/update-password'))).toBe(true));
  const [, options] = global.fetch.mock.calls.find(([url]) => url.endsWith('/api/update-password'));
  expect(options.method).toBe('PUT');
  expect(JSON.parse(options.body)).toEqual({ id: 7, oldPassword: 'OldPassword1!', newPassword: 'NewPassword2!', verificationToken: 'proof-1' });
  expect(global.fetch).toHaveBeenCalledTimes(3);
  finish(reply({ message: 'Password updated successfully!' }));
  await screen.findByText('Your password has been updated.');
});

test('password rejection stays in the dialog and does not show success', async () => {
  global.fetch.mockImplementation(async url => url.endsWith('/api/send-otp')
    ? reply({ challengeId: 'challenge-1' }) : url.endsWith('/api/verify-otp') ? reply({verificationToken: 'proof-1'}) : reply({ message: 'Incorrect old password.' }, false));
  await confirmPasswordChange();
  await screen.findByRole('dialog', { name: 'Verification Required' });
  fireEvent.change(screen.getByLabelText('Enter 6-digit code'), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Verify Code' }));
  await screen.findByText('Incorrect old password.');
  expect(screen.queryByText('Action Successful!')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel Change' })).toBeEnabled();
});

test('code delivery errors are visible in the confirmation dialog', async () => {
  global.fetch.mockResolvedValue(reply({ message: 'Email delivery failed.' }, false));
  await confirmPasswordChange();
  expect(await screen.findByRole('alert')).toHaveTextContent('Email delivery failed.');
  expect(screen.queryByRole('dialog', { name: 'Verification Required' })).not.toBeInTheDocument();
});

test('notification preferences only offer working appointment reminders and save the patient choice', () => {
  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
  const dialog = screen.getByRole('dialog', { name: 'Notifications' });
  expect(within(dialog).getAllByRole('switch')).toHaveLength(1);
  expect(within(dialog).queryByText('Marketing & Promos')).not.toBeInTheDocument();
  expect(within(dialog).queryByText('System Alerts')).not.toBeInTheDocument();
  const toggle = within(dialog).getByRole('switch', { name: 'Appointment Reminders' });
  expect(toggle).toBeEnabled();
  expect(toggle).toHaveAttribute('aria-checked', 'true');
  toggle.focus();
  fireEvent.click(toggle);
  expect(within(dialog).getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  expect(within(dialog).getByRole('switch')).toHaveFocus();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save Preferences' }));
  expect(localStorage.getItem('oravista-appointment-reminders:7')).toBe('false');
  expect(screen.getByText('Notification preferences saved on this device.')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('cancelling notification changes leaves the saved preference unchanged', () => {
  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
  fireEvent.click(screen.getByRole('switch', { name: 'Appointment Reminders' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
  expect(screen.getByRole('switch', { name: 'Appointment Reminders' })).toHaveAttribute('aria-checked', 'true');
  expect(localStorage.getItem('oravista-appointment-reminders:7')).toBeNull();
});

test('saving off hides dashboard notifications and saving on restores them, including after remount', async () => {
  global.fetch.mockImplementation(async url => reply(url.includes('/api/notifications/')
    ? [{ id: 1, title: 'Appointment reminder', message: 'Your appointment is tomorrow.', is_read: false }] : []));
  const pages = render(<><section data-testid="settings"><SettingsPage /></section><section data-testid="dashboard"><DashboardPage /></section></>);
  const settings = within(screen.getByTestId('settings'));
  const dashboard = within(screen.getByTestId('dashboard'));
  fireEvent.click(dashboard.getByRole('button', { name: 'Notifications' }));
  await dashboard.findByText('Appointment reminder');
  fireEvent.click(settings.getByRole('button', { name: 'Notifications' }));
  fireEvent.click(settings.getByRole('switch', { name: 'Appointment Reminders' }));
  fireEvent.click(settings.getByRole('button', { name: 'Save Preferences' }));
  expect(dashboard.queryByRole('button', { name: 'Notifications' })).not.toBeInTheDocument();
  expect(dashboard.queryByText('Appointment reminder')).not.toBeInTheDocument();
  fireEvent.click(within(settings.getByRole('dialog', { name: 'Action Successful!' })).getByRole('button', { name: 'Close' }));
  fireEvent.click(settings.getByRole('button', { name: 'Notifications' }));
  expect(settings.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  fireEvent.click(settings.getByRole('switch'));
  fireEvent.click(settings.getByRole('button', { name: 'Save Preferences' }));
  fireEvent.click(dashboard.getByRole('button', { name: 'Notifications' }));
  expect(dashboard.getByText('Appointment reminder')).toBeInTheDocument();
  pages.unmount();
  await act(async () => { render(<DashboardPage />); });
  expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
});

test('dashboard honors an off preference after reload, responds to other tabs, and keeps choices separate for each patient', async () => {
  global.fetch.mockImplementation(async url => reply(url.includes('/api/notifications/')
    ? [{ id: 1, title: 'Appointment reminder', message: 'Your appointment is tomorrow.', is_read: false }] : []));
  localStorage.setItem('oravista-appointment-reminders:7', 'false');
  const page = render(<DashboardPage />);
  expect(screen.queryByRole('button', { name: 'Notifications' })).not.toBeInTheDocument();
  act(() => {
    localStorage.setItem('oravista-appointment-reminders:7', 'true');
    window.dispatchEvent(new StorageEvent('storage', { key: 'oravista-appointment-reminders:7' }));
  });
  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
  await screen.findByText('Appointment reminder');
  act(() => {
    localStorage.setItem('oravista-appointment-reminders:7', 'false');
    window.dispatchEvent(new StorageEvent('storage', { key: 'oravista-appointment-reminders:7' }));
  });
  expect(screen.queryByText('Appointment reminder')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Notifications' })).not.toBeInTheDocument();
  page.unmount();
  localStorage.setItem('user', JSON.stringify({ id: 8, firstName: 'Other patient' }));
  await act(async () => { render(<DashboardPage />); });
  expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
});

test('notification storage errors stay in the dialog and do not report a successful save', () => {
  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
  const store = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Save Preferences' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Storage unavailable');
    expect(screen.queryByText('Action Successful!')).not.toBeInTheDocument();
  } finally { store.mockRestore(); }
});

test('login email failure does not open verification or create a session', async () => {
  global.fetch.mockResolvedValue(reply({message:'Delivery failed.'},false));
  render(<LoginPage />);
  fireEvent.change(screen.getByPlaceholderText(/email/i), {target:{value:'test@example.test'}});
  fireEvent.change(screen.getByPlaceholderText(/password/i), {target:{value:'OldPassword1!'}});
  fireEvent.click(screen.getByRole('button',{name:/^Log ?in$/i}));
  await screen.findByText('Delivery failed.');
  expect(screen.queryByRole('button',{name:'Verify & Login'})).not.toBeInTheDocument();
  expect(localStorage.getItem('userToken')).toBeNull();
});

test('resend sends the credential challenge; rejected code cannot create a session', async () => {
  global.fetch.mockImplementation(async url => {
    if(url.endsWith('/api/login')) return reply({user:{id:7,email:'test@example.test',role:'patient'},challengeId:'challenge-1'});
    if(url.endsWith('/api/send-otp')) return reply({challengeId:'challenge-2'});
    return reply({message:'Invalid or expired code.'},false);
  });
  render(<LoginPage />);
  fireEvent.change(screen.getByPlaceholderText(/email/i), {target:{value:'test@example.test'}});
  fireEvent.change(screen.getByPlaceholderText(/password/i), {target:{value:'OldPassword1!'}});
  fireEvent.click(screen.getByRole('button',{name:/^Log ?in$/i}));
  await screen.findByRole('button',{name:'Verify & Login'});
  fireEvent.click(screen.getByRole('button',{name:'Resend Code'}));
  await waitFor(() => expect(screen.getByRole('button',{name:'Resend Code'})).toBeEnabled());
  const [,options]=global.fetch.mock.calls.find(([url])=>url.endsWith('/api/send-otp'));
  expect(JSON.parse(options.body)).toEqual({email:'test@example.test',action:'login',challengeId:'challenge-1'});
  fireEvent.change(screen.getByLabelText('Enter 6-digit code'),{target:{value:'123456'}});
  fireEvent.click(screen.getByRole('button',{name:'Verify & Login'}));
  await screen.findByText('Invalid or expired code.');
  const [,verify]=global.fetch.mock.calls.find(([url])=>url.endsWith('/api/verify-otp'));
  expect(JSON.parse(verify.body)).toEqual({email:'test@example.test',challengeId:'challenge-2',code:'123456'});
  expect(localStorage.getItem('userToken')).toBeNull();
});
