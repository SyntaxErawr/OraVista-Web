import { useEffect } from 'react';
import { refreshPatientProfile } from '../utils/patientProfile';

export default function usePatientProfileSync() {
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'hidden') refreshPatientProfile().catch(() => {});
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = setInterval(refresh, 15000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
}
