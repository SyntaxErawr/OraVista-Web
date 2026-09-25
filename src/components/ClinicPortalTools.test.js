import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ClinicPortalProvider, PortalSearch, RoleNotifications } from './ClinicPortalTools';
import { matchesAppointment, scopeAppointments, todaySummary, appointmentAlerts } from '../utils/clinicAppointments';
import AppointmentCalendar from './AppointmentCalendar';
import StaffBooking from '../pages/c_staff/G_StaffBookingPage';
import AdminAppointments from '../pages/b_admin/D_AdminAppointmentPage';
import StaffAppointments from '../pages/c_staff/D_StaffAppointmentPage';
import DentistAppointments from '../pages/d_dentist/D_DentistAppointmentPage';
const mockNavigate = jest.fn();
const mockParams = new URLSearchParams();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useLocation: () => ({ pathname: '/admin/appointments' }), useSearchParams: () => [mockParams] }), { virtual: true });
const originalFetch = global.fetch;
const rows = [
  { id: 1, booking_ref: 'OV-001', patientName: 'Alice Patient', dentist: 'Dr. Jane Cruz', dentist_id: 7, date: '2099-10-10', time: '02:30 PM', status: 'Pending', serviceType: 'Cleaning' },
  { id: 2, booking_ref: 'OV-002', patientName: 'Bob Patient', dentist: 'Dr. John Reyes', dentist_id: 8, date: '2099-10-11', time: '09:00 AM', status: 'Confirmed', serviceType: 'Consultation' },
];
beforeEach(() => { localStorage.clear(); localStorage.setItem('user', JSON.stringify({ id: 7, role: 'admin', first_name: 'Jane', last_name: 'Cruz' })); mockNavigate.mockClear(); mockParams.delete('q'); mockParams.delete('appointment'); global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ schedule: rows }) })); });
afterEach(() => { global.fetch = originalFetch; });
test('filters combine query, time, status, date and database reference', () => {
 expect(matchesAppointment(rows[0], { query: 'alice cleaning 14:30', date: '2099-10-10', fromTime: '14:00', toTime: '15:00', status: 'Pending' })).toBe(true);
 expect(matchesAppointment(rows[0], { fromTime: '15:00' })).toBe(false);
 expect(matchesAppointment({ ...rows[0], dbId: 1, id: 'OV-001' }, { appointment: '1' })).toBe(true);
 expect(todaySummary(rows, '2099-10-11')).toEqual({ total: 1, confirmed: 1, pending: 0, canceled: 0, completed: 0 });
});
test('dentist scope uses identity and role notifications differ', () => {
 expect(scopeAppointments(rows, { role: 'dentist', id: 7 })).toEqual([rows[0]]);
 expect(scopeAppointments(rows, { role: 'patient', id: 7 })).toEqual([]);
 expect(appointmentAlerts(rows, { role: 'dentist', id: 7 }).map(a => a.title)).toEqual(['Visit assigned to you']);
 expect(appointmentAlerts(rows, { role: 'staff', id: 7 })).toHaveLength(2);
});
test('header search navigates to a matching appointment or all matches', async () => {
 render(<ClinicPortalProvider><PortalSearch /></ClinicPortalProvider>);
 const input = screen.getByRole('searchbox'); fireEvent.change(input, { target: { value: 'Alice' } });
 fireEvent.click(await screen.findByRole('button', { name: /Alice Patient/ }));
 expect(mockNavigate).toHaveBeenLastCalledWith('/admin/appointments?appointment=1');
 fireEvent.submit(screen.getByRole('search')); expect(mockNavigate).toHaveBeenLastCalledWith('/admin/appointments?q=Alice');
});
test('notifications persist read state and open the correct role route', async () => {
 localStorage.setItem('user', JSON.stringify({ role: 'dentist', id: 7 }));
 render(<ClinicPortalProvider><RoleNotifications /></ClinicPortalProvider>);
 await screen.findByRole('button', { name: 'Notifications, 1 unread' });
 fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));
 fireEvent.click(await screen.findByRole('button', { name: /Visit assigned to you/ }));
 expect(mockNavigate).toHaveBeenLastCalledWith('/dentist/appointments?appointment=1');
 expect(JSON.parse(localStorage.getItem('oravista:clinic-alerts:dentist:7'))).toHaveLength(1);
 expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
});
test.each([[AdminAppointments, 'admin'], [StaffAppointments, 'staff'], [DentistAppointments, 'dentist']])('%s filters real appointment cards and supports notification links', async (Page, role) => {
 localStorage.setItem('user', JSON.stringify({ role, id: 7 }));
 mockParams.set('appointment', '1'); render(<Page />);
 await screen.findByText('Alice Patient'); expect(screen.queryByText('Bob Patient')).toBeNull();
 fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
 if (role !== 'dentist') expect(await screen.findByText('Bob Patient')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Search appointments'), { target: { value: 'no match' } });
 expect(screen.queryByText('Alice Patient')).toBeNull();
 expect(screen.getByText('0 appointments found')).toBeTruthy();
});
test('failed schedule loads expose retry rather than silently appearing empty', async () => {
 global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({ message: 'Unavailable' }) }));
 render(<AdminAppointments />); expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load appointments');
 global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ schedule: rows }) }));
 fireEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(await screen.findByText('Alice Patient')).toBeTruthy();
});
test('calendar follows filter date and selecting a day toggles it', async () => {
 const select = jest.fn(); render(<AppointmentCalendar selectedDate="2099-10-10" appointments={rows} onSelect={select} />);
 await screen.findByRole('heading', { name: 'October 2099' });
 fireEvent.click(screen.getByRole('button', { name: /October 10, 2099, 1 appointments/ })); expect(select).toHaveBeenCalledWith(null);
});

