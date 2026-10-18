import { mergePatientProfile, refreshPatientProfile } from './patientProfile';
import { profileAge } from './profileFields';
const originalFetch = global.fetch;
const cached = { id: 7, firstName: 'Old', email: 'old@example.test', occupation: 'Old job', dob: '', age: 80 };
beforeEach(() => { localStorage.setItem('user', JSON.stringify(cached)); localStorage.setItem('userToken', 'session'); });
afterEach(() => { localStorage.clear(); global.fetch = originalFetch; });
test('profile normalization derives age and updates both name aliases without copying server secrets', () => {
  const user = mergePatientProfile(cached, { id: 7, first_name: 'New', dob: null, age: 99, sex: 'female', password: 'hidden' });
  expect(user).toMatchObject({ firstName: 'New', first_name: 'New', age: null, sex: 'Female' }); expect(user.password).toBeUndefined();
});
test('concurrent profile refreshes share one GET and cannot overwrite a newer local save', async () => {
  let finish; global.fetch = jest.fn(() => new Promise(resolve => { finish = resolve; }));
  const first = refreshPatientProfile(), second = refreshPatientProfile(); expect(global.fetch).toHaveBeenCalledTimes(1);
  localStorage.setItem('user', JSON.stringify({ ...cached, occupation: 'Just saved' }));
  finish({ ok: true, json: async () => ({ id: 7, occupation: 'Old response' }) });
  expect(await first).toBeNull(); expect(await second).toBeNull(); expect(JSON.parse(localStorage.getItem('user')).occupation).toBe('Just saved');
});
test('profile responses arriving after account switch or with another identity cannot leak into the new session', async () => {
  let finish; global.fetch = jest.fn(() => new Promise(resolve => { finish = resolve; }));
  const pending = refreshPatientProfile(); localStorage.setItem('user', JSON.stringify({ id: 8 }));
  finish({ ok: true, json: async () => ({ id: 7, occupation: 'Private' }) }); expect(await pending).toBeNull(); expect(JSON.parse(localStorage.getItem('user')).id).toBe(8);
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: 7 }) }); await expect(refreshPatientProfile()).rejects.toThrow(/refreshed/);
});
test('age respects Philippine birthdays and rejects impossible or future dates', () => {
  expect(profileAge('2000-10-18', new Date('2026-10-17T15:59:59Z'))).toBe(25);
  expect(profileAge('2000-10-18', new Date('2026-10-17T16:00:00Z'))).toBe(26);
  expect(profileAge('2026-02-30')).toBeNull(); expect(profileAge('2999-01-01')).toBeNull(); expect(profileAge(null)).toBeNull();
});
