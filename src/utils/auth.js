import { API_BASE_URL, DEPLOYED_API_BASE_URL } from '../config/api';
export async function verifyCode(email, challengeId, code) {
  const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, challengeId, code}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Verification failed.');
  return result;
}
export function saveSession(token) {
  if (token) localStorage.setItem('userToken', token);
}
export function installAuthFetch() {
  const original = window.fetch.bind(window);
  let redirecting = false;
  window.fetch = async (input, options = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (typeof url !== 'string' || !url.startsWith(API_BASE_URL + '/api/')) return original(input, options);
    const headers = new Headers(options.headers || input?.headers || {});
    const signedIn = localStorage.getItem('user');
    const token = signedIn && localStorage.getItem('userToken');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    let request = input;
    let fetchOptions = {...options, headers};
    if (process.env.NODE_ENV === 'production' && API_BASE_URL === DEPLOYED_API_BASE_URL) {
      request = url.slice(API_BASE_URL.length);
      if (typeof input !== 'string') {
        const source = new Request(input, fetchOptions);
        fetchOptions = {
          ...options,
          method: source.method,
          headers: source.headers,
          mode: source.mode,
          credentials: source.credentials,
          cache: source.cache,
          redirect: source.redirect,
          referrer: source.referrer,
          referrerPolicy: source.referrerPolicy,
          integrity: source.integrity,
          keepalive: source.keepalive,
          signal: source.signal,
        };
        if (source.method !== 'GET' && source.method !== 'HEAD') {
          // Preserve JSON and multipart bodies without converting them to streaming uploads.
          fetchOptions.body = await source.blob();
        }
      }
    }
    const response = await original(request, fetchOptions);
    if (response.status === 401 && signedIn && !redirecting) {
      const data = await response.clone().json().catch(() => ({}));
      if (data.code === 'SESSION_EXPIRED' && localStorage.getItem('userToken') === token) {
        redirecting = true;
        let role;
        try { role = JSON.parse(signedIn).role; } catch (_) { /* Invalid cached session. */ }
        localStorage.removeItem('user');
        localStorage.removeItem('userToken');
        window.location.assign(['admin','staff','dentist'].includes(role) ? '/clinic/login' : '/login');
      }
    }
    return response;
  };
}
