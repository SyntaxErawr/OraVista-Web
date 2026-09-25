export function readClinicUser() {
  try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
}

export const clinicDay = (now = new Date()) => new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
export const dateKey = value => typeof value === 'string' ? value.slice(0, 10) : '';
export const statusKey = value => String(value || '').trim().toLowerCase().replace(/^canceled$/, 'cancelled').replace(/^approved$/, 'confirmed');

export function dentistName(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/\b(dr|dra|doctor|dmd|dds)\b\.?/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

// Presentation scope for the legacy schedule response. The server must also enforce access.
export function scopeAppointments(rows, user) {
  const role = String(user?.role || '').toLowerCase();
  if (!['admin', 'staff', 'dentist'].includes(role)) return [];
  if (role !== 'dentist') return rows;
  const name = dentistName(`${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`);
  return rows.filter(row => {
    const assignedId = row.dentist_id ?? row.dentistId;
    if (assignedId != null) return user.id != null && String(assignedId) === String(user.id);
    return Boolean(name) && dentistName(row.dentist || row.dentist_name) === name;
  });
}

export function timeMinutes(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]), suffix = match[3]?.toUpperCase();
  if (minute > 59 || (suffix ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (suffix) hour = hour % 12 + (suffix === 'PM' ? 12 : 0);
  return hour * 60 + minute;
}

export function appointmentText(row) {
  const date = row.date || row.appointment_date;
  const formatted = date && !Number.isNaN(new Date(date).getTime())
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' }) : '';
  const minutes = timeMinutes(row.time || row.appointment_time);
  const time = minutes === null ? '' : `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} ${Math.floor(minutes / 60) % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${minutes >= 720 ? 'pm' : 'am'}`;
  return [row.dbId ?? row.id, row.booking_ref, row.id, row.patient || row.patientName, row.dentist || row.dentist_name,
    date, formatted, row.time, time, row.type || row.serviceType, row.status, row.branch, row.requestedDate, row.requestedTime].filter(v => v != null).join(' ').toLowerCase();
}

export function matchesAppointment(row, { query = '', date = '', dentist = '', status = '', fromTime = '', toTime = '', appointment = '' } = {}) {
  const minutes = timeMinutes(row.time || row.appointment_time);
  const from = timeMinutes(fromTime), to = timeMinutes(toTime);
  return (!query.trim() || query.toLowerCase().trim().split(/\s+/).every(word => appointmentText(row).includes(word))) &&
    (!date || dateKey(row.date || row.appointment_date) === date) &&
    (!dentist || (row.dentist || row.dentist_name) === dentist) &&
    (!status || statusKey(row.status) === statusKey(status)) &&
    (from === null || (minutes !== null && minutes >= from)) &&
    (to === null || (minutes !== null && minutes <= to)) &&
    (!appointment || String(row.dbId ?? row.id) === String(appointment));
}

export function todaySummary(rows, today = clinicDay()) {
  const appointments = rows.filter(row => dateKey(row.date) === today);
  return { total: appointments.length, confirmed: appointments.filter(a => statusKey(a.status) === 'confirmed').length,
    pending: appointments.filter(a => statusKey(a.status) === 'pending').length,
    completed: appointments.filter(a => statusKey(a.status) === 'completed').length,
    canceled: appointments.filter(a => statusKey(a.status) === 'cancelled').length };
}

export function appointmentAlerts(rows, user) {
  const labels = {
    admin: { pending: 'Appointment request', 'reschedule requested': 'Reschedule approval needed', cancelled: 'Appointment cancelled', 'late / no show': 'Late / no-show follow-up' },
    staff: { pending: 'Booking to review', confirmed: 'Confirmed visit to prepare', 'reschedule requested': 'Schedule change requested', cancelled: 'Schedule cancellation', 'late / no show': 'Patient follow-up needed' },
    dentist: { pending: 'Visit assigned to you', confirmed: 'Your confirmed appointment', 'reschedule requested': 'Change requested for your visit', cancelled: 'Your appointment was cancelled', 'late / no show': 'Your patient needs follow-up' },
  };
  const role = String(user?.role || '').toLowerCase(), titles = labels[role] || {};
  const cutoff = clinicDay(new Date(Date.now() - 7 * 86400000));
  return scopeAppointments(rows, user).filter(row => titles[statusKey(row.status)] &&
    (['pending', 'reschedule requested', 'late / no show'].includes(statusKey(row.status)) || dateKey(row.date) >= cutoff))
    .map(row => ({
      id: JSON.stringify([row.id, row.status, row.date, row.time, row.requestedDate, row.requestedTime, row.dentist]),
      appointmentId: row.id, title: titles[statusKey(row.status)],
      detail: [row.patientName || 'Patient', row.serviceType, dateKey(row.date), row.time].filter(Boolean).join(' · '),
      date: row.bookedAt || row.date || '', status: row.status,
    })).sort((a, b) => b.date.localeCompare(a.date));
}
