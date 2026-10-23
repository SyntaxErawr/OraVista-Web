import { clinicContact, clinicPatient, patientRecordHtml } from './clinicRecordLayout';

test('clinic branches use the supplied contact details and never invent a patient address', () => {
  expect(clinicContact('Gil Puyat, Pasay')[1]).toBe('0977-373-0874');
  expect(clinicContact('Sta. Ana')[0]).toContain('Tejeron');
  expect(clinicContact('Pampanga')[1]).toBe('0993-873-7966');
  expect(clinicContact('Unknown branch')).toEqual(['Unknown branch', '']);
  expect(clinicPatient({ firstName: 'Test', lastName: 'Patient', age: 0 }).age).toBe(0);
  expect(clinicPatient({}).address).toBe('');
});

test('clinic form escapes patient text and leaves uncollected medical answers unselected', () => {
  const html = patientRecordHtml({ name: '<script>Patient</script>' });
  expect(html).toContain('&lt;script&gt;Patient&lt;/script&gt;');
  expect(html).not.toContain('<script>');
  expect(html).toContain('KING EPRES DENTAL CLINIC');
  expect(html).toContain('Signature over Printed Name');
  expect(html).not.toMatch(/checked|STI Sta|0874D/);
});
