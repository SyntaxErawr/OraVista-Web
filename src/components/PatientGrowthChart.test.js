import { fireEvent, render, screen } from '@testing-library/react';
import PatientGrowthChart from './PatientGrowthChart';
import { getPatientGrowth } from '../utils/patientGrowth';

const now = new Date(2026, 9, 8, 12);
const visit = (patientId, growthDate, status = 'Completed') => ({ patientId, growthDate, status, patientName: 'Same Name' });
const appointments = [
  visit(1, '2025-12-01'), visit(1, '2026-09-01'), visit(1, '2026-10-01'),
  visit(2, '2026-09-03'), visit(2, '2026-10-01'), visit(2, '2026-10-02'),
  visit(3, '2026-10-03'), visit(3, '2026-10-04'), visit(4, '2026-10-05', 'Cancelled'),
  visit(5, '2026-10-09'), visit(null, '2026-10-03'), visit(6, '2026-02-30'),
];

test('counts unique patients, uses earlier history and excludes cancelled, future and invalid visits', () => {
  const months = getPatientGrowth([...appointments].reverse(), now);
  expect(months).toHaveLength(6);
  expect(months[0].key).toBe('2026-05');
  expect(months[0].total).toBe(0);
  expect(months[4]).toMatchObject({ newPatients: 1, returningPatients: 1, total: 2 });
  expect(months[5]).toMatchObject({ newPatients: 1, returningPatients: 2, total: 3 });
});

test('six-month range crosses year boundaries', () => {
  expect(getPatientGrowth([], new Date(2026, 0, 1)).map(month => month.key))
    .toEqual(['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01']);
});

test('renders totals, growth and accessible details for each month', () => {
  render(<PatientGrowthChart appointments={appointments} now={now} />);
  expect(screen.getByText(/50.0% more patients than Sep 2026/)).toBeInTheDocument();
  const september = screen.getByRole('button', { name: 'Sep 2026: 2 patients, 1 new, 1 returning' });
  expect(screen.getAllByRole('button')).toHaveLength(6);
  fireEvent.focus(september);
  expect(screen.getByRole('status')).toHaveTextContent('Sep 2026: 1 new, 1 returning');
  fireEvent.click(screen.getByRole('button', { name: 'Oct 2026: 3 patients, 1 new, 2 returning' }));
  expect(screen.getByRole('status')).toHaveTextContent('Oct 2026: 1 new, 2 returning');
});

test('handles loading, errors, empty history and an API without patient identity data', () => {
  const { rerender } = render(<PatientGrowthChart appointments={[]} loading now={now} />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading');
  rerender(<PatientGrowthChart appointments={[]} error="failed" now={now} />);
  expect(screen.getByRole('status')).toHaveTextContent('could not be loaded');
  rerender(<PatientGrowthChart appointments={[]} now={now} />);
  expect(screen.getByRole('status')).toHaveTextContent('No completed patient visits');
  rerender(<PatientGrowthChart appointments={[{ status: 'Completed' }]} now={now} />);
  expect(screen.getByRole('status')).toHaveTextContent('data is unavailable');
});

test('does not calculate an infinite percentage when the previous month is empty', () => {
  render(<PatientGrowthChart appointments={[visit(1, '2026-10-01')]} now={now} />);
  expect(screen.getByText(/No patients last month to compare/)).toBeInTheDocument();
});
