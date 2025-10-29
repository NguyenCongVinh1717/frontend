// api.js - central API helper
const API_BASE = "http://localhost:8080/api"; // adjust if your backend runs on different origin/port

function getToken() {
  return localStorage.getItem('token');
}

// unified fetch helper: path like '/auth/login' or '/admin/students'
async function apiFetch(path, { method = 'GET', body = null, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (!token) throw new Error('No auth token');
    headers['Authorization'] = 'Bearer ' + token;
  }
  let url = API_BASE + path;
  const opts = { method, headers };
  if (body != null) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  // If response is no-content
  if (res.status === 204) return null;
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    // try to return backend message if exists
    const msg = (data && (data.message || data.error)) || res.statusText || 'Error';
    const err = new Error(String(msg));
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

async function apiGet(path) { return apiFetch(path, { method: 'GET' }); }
async function apiPost(path, body, auth = true) { return apiFetch(path, { method: 'POST', body, auth }); }
async function apiPut(path, body) { return apiFetch(path, { method: 'PUT', body }); }
async function apiDelete(path) { return apiFetch(path, { method: 'DELETE' }); }

// Export for inline usage (in HTML we load api.js so functions are global)
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
