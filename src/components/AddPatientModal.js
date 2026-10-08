import { useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import PatientDialog from './PatientDialog';

const initial = { firstName: '', lastName: '', email: '', phone: '', dob: '', branch: 'Gil Puyat, Pasay', password: '', confirmPassword: '' };
const branches = ['Main Branch', 'Gil Puyat, Pasay', 'Sta. Ana, Manila', 'Angeles, Pampanga'];

export default function AddPatientModal({ onClose, onCreated, buttonStyle }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const submitting = useRef(false);
  const today = new Date();
  const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const change = event => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: '', ...(name === 'password' ? { confirmPassword: '' } : {}) }));
    setMessage('');
  };
  const refresh = async () => {
    try {
      await onCreated();
      setRefreshFailed(false);
      setMessage('Patient added successfully. The patient list has been updated.');
    } catch (error) {
      setRefreshFailed(true);
      setMessage('Patient added successfully, but the list could not be refreshed. Retry refreshing or reload the page.');
    }
  };
  const submit = async event => {
    event.preventDefault();
    if (submitting.current || saved) return;
    const next = {};
    for (const key of ['firstName', 'lastName']) {
      if (!form[key].trim()) next[key] = 'This field is required.';
      else if (form[key].trim().length > 20) next[key] = 'Use 20 characters or fewer.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!/^09\d{9}$/.test(form.phone.trim())) next.phone = 'Enter an 11-digit mobile number starting with 09.';
    if (form.password.length < 8 || form.password.length > 128 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password) || !/[^a-zA-Z0-9]/.test(form.password)) next.password = 'Use 8–128 characters with uppercase, lowercase, number and symbol.';
    if (!form.confirmPassword || form.password !== form.confirmPassword) next.confirmPassword = 'Passwords must match.';
    if (form.dob && (form.dob > maxDate || Number.isNaN(new Date(`${form.dob}T12:00:00`).getTime()))) next.dob = 'Enter a valid birth date that is not in the future.';
    setErrors(next);
    setMessage('');
    if (Object.keys(next).length) return;
    submitting.current = true;
    setBusy(true);
    try {
      const response = await fetch('https://oravista-server-474976105474.asia-southeast1.run.app/api/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), password: form.password, dob: form.dob || null, branch: form.branch, role: 'patient' }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const fieldErrors = Object.fromEntries(Object.entries(data.errors || {}).filter(([key, value]) => key in initial && typeof value === 'string'));
        setErrors(fieldErrors);
        setMessage(data.message || 'Unable to add the patient. Please try again.');
        return;
      }
      setSaved(true);
      setForm(initial);
      await refresh();
    } catch (error) {
      setMessage('Unable to connect. Please check your connection and try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  const field = (name, label, type = 'text', options = {}) => (
    <div style={styles.field}>
      <label htmlFor={`add-patient-${name}`}>{label}{options.required !== false ? ' *' : ''}</label>
      <input id={`add-patient-${name}`} name={name} type={type} value={form[name]} onChange={change} disabled={busy} required={options.required !== false}
        aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `add-patient-${name}-error` : undefined}
        style={styles.input} {...options} />
      {errors[name] && <span id={`add-patient-${name}-error`} role="alert" style={styles.error}>{errors[name]}</span>}
    </div>
  );
  return (
    <div style={styles.overlay}>
      <PatientDialog onClose={onClose} busy={busy} style={styles.modal} aria-busy={busy}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, color: '#087F8C', fontSize: 20 }}>Add New Patient</h2>
          <button type="button" aria-label="Close add patient form" disabled={busy} onClick={onClose} style={styles.close}><X size={22} /></button>
        </div>
        {message && <p role={saved ? 'status' : 'alert'} style={{ color: saved ? '#087F8C' : '#b91c1c', fontSize: 14 }}>{message}</p>}
        {saved ? (
          <div style={styles.actions}>
            {refreshFailed && <button type="button" disabled={busy} style={buttonStyle} onClick={async () => { setBusy(true); await refresh(); setBusy(false); }}>Retry refreshing list</button>}
            <button type="button" disabled={busy} onClick={onClose} style={buttonStyle}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: 14 }}>Create a patient account. Fields marked * are required.</p>
            <div style={styles.grid}>
              {field('firstName', 'First Name', 'text', { maxLength: 20, autoComplete: 'given-name' })}
              {field('lastName', 'Last Name', 'text', { maxLength: 20, autoComplete: 'family-name' })}
              {field('email', 'Email Address', 'email', { autoComplete: 'off' })}
              {field('phone', 'Mobile Number', 'tel', { maxLength: 11, placeholder: '09XXXXXXXXX', autoComplete: 'off' })}
              {field('dob', 'Date of Birth', 'date', { required: false, max: maxDate })}
              <label style={styles.field}><span>Branch Location *</span><select name="branch" value={form.branch} onChange={change} disabled={busy} style={styles.input}>{branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}</select></label>
              {field('password', 'Password', 'password', { maxLength: 128, autoComplete: 'new-password' })}
              {field('confirmPassword', 'Confirm Password', 'password', { maxLength: 128, autoComplete: 'new-password' })}
            </div>
            <p style={{ color: '#666', fontSize: 12 }}>Password: 8–128 characters including uppercase, lowercase, a number and a symbol.</p>
            <div style={styles.actions}>
              <button type="button" onClick={onClose} disabled={busy} style={styles.cancel}>Cancel</button>
              <button type="submit" disabled={busy} style={buttonStyle}><Plus size={18} style={{ marginRight: 8 }} />{busy ? 'Adding Patient...' : 'Add Patient'}</button>
            </div>
          </form>
        )}
      </PatientDialog>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1100 },
  modal: { background: 'white', color: '#444', padding: 30, borderRadius: 15, width: 600, maxWidth: '100%', maxHeight: '90dvh', overflowY: 'auto', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  close: { border: 'none', background: 'transparent', color: '#666', cursor: 'pointer', padding: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 7, fontSize: 14, fontWeight: 600, minWidth: 0 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: 'white', color: '#444' },
  error: { color: '#b91c1c', fontSize: 12, fontWeight: 400 },
  actions: { display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  cancel: { background: 'white', color: '#666', border: '1px solid #ddd', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
};
