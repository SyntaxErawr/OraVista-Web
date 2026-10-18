import { API_BASE_URL } from '../config/api';
import { profileAge, profileSex } from './profileFields';

export const readPatientProfile = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

export function mergePatientProfile(current, fresh) {
  const merged = { ...current };
  const keys = ['id', 'email', 'phone', 'dob', 'occupation', 'blood_type', 'allergies', 'insurance', 'policy_number', 'branch'];
  for (const key of keys) if (Object.hasOwn(fresh, key)) merged[key] = fresh[key];
  merged.firstName = merged.first_name = fresh.first_name ?? fresh.firstName ?? current.firstName ?? current.first_name ?? '';
  merged.lastName = merged.last_name = fresh.last_name ?? fresh.lastName ?? current.lastName ?? current.last_name ?? '';
  merged.dob = typeof merged.dob === 'string' ? merged.dob.slice(0, 10) : '';
  merged.age = profileAge(merged.dob);
  merged.sex = profileSex(Object.hasOwn(fresh, 'sex') ? fresh.sex : current.sex);
  if (Object.hasOwn(fresh, 'profile_picture')) merged.profile_picture = fresh.profile_picture;
  return merged;
}

const pending = new Map();
export function refreshPatientProfile() {
  const current = readPatientProfile();
  if (!current?.id) return Promise.resolve(null);
  const token = localStorage.getItem('userToken');
  const key = `${current.id}:${token}`;
  if (pending.has(key)) return pending.get(key);
  const snapshot = localStorage.getItem('user');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const request = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/user-profile?userId=${encodeURIComponent(current.id)}`, { cache: 'no-store', signal: controller.signal });
    const fresh = await response.json();
    if (!response.ok || String(fresh.id) !== String(current.id)) throw new Error(fresh.message || 'Your profile could not be refreshed.');
    const latest = readPatientProfile();
    if (!latest || String(latest.id) !== String(current.id) || localStorage.getItem('userToken') !== token || localStorage.getItem('user') !== snapshot) return null;
    const updated = mergePatientProfile(latest, fresh);
    if (JSON.stringify(updated) !== snapshot) {
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('patient-profile-updated'));
    }
    return updated;
  })().finally(() => { clearTimeout(timeout); pending.delete(key); });
  pending.set(key, request);
  return request;
}
