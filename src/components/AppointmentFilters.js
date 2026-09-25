import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export default function AppointmentFilters({ appointments, filters, setFilters, selectedDate, setSelectedDate, count, clear }) {
  const update = (key, value) => setFilters(current => ({ ...current, [key]: value, appointment: '' }));
  const dentists = [...new Set(appointments.map(a => a.dentist).filter(Boolean))].sort();
  const statuses = [...new Set(appointments.map(a => a.status).filter(Boolean))].sort();
  return <section className="ov-appointment-filters" aria-label="Appointment filters">
    <label className="ov-appointment-query"><span>Search appointments</span><div><Search size={17} /><input type="search" value={filters.query} onChange={event => update('query', event.target.value)} placeholder="Patient, dentist, service, reference, date or time" /></div></label>
    <label><span>Date</span><input type="date" value={selectedDate || ''} onChange={event => { update('appointment', ''); setSelectedDate(event.target.value || null); }} /></label>
    <label><span>Dentist</span><select value={filters.dentist} onChange={event => update('dentist', event.target.value)}><option value="">All dentists</option>{dentists.map(name => <option key={name}>{name}</option>)}</select></label>
    <label><span>Status</span><select value={filters.status} onChange={event => update('status', event.target.value)}><option value="">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
    <label><span>From time</span><input type="time" value={filters.fromTime} onChange={event => update('fromTime', event.target.value)} /></label>
    <label><span>To time</span><input type="time" value={filters.toTime} onChange={event => update('toTime', event.target.value)} /></label>
    <button type="button" className="ov-filter-clear" onClick={clear}><RotateCcw size={16} /> Clear filters</button>
    <p role="status" className="ov-filter-count">{filters.fromTime && filters.toTime && filters.fromTime > filters.toTime ? 'Choose an end time at or after the start time.' : `${count} appointment${count === 1 ? '' : 's'} found${filters.appointment ? ' · Opened from a notification or search result' : ''}`}</p>
  </section>;
}
