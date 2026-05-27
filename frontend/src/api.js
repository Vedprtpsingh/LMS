const BASE = '/api/courses';

async function request(path, options) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed: ${response.status} ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const fetchCourses = (role, userId, search, status) => {
  const params = new URLSearchParams({ role, userId });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  return request(`${BASE}?${params.toString()}`);
};

export const fetchCourse = (id) => request(`${BASE}/${id}`);

export const createCourse = (payload) =>
  request(BASE, { method: 'POST', body: JSON.stringify(payload) });

export const updateCourse = (id, payload) =>
  request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteCourse = (id) =>
  request(`${BASE}/${id}`, { method: 'DELETE' });

export const submitCourse = (id) =>
  request(`${BASE}/${id}/submit`, { method: 'POST' });

export const approveCourse = (id) =>
  request(`${BASE}/${id}/approve`, { method: 'POST' });

export const rejectCourse = (id, comments) =>
  request(`${BASE}/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reviewer: 'admin@example.com', comments }),
  });

export const publishCourse = (id) =>
  request(`${BASE}/${id}/publish`, { method: 'POST' });

export const archiveCourse = (id) =>
  request(`${BASE}/${id}/archive`, { method: 'POST' });
