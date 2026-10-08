import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  expect(screen.getByRole('dialog')).toHaveTextContent('Staff User');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
});

test('audit events display changes and fetch the admin audit endpoint', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ records: [{ id: 3, created_at: transaction.created_at, actor_name: 'Staff User', actor_role: 'staff', action: 'UPDATE', entity: 'appointments', entity_id: 1, changes: { status: { before: 'Pending', after: 'Confirmed' } } }], count: 1, branches: [] }) });
  render(<AdminOversightPage audit />);
  await screen.findByText('UPDATE');
  expect(global.fetch.mock.calls[0][0]).toContain('/api/admin/audit-logs');
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('Pending');
  expect(screen.getByRole('dialog')).toHaveTextContent('Confirmed');
});

test('load failure is visible and refresh retries', async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Administrator access required.' }) });
  render(<AdminOversightPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Administrator access required');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await screen.findByText(/Jane Patient/);
});
