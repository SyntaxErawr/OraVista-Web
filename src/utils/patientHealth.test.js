import { fetchPatientHealth } from './patientHealth';
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, json: async () => data });
test.each([
 ['analytics', 'Analytics for patient 7 not found.'],
 ['oral-health-risk', 'No risk assessment found for patient ID 7.'],
])('a missing %s record is an empty state, not a connection error', async (section, detail) => {
 global.fetch = jest.fn(async () => response(404, { detail }));
 await expect(fetchPatientHealth(7, section)).resolves.toBeNull();
});
test('unknown routes and server failures remain errors', async () => {
 global.fetch = jest.fn(async () => response(404, { detail: 'Not Found' }));
 await expect(fetchPatientHealth(7, 'analytics')).rejects.toThrow('temporarily unavailable');
 global.fetch = jest.fn(async () => response(503, {}));
 await expect(fetchPatientHealth(7, 'oral-health-risk')).rejects.toThrow('temporarily unavailable');
});
test('network failures, malformed JSON, and invalid objects are not disguised as missing records', async () => {
 global.fetch = jest.fn(async () => { throw new TypeError('Failed to fetch'); });
 await expect(fetchPatientHealth(7, 'analytics')).rejects.toThrow('Check your connection');
 global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError(); } }));
 await expect(fetchPatientHealth(7, 'analytics')).rejects.toThrow('could not be read');
 global.fetch = jest.fn(async () => response(200, []));
 await expect(fetchPatientHealth(7, 'analytics')).rejects.toThrow('could not be read');
});
test('valid assessments are preserved and requests can time out', async () => {
 const data = { risk_score: 2, risk_grade: 'Low' };
 global.fetch = jest.fn(async () => response(200, data));
 await expect(fetchPatientHealth(7, 'oral-health-risk')).resolves.toEqual(data);
 global.fetch = jest.fn(async () => { const error = new Error(); error.name = 'AbortError'; throw error; });
 await expect(fetchPatientHealth(7, 'analytics')).rejects.toThrow('took too long');
});
