import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Calendar, X } from 'lucide-react';
import PatientDialog from './PatientDialog';
export default function DentistDirectoryActions({ dentist, role }) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  return <div className="ov-directory-actions">
    <button type="button" onClick={() => setOpen(true)}><Eye size={16} /> Details</button>
    <button type="button" onClick={() => navigate('/' + role + '/appointments?' + new URLSearchParams({ dentist: dentist.name }))}><Calendar size={16} /> Schedule</button>
    {open && <PatientDialog onClose={() => setOpen(false)} className="ov-dialog-backdrop">
      <section className="ov-dentist-details" aria-labelledby="dentist-details-title">
        <div className="ov-dialog-heading"><h2 id="dentist-details-title">{dentist.name}</h2><button type="button" aria-label="Close dentist details" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <dl><dt>Dentist ID</dt><dd>{dentist.id}</dd><dt>Specialty</dt><dd>{dentist.specialty}</dd><dt>Branch</dt><dd>{dentist.branch}</dd><dt>Patient load</dt><dd>{dentist.patients}</dd><dt>Status</dt><dd>{dentist.status}</dd></dl>
      </section>
    </PatientDialog>}
  </div>;
}
