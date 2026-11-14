import { Headers, Request, Response } from 'whatwg-fetch';

const backend = 'https://oravista-server-474976105474.asia-southeast1.run.app';
const originalFetch = window.fetch;
const originalHeaders = window.Headers;
const originalRequest = window.Request;
const originalNodeEnv = process.env.NODE_ENV;
const originalApiUrl = process.env.REACT_APP_API_BASE_URL;
let transport;

beforeEach(() => {
  jest.resetModules();
  process.env.NODE_ENV = 'production';
  delete process.env.REACT_APP_API_BASE_URL;
  localStorage.clear();
  window.Headers = Headers;
  window.Request = Request;
  transport = jest.fn(async () => new Response(JSON.stringify({ message: 'Validation failed' }), {
    status: 400, headers: { 'Content-Type': 'application/json' },
  }));
  window.fetch = transport;
});

afterEach(() => {
  window.fetch = originalFetch;
  window.Headers = originalHeaders;
  window.Request = originalRequest;
  process.env.NODE_ENV = originalNodeEnv;
  if (originalApiUrl === undefined) delete process.env.REACT_APP_API_BASE_URL;
  else process.env.REACT_APP_API_BASE_URL = originalApiUrl;
  localStorage.clear();
});

const install = () => require('./auth').installAuthFetch();

test('production login reaches the same-origin proxy and preserves backend validation errors', async () => {
  install();
  const body = JSON.stringify({ email: '', password: '' });
  const response = await window.fetch(`${backend}/api/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
  });
  const [url, options] = transport.mock.calls[0];
  expect(url).toBe('/api/login');
  expect(options.method).toBe('POST');
  expect(options.body).toBe(body);
  expect(options.headers.get('Content-Type')).toBe('application/json');
  expect(options.headers.has('Authorization')).toBe(false);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ message: 'Validation failed' });
});

test('legacy API calls retain their query, update body and session when proxied', async () => {
  localStorage.setItem('user', JSON.stringify({ id: 7, role: 'patient' }));
  localStorage.setItem('userToken', 'session-fixture');
  install();
  const body = JSON.stringify({ id: 7, occupation: 'Student' });
  await window.fetch(`${backend}/api/update-profile?source=web`, { method: 'PUT', body });
  const [url, options] = transport.mock.calls[0];
  expect(url).toBe('/api/update-profile?source=web');
  expect(options.method).toBe('PUT');
  expect(options.body).toBe(body);
  expect(options.headers.get('Authorization')).toBe('Bearer session-fixture');
});

test('Request inputs retain the method, body and caller headers across the proxy', async () => {
  install();
  const body = JSON.stringify({ email: 'test@example.test', action: 'forgot_password' });
  const input = new Request(`${backend}/api/send-otp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'fixture' },
    body,
  });
  await window.fetch(input);
  const [url, options] = transport.mock.calls[0];
  expect(url).toBe('/api/send-otp');
  expect(options.method).toBe('POST');
  expect(await new Response(options.body).text()).toBe(body);
  expect(options.headers.get('X-Request-Id')).toBe('fixture');
});

test('multipart uploads preserve their body and let fetch select the boundary', async () => {
  install();
  const body = new FormData();
  body.append('image', new File(['fixture'], 'profile.png', { type: 'image/png' }));
  await window.fetch(`${backend}/api/upload-profile`, { method: 'POST', body });
  const [url, options] = transport.mock.calls[0];
  expect(url).toBe('/api/upload-profile');
  expect(options.body).toBe(body);
  expect(options.headers.has('Content-Type')).toBe(false);
});

test('external services never receive the patient session from this wrapper', async () => {
  localStorage.setItem('user', JSON.stringify({ id: 7 }));
  localStorage.setItem('userToken', 'session-fixture');
  install();
  const url = `https://external.example.test/image?next=${backend}/api/profile`;
  await window.fetch(url, { method: 'GET' });
  expect(transport).toHaveBeenCalledWith(url, { method: 'GET' });
});

test('local development continues to call the backend directly', async () => {
  process.env.NODE_ENV = 'development';
  install();
  await window.fetch(`${backend}/api/auth-health`);
  expect(transport.mock.calls[0][0]).toBe(`${backend}/api/auth-health`);
});

test('an explicitly configured alternate backend retains its configured destination', async () => {
  process.env.REACT_APP_API_BASE_URL = 'https://alternate.example.test/';
  install();
  await window.fetch('https://alternate.example.test/api/login', { method: 'POST' });
  expect(transport.mock.calls[0][0]).toBe('https://alternate.example.test/api/login');
});
