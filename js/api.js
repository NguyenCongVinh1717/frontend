// js/api.js - sửa để dùng backend tại http://localhost:8080/api
const API_BASE = 'http://localhost:8080/api'; // <-- đổi tại đây nếu backend khác

function joinApiPath(base, path) {
  // ensure no double slashes when joining base + path
  const b = base.replace(/\/+$/, '');         // remove trailing slash from base
  const p = String(path).replace(/^\/+/, ''); // remove leading slash from path
  return b + '/' + p;
}

async function apiRequest(method, path, body = undefined, skipAuth = false) {
  // if path is full URL (starts with http/https) use it as-is
  const url = (/^https?:\/\//i).test(path) ? path : joinApiPath(API_BASE, path);

  const opts = { method, headers: {} };

  if (body !== undefined && body !== null) {
    // allow FormData passthrough
    if (body instanceof FormData) {
      opts.body = body;
      // do not set Content-Type; browser will set multipart/form-data with boundary
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  // attach Authorization if token present and not skipping auth
  try {
    if (!skipAuth) {
      const token = localStorage.getItem('token');
      if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    }
  } catch (e) { /* ignore localStorage errors */ }

  // If your server uses cookie-based session (instead of Bearer token),
  // uncomment the following line so browser sends cookies:
  // opts.credentials = 'include';

  const res = await fetch(url, opts);

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

  if (!res.ok) {
    const message = data && (data.message || data.error) ? (data.message || data.error) : (typeof data === 'string' ? data : res.statusText);
    const err = new Error(message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

function apiGet(path, skipAuth = false) { return apiRequest('GET', path, undefined, skipAuth); }
function apiPost(path, body, skipAuth = false) { return apiRequest('POST', path, body, skipAuth); }
function apiPut(path, body, skipAuth = false) { return apiRequest('PUT', path, body, skipAuth); }
function apiDelete(path, skipAuth = false) { return apiRequest('DELETE', path, undefined, skipAuth); }

window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
