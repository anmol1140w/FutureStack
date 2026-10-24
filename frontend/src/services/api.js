export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://futurestack-backend-gcp0.onrender.com' : '');

export function apiUrl(endpoint) {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!BACKEND_URL) return clean;
  const base = BACKEND_URL.replace(/\/+$/, '');
  return `${base}${clean}`;
}
