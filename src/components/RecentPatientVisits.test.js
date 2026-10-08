import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RecentPatientVisits from './RecentPatientVisits';

const props = { styles: {}, loading: false, error: '', onRefresh: jest.fn() };
const visit = (id, date, time = '09:00', status = 'Completed') => ({ id, date, time, status, patientName: `Patient ${id}`, booking_ref: `BOOK-${id}`, serviceType: 'Cleaning' });

test('shows newest visit dates first and sorts appointment times on the same day without changing input', () => {
  const visits = [visit(1, '2026-09-01'), visit(2, '2026-10-08', '09:00'), visit(3, '2026-10-08', '2:00 PM'), visit(4, '2026-10-09', '10:00', 'Confirmed')];
  render(<RecentPatientVisits {...props} visits={visits} />);
  expect(screen.getAllByText(/^Patient /).map(node => node.textContent)).toEqual(['Patient 3', 'Patient 2', 'Patient 1']);
  expect(visits.map(item => item.id)).toEqual([1, 2, 3, 4]);
  expect(screen.getAllByText('Oct 8, 2026')).toHaveLength(2);
  expect(screen.getByText('Booking: BOOK-3')).toBeInTheDocument();
});

test('keeps missing dates last and does not display invalid dates', () => {
  render(<RecentPatientVisits {...props} visits={[visit(1, '2026-02-30'), visit(2, '2026-10-08'), visit(3, null)]} />);
  expect(screen.getAllByText(/^Patient /)[0]).toHaveTextContent('Patient 2');
  expect(screen.getAllByText('Date unavailable')).toHaveLength(2);
});

test('loading and error states do not claim there are no visits; empty success does', () => {
  const { rerender } = render(<RecentPatientVisits {...props} visits={[]} loading />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading recent patient visits');
  expect(screen.getByRole('button')).toBeDisabled();
  rerender(<RecentPatientVisits {...props} visits={[]} error="failed" />);
  expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.queryByText('No completed patient visits recorded.')).not.toBeInTheDocument();
  rerender(<RecentPatientVisits {...props} visits={[]} />);
  expect(screen.getByRole('status')).toHaveTextContent('No completed patient visits recorded.');
});

test('refresh prevents duplicate clicks, resets pagination and clears an initial error after recovery', async () => {
  let finish;
  const onRefresh = jest.fn(() => new Promise(resolve => { finish = resolve; }));
  render(<RecentPatientVisits {...props} error="initial failure" onRefresh={onRefresh} visits={Array.from({ length: 12 }, (_, index) => visit(index, '2026-10-08'))} />);
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  const refresh = screen.getByRole('button', { name: 'Refresh recent patient visits' });
  fireEvent.click(refresh);
  expect(refresh).toBeDisabled();
  fireEvent.click(refresh);
  expect(onRefresh).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() => expect(refresh).toBeEnabled());
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('failed refresh retains visible visits and permits retry', async () => {
  const onRefresh = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce();
  render(<RecentPatientVisits {...props} onRefresh={onRefresh} visits={[visit(1, '2026-10-08')]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh recent patient visits' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Showing previously loaded visits');
  expect(screen.getByText('Patient 1')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh recent patient visits' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
