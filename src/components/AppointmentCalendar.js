import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clinicDay, dateKey } from '../utils/clinicAppointments';

export default function AppointmentCalendar({ selectedDate, onSelect, appointments = [] }) {
  const [month, setMonth] = useState(() => new Date(`${clinicDay().slice(0, 7)}-01T12:00:00`));
  useEffect(() => { if (selectedDate) setMonth(new Date(`${selectedDate.slice(0, 7)}-01T12:00:00`)); }, [selectedDate]);
  const year = month.getFullYear(), index = month.getMonth(), length = new Date(year, index + 1, 0).getDate();
  const today = clinicDay(), counts = appointments.reduce((result, row) => { const day = dateKey(row.date); result[day] = (result[day] || 0) + 1; return result; }, {});
  return <section className="ov-panel ov-appointment-calendar" aria-label="Appointment calendar">
    <div className="ov-calendar-heading"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(year, index - 1, 1))}><ChevronLeft size={19} /></button>
      <h2 aria-live="polite">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
      <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(year, index + 1, 1))}><ChevronRight size={19} /></button></div>
    <div className="ov-calendar-grid">
      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <span className="ov-calendar-weekday" key={day}>{day}</span>)}
      {Array.from({ length: month.getDay() }, (_, i) => <span key={`blank-${i}`} />)}
      {Array.from({ length }, (_, i) => {
        const date = `${year}-${String(index + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
        return <button key={date} type="button" className="ov-calendar-day" aria-pressed={selectedDate === date} aria-current={date === today ? 'date' : undefined}
          aria-label={`${new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { dateStyle: 'full' })}, ${counts[date] || 0} appointments`} onClick={() => onSelect(selectedDate === date ? null : date)}>
          {i + 1}{counts[date] > 0 && <span className="ov-calendar-dot" />}
        </button>;
      })}
    </div>
    <p className="ov-availability-note">Outlined: today · Dot: appointments · Aqua: selected</p>
    {selectedDate && <button className="ov-calendar-reset" type="button" onClick={() => onSelect(null)}>Show all dates</button>}
  </section>;
}