test('clinic booking requires a patient, blocks failed availability and reports save failures', async () => {
 let failAvailability = true;
 global.fetch = jest.fn(async (url, options) => {
  if (options?.method === 'POST') return { ok: false, json: async () => ({ message: 'That slot is no longer available.' }) };
  if (url.endsWith('/api/dentists')) return { ok: true, json: async () => [{ first_name: 'Jane', last_name: 'Cruz', branch: 'Main', status: 'Available' }] };
  if (url.includes('check-availability')) return { ok: !failAvailability, json: async () => failAvailability ? {} : [] };
  return { ok: true, json: async () => ({ schedule: [] }) };
 });
 render(<StaffBooking />);
 await screen.findByRole('option', { name: 'Main' });
 fireEvent.change(screen.getByLabelText('Branch'), { target: { value: 'Main' } });
 fireEvent.change(screen.getByLabelText('Service'), { target: { value: 'General Dentistry' } });
 fireEvent.click(screen.getByRole('button', { name: /Oral Prophylaxis/ }));
 fireEvent.change(screen.getByLabelText('Dentist'), { target: { value: 'Dr. Jane Cruz' } });
 const date = screen.getByLabelText('Date').options[1].value;
 fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } });
 await screen.findByRole('alert');
 expect(screen.getByRole('button', { name: 'Confirm Booking' })).toBeDisabled();
 expect(screen.getByRole('button', { name: '10:00 AM' })).toBeDisabled();
 failAvailability = false; fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
 await waitFor(() => expect(screen.getByRole('button', { name: '10:00 AM' })).not.toBeDisabled());
 fireEvent.click(screen.getByRole('button', { name: '10:00 AM' }));
 expect(screen.getByRole('button', { name: 'Confirm Booking' })).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Patient ID'), { target: { value: '42' } });
 fireEvent.click(screen.getByRole('button', { name: 'Confirm Booking' }));
 fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
 expect(await screen.findByRole('alert')).toHaveTextContent('That slot is no longer available.');
 const call = global.fetch.mock.calls.find(([, options]) => options?.method === 'POST');
 expect(JSON.parse(call[1].body).user_id).toBe('42');
 expect(screen.queryByText('Booking Successful!')).toBeNull();
});
