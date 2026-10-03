import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
const readUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}') || {}; } catch { return {}; } };
export default function PatientAccount() {
  const [user, setUser] = useState(readUser);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const update = () => { setUser(readUser()); setFailed(false); };
    window.addEventListener('storage', update);
    window.addEventListener('patient-profile-updated', update);
    return () => { window.removeEventListener('storage', update); window.removeEventListener('patient-profile-updated', update); };
  }, []);
  const photo = user.profile_picture;
  const source = photo && (/^https?:\/\//.test(photo) ? photo : `https://oravista-server-474976105474.asia-southeast1.run.app/${photo.replace(/^\//, '')}`);
  return <a className="ov-patient-account" href="/profile" aria-label="View your profile">
    <span className="ov-account-photo">{source && !failed ? <img src={source} alt="" onError={() => setFailed(true)} /> : <User size={21} aria-hidden="true" />}</span>
    <span>{user.firstName || 'Patient'}<small>My profile</small></span>
  </a>;
}
