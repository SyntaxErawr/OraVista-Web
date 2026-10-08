import { useState } from 'react';
import { getPatientGrowth } from '../utils/patientGrowth';

export default function PatientGrowthChart({ appointments, loading, error, now }) {
  const [selected, setSelected] = useState(null);
  if (loading) return <p role="status">Loading patient growth...</p>;
  if (error) return <p role="status">Patient growth could not be loaded. Please refresh the page.</p>;
  if (appointments.some(item => item.status === 'Completed' && (item.patientId === undefined || !item.growthDate))) {
    return <p role="status">Patient growth data is unavailable. Please try again later.</p>;
  }
  const months = getPatientGrowth(appointments, now);
  if (!months.some(month => month.total)) return <p role="status">No completed patient visits recorded in the last 6 months.</p>;
  const current = months[5];
  const previous = months[4];
  const change = previous.total
    ? `${Math.abs((current.total - previous.total) / previous.total * 100).toFixed(1)}% ${current.total >= previous.total ? 'more' : 'fewer'} patients than ${previous.label}`
    : 'No patients last month to compare.';
  const max = Math.max(...months.map(month => month.total), 1);
  const active = months.find(month => month.key === selected) || current;
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: '0 0 4px', fontSize: 13 }}>{current.total} unique patients this month · {change}</p>
      <p style={{ margin: '0 0 12px', fontSize: 11 }}>Completed visits · Current month to date</p>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 12 }}>
        <span><span style={{ color: '#087F8C' }}>●</span> New</span>
        <span><span style={{ color: '#60a5fa' }}>●</span> Returning</span>
      </div>
      <div role="group" aria-label="Patient growth over the last six months" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6 }}>
        {months.map(month => {
          const description = `${month.label}: ${month.total} patients, ${month.newPatients} new, ${month.returningPatients} returning`;
          return (
            <button key={month.key} type="button" title={description} aria-label={description}
              onMouseEnter={() => setSelected(month.key)} onFocus={() => setSelected(month.key)} onClick={() => setSelected(month.key)}
              style={{ border: '1px solid var(--ov-on-line, #dce5e7)', borderRadius: 6, background: 'transparent', color: 'inherit', padding: 4, cursor: 'pointer', minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12 }}>{month.total}</span>
              <span aria-hidden="true" style={{ height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', margin: '4px auto', maxWidth: 30 }}>
                <span style={{ display: 'block', height: `${month.returningPatients / max * 100}%`, background: '#60a5fa' }} />
                <span style={{ display: 'block', height: `${month.newPatients / max * 100}%`, background: '#087F8C' }} />
              </span>
              <span style={{ display: 'block', fontSize: 10 }}>{month.label}</span>
            </button>
          );
        })}
      </div>
      <p role="status" style={{ margin: '10px 0', fontSize: 12 }}>{active.label}: {active.newPatients} new, {active.returningPatients} returning</p>
      <p style={{ margin: 0, fontSize: 11 }}>Each patient is counted once per month. New patients have their first completed visit that month.</p>
    </div>
  );
}
