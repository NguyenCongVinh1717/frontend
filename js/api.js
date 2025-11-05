
const API_BASE = 'http://localhost:8080/api'; 

function joinApiPath(base, path) {
  const b = base.replace(/\/+$/, '');        
  const p = String(path).replace(/^\/+/, ''); 
  return b + '/' + p;
}

async function apiRequest(method, path, body = undefined, skipAuth = false) {
  const url = (/^https?:\/\//i).test(path) ? path : joinApiPath(API_BASE, path);

  const opts = { method, headers: {} };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  try {
    if (!skipAuth) {
      const token = localStorage.getItem('token');
      if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    }
  } catch (e) { }

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
