import { useSyncExternalStore } from 'react';

const preferenceKey = userId => `oravista-appointment-reminders:${userId}`;
const preferenceEvent = 'appointment-reminders-updated';

export function getAppointmentRemindersEnabled(userId) {
  if (!userId) return true;
  try {
    return localStorage.getItem(preferenceKey(userId)) !== 'false';
  } catch {
    return true;
  }
}

export function saveAppointmentReminders(userId, enabled) {
  if (!userId) throw new Error('Please sign in again to save your notification preferences.');
  localStorage.setItem(preferenceKey(userId), String(enabled));
  window.dispatchEvent(new Event(preferenceEvent));
}

function subscribe(onChange) {
  window.addEventListener('storage', onChange);
  window.addEventListener(preferenceEvent, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(preferenceEvent, onChange);
  };
}

export function useAppointmentReminders(userId) {
  return useSyncExternalStore(subscribe, () => getAppointmentRemindersEnabled(userId), () => true);
}
