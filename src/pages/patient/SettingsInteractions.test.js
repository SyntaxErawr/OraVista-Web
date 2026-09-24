import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import SettingsPage from './L_SettingsPage';
import LoginPage from './B_LoginPage';

const mockLocation = { pathname: '/settings' };
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(), useLocation: () => mockLocation,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });
const originalFetch = global.fetch;
const reply = (data, ok = true) => ({ ok, json: async () => data });
beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 7, firstName: 'Test', email: 'test@example.test' }));
  global.fetch = jest.fn(async () => reply({ generatedOtp: '123456' }));
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
    ? reply({ generatedOtp: '123456' }) : new Promise(resolve => { finish = resolve; }));
  await confirmPasswordChange();
  const dialog = await screen.findByRole('dialog', { name: 'Verification Required' });
  expect(within(dialog).getByRole('button', { name: 'Verify Code' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Enter 6-digit code'), { target: { value: '123456' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Verify Code' }));
  expect(screen.queryByText('Action Successful!')).not.toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Please wait...' })).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: 'Cancel Change' })).toBeDisabled();
  const [, options] = global.fetch.mock.calls.find(([url]) => url.endsWith('/api/update-password'));
  expect(options.method).toBe('PUT');
  expect(JSON.parse(options.body)).toEqual({ id: 7, oldPassword: 'OldPassword1!', newPassword: 'NewPassword2!' });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  finish(reply({ message: 'Password updated successfully!' }));
  await screen.findByText('Your password has been updated.');
});

test('password rejection stays in the dialog and does not show success', async () => {
  global.fetch.mockImplementation(async url => url.endsWith('/api/send-otp')
    ? reply({ generatedOtp: '123456' }) : reply({ message: 'Incorrect old password.' }, false));
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

test('notification preferences clearly show unavailable controls instead of fake saving', () => {
  render(<SettingsPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
  const dialog = screen.getByRole('dialog', { name: 'Notifications' });
  expect(within(dialog).getByRole('status')).toHaveTextContent('coming soon');
  within(dialog).getAllByRole('switch').forEach(control => expect(control).toBeDisabled());
  expect(within(dialog).getByRole('button', { name: 'Save Preferences' })).toBeDisabled();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('login cannot accept an empty OTP after email delivery fails', async () => {
  global.fetch.mockImplementation(async url => url.endsWith('/api/login')
    ? reply({ user: { id: 7, email: 'test@example.test' } }) : reply({ message: 'Delivery failed.' }, false));
  render(<LoginPage />);
  fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.test' } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'OldPassword1!' } });
  fireEvent.click(screen.getByRole('button', { name: /^Log ?in$/i }));
  await screen.findByText('Delivery failed.');
  fireEvent.click(screen.getByRole('button', { name: 'Verify & Login' }));
  expect(screen.getByRole('button', { name: 'Verify & Login' })).toBeDisabled();
  expect(screen.getByLabelText('Enter 6-digit code')).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('Delivery failed.');
  expect(screen.getByText(/We couldn't send your verification code/)).toBeInTheDocument();
  expect(screen.queryByText(/Login Successful/i)).not.toBeInTheDocument();
});

test('OTP resend keeps the existing API contract and enables verification only after delivery succeeds', async () => {
  let finishResend;
  let requests = 0;
  global.fetch.mockImplementation(async url => {
    if (url.endsWith('/api/login')) return reply({ user: { id: 7, email: 'test@example.test' } });
    requests++;
    return requests === 1 ? reply({ message: 'Failed to send email.' }, false)
      : new Promise(resolve => { finishResend = resolve; });
  });
  render(<LoginPage />);
  fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.test' } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'OldPassword1!' } });
  fireEvent.click(screen.getByRole('button', { name: /^Log ?in$/i }));
  await screen.findByText('Failed to send email.');
  const resend = screen.getByRole('button', { name: 'Resend Code' });
  fireEvent.click(resend);
  expect(resend).toBeDisabled();
  expect(screen.getByText('Requesting your verification code. Please wait.')).toBeInTheDocument();
  const otpCalls = global.fetch.mock.calls.filter(([url]) => url.endsWith('/api/send-otp'));
  expect(otpCalls).toHaveLength(2);
  otpCalls.forEach(([, options]) => {
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ email: 'test@example.test', action: 'login' });
  });
  finishResend(reply({ generatedOtp: '123456' }));
  await screen.findByText('Security code sent! Please check your email.');
  expect(screen.getByRole('button', { name: 'Verify & Login' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Enter 6-digit code'), { target: { value: '123456' } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Verify & Login' })).toBeEnabled());
});
