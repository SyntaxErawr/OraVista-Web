import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import ProfilePage from './I_ProfilePage';
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn(), useLocation: () => ({ pathname: '/profile' }) }), { virtual: true });
const patient = { id: 7, first_name: 'Test', last_name: 'Patient', email: 'patient@example.com', phone: '09123456789', sex: '', dob: '', occupation: '', profile_picture: 'uploads/old.png' };
const originalFetch = global.fetch;
const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
const reply = (data, ok = true) => ({ ok, json: async () => data });
beforeEach(() => {
  localStorage.setItem('user', JSON.stringify(patient));
  global.fetch = jest.fn(async () => reply({ message: 'Saved' }));
  URL.createObjectURL = jest.fn(() => 'blob:preview'); URL.revokeObjectURL = jest.fn();
});
afterEach(() => { localStorage.clear(); global.fetch = originalFetch; URL.createObjectURL = create; URL.revokeObjectURL = revoke; });
const editOccupation = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Edit Information' }));
  fireEvent.change(screen.getByLabelText('Enter your occupation'), { target: { value: 'Student' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
};
const selectPhoto = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Edit Photo' }));
  fireEvent.change(document.querySelector('input[type=file]'), { target: { files: [new File(['photo'], 'photo.png', { type: 'image/png' })] } });
};
test('occupation saves with blank optional fields and a non-Gmail account, only after confirmation', async () => {
  const view = render(<ProfilePage />); editOccupation();
  expect(screen.getByRole('dialog', { name: 'Confirm Changes?' })).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));
  await screen.findByText('Profile updated successfully!');
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({ id: 7, firstName: 'Test', occupation: 'Student', sex: '', dob: '' });
  expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ occupation: 'Student', first_name: 'Test', profile_picture: 'uploads/old.png' });
  view.unmount(); render(<ProfilePage />);
  expect(screen.getByLabelText('Enter your occupation')).toHaveValue('Student');
});
test('invalid phone and future birth date have visible errors and prevent saving', () => {
  render(<ProfilePage />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit Information' }));
  fireEvent.change(screen.getByLabelText('phone'), { target: { value: '123' } });
  fireEvent.change(screen.getByLabelText('dob'), { target: { value: '2999-01-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(screen.getByText(/11-digit mobile number/)).toBeInTheDocument();
  expect(screen.getByText(/not in the future/)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});
test('canceling information confirmation and discarding form do not save', () => {
  render(<ProfilePage />); editOccupation();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Discard Changes' }));
  expect(screen.getByLabelText('Enter your occupation')).toHaveValue('');
  expect(global.fetch).not.toHaveBeenCalled();
});
test('a rejected information save keeps the draft and offers a successful retry without duplicate requests', async () => {
  let finish;
  global.fetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<ProfilePage />); editOccupation();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));
  expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  finish(reply({ message: 'Save unavailable' }, false));
  await screen.findByText('Save unavailable');
  expect(JSON.parse(localStorage.getItem('user')).occupation).toBe('');
  expect(screen.getByLabelText('Enter your occupation')).toHaveValue('Student');
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));
  await screen.findByText('Profile updated successfully!');
});
test('photo preview and cancel work independently of information edits without uploading', () => {
  render(<ProfilePage />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit Information' }));
  fireEvent.change(screen.getByLabelText('Enter your occupation'), { target: { value: 'Student' } });
  selectPhoto();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('img', { name: 'Profile photo' }).style.backgroundImage).toContain('blob:preview');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel Photo' }));
  expect(screen.getByRole('img', { name: 'Profile photo' }).style.backgroundImage).toContain('uploads/old.png');
  expect(screen.getByLabelText('Enter your occupation')).toHaveValue('Student');
  expect(JSON.parse(localStorage.getItem('user')).profile_picture).toBe('uploads/old.png');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
});
test('photo upload waits for confirmation, preserves unsaved information and persists only the returned photo', async () => {
  global.fetch.mockResolvedValue(reply({ imagePath: 'https://example.com/new.png' }));
  render(<ProfilePage />); selectPhoto();
  fireEvent.click(screen.getByRole('button', { name: 'Save Photo' }));
  expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
  expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save Photo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm Photo' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch.mock.calls[0][1].body.get('userId')).toBe('7');
  expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ profile_picture: 'https://example.com/new.png', occupation: '' });
  expect(screen.getByRole('img', { name: 'Profile photo' }).style.backgroundImage).toContain('https://example.com/new.png');
});
