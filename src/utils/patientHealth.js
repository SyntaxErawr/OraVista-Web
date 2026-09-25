const AI_BASE_URL = (process.env.REACT_APP_AI_BASE_URL?.trim() ||
  'https://oravista-ai-engine-474976105474.asia-southeast1.run.app').replace(/\/+$/, '');

// The service uses specific 404 responses for assessments that do not exist yet.
// Unknown routes and genuine request failures must still be shown as errors.
export async function fetchPatientHealth(userId, section) {
  const labels = { analytics: 'Health history', 'oral-health-risk': 'Risk assessment' };
  const label = labels[section];
  if (!label || userId == null) throw new Error('Please sign in again to load your health information.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${AI_BASE_URL}/api/patient/get/${encodeURIComponent(userId)}/${section}`, { signal: controller.signal, cache: 'no-store' });
    if (response.status === 204) return null;
    const data = await response.json().catch(() => undefined);
    const detail = typeof data?.detail === 'string' ? data.detail : '';
    const missingRecord = section === 'analytics'
      ? /^Analytics for patient .+ not found\.?$/i.test(detail)
      : /^No risk assessment found for patient ID .+\.?$/i.test(detail);
    if (response.status === 404 && missingRecord) return null;
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error(`${label} could not be accessed. Please sign in again.`);
      throw new Error(`${label} is temporarily unavailable from the health service. Please try again.`);
    }
    if (data === undefined) throw new Error(`${label} could not be read. Please try again.`);
    if (data === null) return null;
    if (typeof data !== 'object' || Array.isArray(data)) throw new Error(`${label} could not be read. Please try again.`);
    return Object.keys(data).length ? data : null;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`${label} took too long to load. Please try again.`);
    if (error instanceof TypeError) throw new Error(`${label} could not reach the health service. Check your connection and try again.`);
    throw error;
  } finally { clearTimeout(timer); }
}
