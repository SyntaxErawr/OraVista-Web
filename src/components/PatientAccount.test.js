import { act, fireEvent, render, screen } from '@testing-library/react';
import PatientAccount from './PatientAccount';
afterEach(() => localStorage.clear());
test('account shortcut follows the saved profile photo and live profile updates', () => {
  localStorage.setItem('user', JSON.stringify({ firstName: 'Alex', profile_picture: 'uploads/alex.jpg' }));
  render(<PatientAccount />);
  const link = screen.getByRole('link', { name: 'View your profile' });
  expect(link).toHaveAttribute('href', '/profile');
  expect(link.querySelector('img').src).toContain('/uploads/alex.jpg');
  localStorage.setItem('user', JSON.stringify({ firstName: 'Jamie', profile_picture: 'uploads/jamie.jpg' }));
  act(() => window.dispatchEvent(new Event('patient-profile-updated')));
  expect(link).toHaveTextContent('Jamie');
  expect(link.querySelector('img').src).toContain('/uploads/jamie.jpg');
  fireEvent.error(link.querySelector('img'));
  expect(link.querySelector('img')).toBeNull();
  expect(link).toHaveTextContent('Jamie');
});
