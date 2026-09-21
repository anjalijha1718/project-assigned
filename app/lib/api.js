const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getStoredAuth() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem('silentHouseAuth');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function setStoredAuth(token, user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('silentHouseAuth', JSON.stringify({ token, user }));
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('silentHouseAuth');
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, token } = options;
  const headers = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

export { API_BASE_URL };
