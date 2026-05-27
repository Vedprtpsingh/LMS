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
  return response.json();
}

export const fetchCourses = (role, userId) =>
  request(`${BASE}?role=${encodeURIComponent(role)}&userId=${encodeURIComponent(userId)}`);

export const createCourse = (payload) =>
  request(BASE, { method: 'POST', body: JSON.stringify(payload) });

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
