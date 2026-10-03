import { fireEvent, render, screen } from '@testing-library/react';
import PaginatedList from './PaginatedList';
import DentistDirectoryActions from './DentistDirectoryActions';
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

test('directories show 20 rows and return to page one when the search changes', () => {
  const rows = Array.from({length: 25}, (_, i) => <tr key={i}><td>Patient {i + 1}</td></tr>);
  const { rerender } = render(<table><PaginatedList table columns={1} pageSize={20} resetKey="">{rows}</PaginatedList></table>);
  expect(screen.getByText('Patient 20')).toBeInTheDocument();
  expect(screen.queryByText('Patient 21')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Patient 21')).toBeInTheDocument();
  expect(screen.queryByText('Patient 1')).not.toBeInTheDocument();
  rerender(<table><PaginatedList table columns={1} pageSize={20} resetKey="Patient">{rows}</PaginatedList></table>);
  expect(screen.getByText('Patient 1')).toBeInTheDocument();
});

test('dashboard pages show ten entries and clamp when records are removed', () => {
  const rows = Array.from({length: 12}, (_, i) => <p key={i}>Visit {i + 1}</p>);
  const { rerender } = render(<PaginatedList>{rows}</PaginatedList>);
  expect(screen.queryByText('Visit 11')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Visit 11')).toBeInTheDocument();
  rerender(<PaginatedList>{rows.slice(0, 2)}</PaginatedList>);
  expect(screen.getByText('Visit 1')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});

test.each(['admin', 'staff'])('dentist details and schedule work for %s', role => {
  mockNavigate.mockClear();
  render(<DentistDirectoryActions role={role} dentist={{id:'DT-101',name:'Dr. Taylor Demo',specialty:'General Dentistry',branch:'Pasay',patients:'2 assigned',status:'Available'}} />);
  fireEvent.click(screen.getByRole('button', {name:'Details'}));
  expect(screen.getByRole('dialog')).toHaveTextContent('Dr. Taylor Demo');
  fireEvent.click(screen.getByRole('button', {name:'Close dentist details'}));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name:'Schedule'}));
  expect(mockNavigate).toHaveBeenCalledWith('/'+role+'/appointments?dentist=Dr.+Taylor+Demo');
});
