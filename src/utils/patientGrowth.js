// Count each identified patient once per month, using their first completed visit
// across the entire history to distinguish new patients from returning patients.
export function getPatientGrowth(appointments, now = new Date()) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      newPatients: 0, returningPatients: 0, total: 0,
    };
  });
  const firstVisit = new Map();
  const monthlyPatients = new Map(months.map(month => [month.key, new Set()]));
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  for (const appointment of appointments) {
    if (appointment.status !== 'Completed' || appointment.patientId == null) continue;
    const date = String(appointment.growthDate || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) continue;
    const parsed = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== Number(date.slice(0, 4)) || parsed.getMonth() + 1 !== Number(date.slice(5, 7)) || parsed.getDate() !== Number(date.slice(8, 10))) continue;
    const id = String(appointment.patientId);
    const month = date.slice(0, 7);
    if (!firstVisit.has(id) || month < firstVisit.get(id)) firstVisit.set(id, month);
    monthlyPatients.get(month)?.add(id);
  }
  for (const month of months) {
    for (const id of monthlyPatients.get(month.key)) {
      if (firstVisit.get(id) === month.key) month.newPatients += 1;
      else month.returningPatients += 1;
    }
    month.total = month.newPatients + month.returningPatients;
  }
  return months;
}
