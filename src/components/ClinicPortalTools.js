import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { appointmentAlerts, matchesAppointment, readClinicUser, scopeAppointments } from '../utils/clinicAppointments';
import PatientDialog from './PatientDialog';

const PortalContext = createContext(null);
export function ClinicPortalProvider({ children }) {
  const [user, setUser] = useState(readClinicUser);
  const [schedule, setSchedule] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [readIds, setReadIds] = useState([]), [storageError, setStorageError] = useState('');
  const key = `oravista:clinic-alerts:${user.role}:${user.id}`;
  const request = useRef(0);
  useEffect(() => { const sync = () => setUser(readClinicUser()); window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync); }, []);
  useEffect(() => {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); setReadIds(Array.isArray(value) ? value.filter(x => typeof x === 'string') : []); }
    catch { setReadIds([]); }
    setStorageError('');
  }, [key]);
  const refresh = useCallback(async () => {
    const version = ++request.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.schedule)) throw new Error('Could not load appointment updates. Please try again.');
      if (version === request.current) { setSchedule(scopeAppointments(data.schedule, user)); setError(''); }
    } catch {
      if (version === request.current) setError('Could not refresh appointment updates. Please try again.');
    } finally {
      window.clearTimeout(timer);
      if (version === request.current) setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    setSchedule([]); setLoading(true); refresh();
    const interval = window.setInterval(() => { if (!document.hidden) refresh(); }, 30000);
    window.addEventListener('focus', refresh);
    window.addEventListener('oravista:appointments-updated', refresh);
    const invalidate = () => { request.current++; };
    return () => { invalidate(); window.clearInterval(interval); window.removeEventListener('focus', refresh); window.removeEventListener('oravista:appointments-updated', refresh); };
  }, [refresh]);
  const alerts = useMemo(() => appointmentAlerts(schedule, user), [schedule, user]);
  const markRead = ids => {
    setReadIds(current => {
      const next = [...new Set([...current, ...ids])].slice(-1000);
      try { localStorage.setItem(key, JSON.stringify(next)); setStorageError(''); }
      catch { setStorageError('Read status could not be saved on this browser. It will reset when you leave.'); }
      return next;
    });
  };
  return <PortalContext.Provider value={{ user, schedule, loading, error, refresh, alerts, readIds, markRead, storageError }}>{children}</PortalContext.Provider>;
}

export function PortalSearch({ style, className }) {
  const portal = useContext(PortalContext);
  const navigate = useNavigate(), id = useId();
  const [query, setQuery] = useState(''), [open, setOpen] = useState(false);
  if (!portal) return null;
  const role = portal.user.role;
  const results = portal.schedule.filter(row => matchesAppointment(row, { query })).slice(0, 5);
  const go = params => { navigate(`/${role}/appointments?${new URLSearchParams(params)}`); setOpen(false); };
  return <form className="ov-portal-search" role="search" onSubmit={event => { event.preventDefault(); if (query.trim()) go({ q: query.trim() }); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
    <input style={style} className={className} type="search" aria-label="Search clinic appointments" placeholder="Search visits, patients, dentists…" value={query}
      onChange={event => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} aria-controls={id} />
    <button type="submit" className="ov-icon-button" aria-label="Find appointments" disabled={!query.trim()}><Search size={18} /></button>
    {open && query.trim() && <div className="ov-search-results" id={id}>
      <p>Search by patient, dentist, service, reference, date or time.</p>
      {portal.loading ? <p role="status">Loading appointments…</p> : portal.error ? <div role="alert"><p>{portal.error}</p><button type="button" onClick={portal.refresh}>Retry</button></div> : results.length ? results.map(row =>
        <button type="button" className="ov-search-result" key={row.id} onClick={() => go({ appointment: row.id })}>
          <strong>{row.patientName || 'Patient'} · {row.booking_ref || `Appointment ${row.id}`}</strong>
          <span>{row.dentist} · {String(row.date || '').slice(0, 10)} · {row.time}</span>
        </button>) : <p>No matching appointments.</p>}
      <button type="submit" className="ov-search-all">View all matches</button>
    </div>}
  </form>;
}

export function RoleNotifications() {
  const portal = useContext(PortalContext), navigate = useNavigate();
  const [open, setOpen] = useState(false), [onlyUnread, setOnlyUnread] = useState(false);
  if (!portal) return null;
  const unread = portal.alerts.filter(alert => !portal.readIds.includes(alert.id));
  const shown = onlyUnread ? unread : portal.alerts;
  return <>
    <button className="ov-icon-button ov-notification-trigger" type="button" aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`} aria-haspopup="dialog" onClick={() => { setOpen(true); portal.refresh(); }}>
      <Bell size={21} />{unread.length > 0 && <span className="ov-notification-count">{unread.length > 99 ? '99+' : unread.length}</span>}
    </button>
    {open && <PatientDialog className="ov-dialog-backdrop" onClose={() => setOpen(false)}>
      <section className="ov-notification-dialog">
        <div className="ov-dialog-heading"><h2>{portal.user.role === 'dentist' ? 'Your appointment updates' : portal.user.role === 'staff' ? 'Front desk updates' : 'Clinic notifications'}</h2><button className="ov-icon-button" type="button" aria-label="Close notifications" onClick={() => setOpen(false)}><X size={21} /></button></div>
        <p className="ov-availability-note">Live appointment updates · refreshes every 30 seconds. Read status is saved for your account on this browser.</p>
        <div className="ov-notification-actions"><button type="button" aria-pressed={onlyUnread} onClick={() => setOnlyUnread(!onlyUnread)}>{onlyUnread ? 'Show all' : `Unread (${unread.length})`}</button>
          <button type="button" disabled={!unread.length} onClick={() => portal.markRead(unread.map(alert => alert.id))}><CheckCheck size={16} /> Mark all read</button></div>
        {portal.error && <div className="ov-inline-error" role="alert">{portal.error} <button type="button" onClick={portal.refresh}>Retry</button></div>}
        {portal.storageError && <p role="status">{portal.storageError}</p>}
        {portal.loading ? <p role="status">Loading notifications…</p> : !shown.length ? <p>{onlyUnread ? 'You’re all caught up.' : 'No appointment updates for your role.'}</p> :
          <ul className="ov-notification-list">{shown.map(alert => <li key={alert.id} className={portal.readIds.includes(alert.id) ? '' : 'is-unread'}>
            <button type="button" className="ov-notification-item" onClick={() => { portal.markRead([alert.id]); setOpen(false); navigate(`/${portal.user.role}/appointments?${new URLSearchParams({ appointment: alert.appointmentId })}`); }}>
              <strong>{alert.title}</strong><span>{alert.detail}</span><small>{alert.status}{portal.readIds.includes(alert.id) ? ' · Read' : ' · Unread'}</small>
            </button>
          </li>)}</ul>}
      </section>
    </PatientDialog>}
  </>;
}
