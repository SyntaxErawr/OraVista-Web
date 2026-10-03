import { fireEvent, render, screen } from '@testing-library/react';
import LandingPage from './pages/patient/A_LandingPage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

afterEach(() => { localStorage.clear(); mockNavigate.mockClear(); });

test('the public entry page offers a working branch selection and labels unavailable app downloads', () => {
  render(<LandingPage />);
  fireEvent.change(screen.getByLabelText('Preferred clinic'), { target: { value: 'Gil Puyat, Pasay' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
  expect(localStorage.getItem('tempBranch')).toBe('Gil Puyat, Pasay');
  expect(mockNavigate).toHaveBeenCalledWith('/login');
  expect(screen.getByRole('button', { name: /Google Play/ })).toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('button', { name: /App Store/ })).toHaveAttribute('aria-disabled', 'true');
});
