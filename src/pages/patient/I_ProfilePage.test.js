import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import ProfilePage from './I_ProfilePage';
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn(), useLocation: () => ({ pathname: '/profile' }) }), { virtual: true });
const patient = { id: 7, first_name: 'Test', last_name: 'Patient', email: 'patient@example.com', phone: '09123456789', sex: '', dob: '', occupation: '', profile_picture: 'uploads/old.png' };
const originalFetch = global.fetch;
const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
const reply = (data, ok = true) => ({ ok, json: async () => data });
let serverProfile;
const writes = () => global.fetch.mock.calls.filter(([, options]) => ['PUT', 'POST'].includes(options?.method));
beforeEach(() => {
  serverProfile = { ...patient };
  localStorage.setItem('user', JSON.stringify(patient));
  global.fetch = jest.fn(async (url, options) => {
    if (url.includes('user-profile')) return reply({ ...serverProfile });
    if (options?.method === 'PUT') {
      const values = JSON.parse(options.body); Object.assign(serverProfile, values);
      if (values.firstName !== undefined) serverProfile.first_name = values.firstName;
      return reply({ message: 'Saved', user: { ...serverProfile } });
    }
    return reply({ imagePath: 'https://example.com/new.png' });
  });
  URL.createObjectURL = jest.fn(() => 'blob:preview'); URL.revokeObjectURL = jest.fn();
});
afterEach(async () => { await act(async () => {}); localStorage.clear(); global.fetch = originalFetch; URL.createObjectURL = create; URL.revokeObjectURL = revoke; });
const ready = async () => {
  const view = render(<ProfilePage />);
  await waitFor(() => expect(JSON.parse(localStorage.getItem('user')).firstName).toBe('Test'));
  return view;
};
const editOccupation = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Edit Information' }));
  fireEvent.change(screen.getByLabelText('Enter your occupation'), { target: { value: 'Student' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
};
const confirmInfo = () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));
const selectPhoto = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Edit Photo' }));
  fireEvent.change(document.querySelector('input[type=file]'), { target: { files: [new File(['photo'], 'photo.png', { type: 'image/png' })] } });
};
test('occupation saves with blank optional fields only after confirmation and sends only changes', async () => {
  const view = await ready(); editOccupation(); expect(writes()).toHaveLength(0);
  confirmInfo(); await screen.findByText('Profile updated successfully!');
  expect(JSON.parse(writes()[0][1].body)).toEqual({ id: 7, occupation: 'Student' });
  expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ occupation: 'Student', first_name: 'Test', profile_picture: 'uploads/old.png' });
  view.unmount(); render(<ProfilePage />); expect(screen.getByLabelText('Enter your occupation')).toHaveValue('Student');
});
test('invalid phone and future birth date have visible errors and prevent saving', async () => {
  await ready(); fireEvent.click(screen.getByRole('button', { name: 'Edit Information' }));
  fireEvent.change(screen.getByLabelText('phone'), { target: { value: '123' } });
  fireEvent.change(screen.getByLabelText('dob'), { target: { value: '2999-01-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(screen.getByText(/11-digit mobile number/)).toBeInTheDocument(); expect(screen.getByText(/not in the future/)).toBeInTheDocument(); expect(writes()).toHaveLength(0);
});
test('canceling information confirmation and discarding form do not save', async () => {
  await ready(); editOccupation(); fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Discard Changes' })); expect(screen.getByLabelText('Enter your occupation')).toHaveValue(''); expect(writes()).toHaveLength(0);
});
test('a rejected information save keeps the draft and permits retry without duplicate requests', async () => {
  await ready(); let finish; global.fetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  editOccupation(); confirmInfo(); expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled(); expect(writes()).toHaveLength(1);
  finish(reply({ message: 'Save unavailable' }, false)); await screen.findByText('Save unavailable');
  expect(JSON.parse(localStorage.getItem('user')).occupation).toBe(''); expect(screen.getByLabelText('Enter your occupation')).toHaveValue('Student');
  confirmInfo(); await screen.findByText('Profile updated successfully!');
});
test('mobile changes refresh information, photo and header when the browser regains focus', async () => {
  await ready(); serverProfile = { ...serverProfile, first_name: 'Mobile', occupation: 'Dentist', sex: 'Female', dob: '2000-01-02', profile_picture: 'uploads/mobile.png' };
  act(() => window.dispatchEvent(new Event('focus')));
  await waitFor(() => expect(screen.getByLabelText('First Name')).toHaveValue('Mobile'));
  expect(screen.getByLabelText('Enter your occupation')).toHaveValue('Dentist'); expect(screen.getByLabelText('sex')).toHaveValue('Female');
  expect(screen.getByRole('img', { name: 'Profile photo' }).style.backgroundImage).toContain('uploads/mobile.png');
  expect(screen.getByRole('link', { name: 'View your profile' })).toHaveTextContent('Mobile');
});
test('background refresh preserves a form draft and saving cannot overwrite untouched mobile fields', async () => {
  await ready(); fireEvent.click(screen.getByRole('button', { name: 'Edit Information' }));
  fireEvent.change(screen.getByLabelText('Enter your occupation'), { target: { value: 'Student' } });
  serverProfile = { ...serverProfile, phone: '09999999999', profile_picture: 'uploads/mobile.png' };
  act(() => window.dispatchEvent(new Event('focus'))); await waitFor(() => expect(JSON.parse(localStorage.getItem('user')).phone).toBe('09999999999'));
  expect(screen.getByLabelText('Enter your occupation')).toHaveValue('Student');
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' })); confirmInfo(); await screen.findByText('Profile updated successfully!');
  expect(JSON.parse(writes()[0][1].body)).toEqual({ id: 7, occupation: 'Student' }); expect(screen.getByLabelText('phone')).toHaveValue('09999999999'); expect(serverProfile.profile_picture).toBe('uploads/mobile.png');
});
test('photo draft survives refresh; cancel restores the newest mobile photo and preserves information edits', async () => {
  await ready(); fireEvent.click(screen.getByRole('button', { name: 'Edit Information' }));
  fireEvent.change(screen.getByLabelText('Enter your occupation'), { target: { value: 'Student' } }); selectPhoto();
  serverProfile.profile_picture = 'uploads/mobile.png'; act(() => window.dispatchEvent(new Event('focus')));
  await waitFor(() => expect(JSON.parse(localStorage.getItem('user')).profile_picture).toBe('uploads/mobile.png'));
  expect(writes()).toHaveLength(0); expect(screen.getByRole('img', { name: 'Profile photo' }).style.backgroundImage).toContain('blob:preview');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel Photo' })); expect(screen.getByRole('img', { name: 'Profile photo' }).style.backgroundImage).toContain('uploads/mobile.png');
  expect(screen.getByLabelText('Enter your occupation')).toHaveValue('Student'); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
});
test('photo upload waits for confirmation and persists only the returned photo', async () => {
  await ready(); selectPhoto(); fireEvent.click(screen.getByRole('button', { name: 'Save Photo' })); expect(writes()).toHaveLength(0);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' })); expect(writes()).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Save Photo' })); fireEvent.click(screen.getByRole('button', { name: 'Confirm Photo' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument()); expect(writes()).toHaveLength(1); expect(writes()[0][1].body.get('userId')).toBe('7');
  expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ profile_picture: 'https://example.com/new.png', occupation: '' });
});
test('age is blank without DOB, computed from DOB and read-only; sex options match mobile', async () => {
  serverProfile.age = 99; await ready(); expect(screen.getByLabelText('Auto-computed')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Edit Information' })); fireEvent.change(screen.getByLabelText('dob'), { target: { value: '2000-01-02' } });
  expect(screen.getByLabelText('Auto-computed')).toHaveValue(String(new Date().getFullYear() - 2000)); expect(screen.getByLabelText('Auto-computed')).toBeDisabled();
  expect([...screen.getByLabelText('sex').options].map(o => o.value)).toEqual(['', 'Male', 'Female']);
  fireEvent.change(screen.getByLabelText('dob'), { target: { value: '' } }); expect(screen.getByLabelText('Auto-computed')).toHaveValue('');
});
