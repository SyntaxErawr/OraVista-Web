import React from 'react';
import { useLocation } from 'react-router-dom';
const titles = {
  dashboard: ['Clinic overview', 'Appointments, patients, and everyday care.'],
  patients: ['Patients', 'Find patient information and dental records.'],
  dentists: ['Dentist directory', 'Clinical staff, availability, and schedules.'],
  appointments: ['Appointments', 'Review visits and manage appointment requests.'],
  booking: ['Book an appointment', 'Choose a patient, treatment, and available time.'],
  diagnostics: ['Diagnostics', 'Review patient scans and assessments.'],
  'create-account': ['Create an account', 'Register a member of the clinic team.'],
  settings: ['Settings', 'Manage your account and preferences.'],
  profile: ['Profile', 'Your professional and account information.'],
  'patient-profile': ['Patient profile', 'Patient information and care history.'],
  billings: ['Billing', 'Review charges and payment records.'],
  analytics: ['Analytics', 'Patient health and care insights.'],
};
export default function ClinicPageTitle() {
  const { pathname } = useLocation();
  const [, role, page] = pathname.split('/');
  const [title, detail] = titles[page] || ['Clinic workspace', 'Manage your clinic.'];
  return <div className="ov-clinic-page-title"><span>{role} workspace</span><h1>{title}</h1><p>{detail}</p></div>;
}
