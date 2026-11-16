import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminOversightPage from './I_AdminOversightPage';
jest.mock('../../components/AdminLayout', () => ({ children }) => <div>{children}</div>);
const originalFetch = global.fetch;
const transaction = { id: 1, created_at: '2026-10-08T01:00:00Z', patient_name: 'Jane Patient', branch: 'Main Branch', amount: 500, method: 'Cash', collector_name: 'Staff User', booking_ref: 'BOOK-1' };
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ records: [transaction], count: 25, received: '1500.00', branches: ['Main Branch'] }) }); });
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

test('transactions shows collected totals, date/branch filters, pagination and collection details', async () => {
  render(<AdminOversightPage />);
  await screen.findByText(/Jane Patient/);
  expect(screen.getByText(/PHP 1,500.00/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-01' } });
  fireEvent.change(screen.getByLabelText('Branch'), { target: { value: 'Main Branch' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(global.fetch.mock.calls.at(-1)[0]).toContain('from=2026-10-01'));
  await screen.findByRole('button', { name: 'Next' });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(global.fetch.mock.calls.at(-1)[0]).toContain('page=2'));
  fireEvent.click(await screen.findByRole('button', { name: 'Details' }));
  const details = screen.getByRole('dialog');
  expect(details).toHaveTextContent('Staff User');
  expect(details).toHaveTextContent('PHP 500.00');
  expect(within(details).getByText('Collected by')).toBeInTheDocument();
  expect(details.querySelector('pre')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
});

test('audit events display changes and fetch the admin audit endpoint', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ records: [{ id: 3, created_at: transaction.created_at, actor_name: 'Staff User', actor_role: 'staff', action: 'UPDATE', entity: 'appointments', entity_id: 1, changes: { status: { before: 'Pending', after: 'Confirmed' } } }], count: 1, branches: [] }) });
  render(<AdminOversightPage audit />);
  await screen.findByText('Updated');
  expect(global.fetch.mock.calls[0][0]).toContain('/api/admin/audit-logs');
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));
  const details = screen.getByRole('dialog');
  const changes = within(details).getByRole('table', { name: 'Changed fields' });
  expect(within(changes).getByRole('columnheader', { name: 'Previous value' })).toBeInTheDocument();
  expect(within(changes).getByRole('columnheader', { name: 'New value' })).toBeInTheDocument();
  expect(details.querySelector('pre')).toBeNull();
  expect(details).toHaveTextContent('Pending');
  expect(screen.getByRole('dialog')).toHaveTextContent('Confirmed');
});

test('load failure is visible and refresh retries', async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Administrator access required.' }) });
  render(<AdminOversightPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Administrator access required');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await screen.findByText(/Jane Patient/);
});

test('historical JSON changes retain empty, boolean, zero and nested values in readable fields', async () => {
  const changes = JSON.stringify({
    status: { before: null, after: 'Confirmed' },
    verified: { before: false, after: true },
    amount: { before: 0, after: 250 },
    receipt_details: { paid: 250, balance: 750, items: ['Consultation', 'Cleaning'] },
  });
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ records: [{ id: 4, created_at: transaction.created_at, action: 'UPDATE PUT /api/update-profile', entity: 'users', entity_id: 7, changes }], count: 1, branches: [] }) });
  render(<AdminOversightPage audit />);
  fireEvent.click(await screen.findByRole('button', { name: 'Details' }));
  const details = screen.getByRole('dialog');
  expect(details).toHaveTextContent('Not provided');
  expect(within(details).getByRole('row', { name: 'Verified No Yes' })).toBeInTheDocument();
  expect(within(details).getByRole('row', { name: 'Amount 0 250' })).toBeInTheDocument();
  expect(details).toHaveTextContent('Receipt Details');
  expect(details).toHaveTextContent('Consultation');
  expect(details).toHaveTextContent('Cleaning');
  expect(details).toHaveTextContent('750');
  expect(details).not.toHaveTextContent('/api/update-profile');
  expect(details.querySelector('pre')).toBeNull();
});

test('authentication events show a readable activity and preserve the recorded outcome', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ records: [{ id: 5, created_at: transaction.created_at, action: 'SUCCESS /api/login', entity: 'authentication', entity_id: 7, changes: { outcome: 'success' } }], count: 1, branches: [] }) });
  render(<AdminOversightPage audit />);
  await screen.findByText('Sign-in request succeeded');
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));
  const details = screen.getByRole('dialog');
  expect(details).toHaveTextContent('Outcome');
  expect(details).toHaveTextContent('success');
  expect(details).not.toHaveTextContent('/api/login');
});
