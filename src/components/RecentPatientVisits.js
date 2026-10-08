import { useState } from 'react';
import { User } from 'lucide-react';
import PaginatedList from './PaginatedList';

function visitDate(visit) {
  const value = String(visit.growthDate || visit.date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.getFullYear() === Number(value.slice(0, 4)) && date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8, 10)) ? date : null;
}

export default function RecentPatientVisits({ visits, loading, error, onRefresh, styles }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [refreshed, setRefreshed] = useState(false);
  const [version, setVersion] = useState(0);
  const refresh = async () => {
    if (refreshing || loading) return;
    setRefreshing(true);
    setRefreshError('');
    try {
      await onRefresh();
      setRefreshed(true);
      setVersion(value => value + 1);
    } catch (err) {
      setRefreshError('Unable to refresh recent visits. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  const sorted = visits.filter(visit => visit.status === 'Completed').slice().sort((a, b) => {
    const dateDifference = (visitDate(b)?.getTime() || 0) - (visitDate(a)?.getTime() || 0);
    if (dateDifference) return dateDifference;
    // Missing dates retain API order rather than implying a visit date from booking creation.
    if (!visitDate(a)) return 0;
    const seconds = time => {
      const match = String(time || '').match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
      if (!match) return 0;
      let hour = Number(match[1]);
      if (match[4]) hour = hour % 12 + (match[4].toUpperCase() === 'PM' ? 12 : 0);
      return hour * 3600 + Number(match[2]) * 60 + Number(match[3] || 0);
    };
    return seconds(b.time) - seconds(a.time) || Number(b.id || 0) - Number(a.id || 0);
  });
  const message = refreshError || (!refreshed && error ? 'Recent patient visits could not be loaded. Please try Refresh.' : '');
  return (
    <section className="ov-panel" style={styles.listCard} aria-label="Recent Patient Visits" aria-busy={loading || refreshing}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <p style={{ ...styles.sectionTitle, margin: 0 }}>Recent Patient Visits</p>
        <button type="button" style={styles.reportBtn} onClick={refresh} disabled={loading || refreshing} aria-label="Refresh recent patient visits">{refreshing ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      <p style={{ ...styles.pId, margin: '0 0 12px' }}>Completed visits · Latest appointment date first</p>
      {message && <p role="alert" style={{ fontSize: 13 }}>{message}{sorted.length > 0 ? ' Showing previously loaded visits.' : ''}</p>}
      {loading ? <p role="status" style={styles.emptyText}>Loading recent patient visits...</p> : sorted.length > 0 ? (
        <PaginatedList pageSize={10} resetKey={version} label="Recent patient visits pages">
          {sorted.map((visit, index) => (
            <div key={visit.id ?? index} style={styles.patientRow}>
              <div style={styles.pAvatar}><User size={18} color="var(--ov-on-color, #fff)" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.pName}>{visit.patientName || 'Guest'}</p>
                <p style={styles.pId}>{visit.booking_ref ? `Booking: ${visit.booking_ref}` : `Appointment: ${visit.id ?? 'N/A'}`}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={styles.pType}>{visit.serviceType || 'Check-up'}</p>
                <p style={styles.pTime}>{visitDate(visit)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Date unavailable'}</p>
                <p style={styles.pTime}>{visit.time || 'Time unavailable'}</p>
              </div>
            </div>
          ))}
        </PaginatedList>
      ) : !message && <div style={styles.emptyState}><p role="status" style={styles.emptyText}>No completed patient visits recorded.</p></div>}
    </section>
  );
}
