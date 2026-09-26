// No auth: this app has no login/signup layer, so requests are sent
// plainly with no Authorization header — the backend treats every request
// as a single local user (see backend/app/security.py).
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handle(resPromise) {
  const res = await resPromise;
  if (!res.ok) {
    let detail = res.statusText || `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => handle(fetch(`${API_BASE}${path}`)),

  post: (path, body) =>
    handle(
      fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    ),

  put: (path, body) =>
    handle(
      fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    ),

  delete: (path) => handle(fetch(`${API_BASE}${path}`, { method: 'DELETE' })),

  upload: (path, formData) =>
    handle(
      fetch(`${API_BASE}${path}`, {
        method: 'POST',
        // No Content-Type here — the browser sets the multipart boundary itself.
        body: formData,
      }),
    ),
};
