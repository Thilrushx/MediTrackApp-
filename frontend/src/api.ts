const BASE        = '/api';
const TOKEN_KEY   = 'meditrack_token';

// ── Core request helper ───────────────────────────────────────────────────────

const req = async (method: string, path: string, body?: unknown) => {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Surface 401/403 clearly so AuthContext can catch them
  if (res.status === 401 || res.status === 403) {
    const data = await res.json().catch(() => ({}));
    const err  = new Error((data as any).error || 'Unauthorised') as any;
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
};

// ── Multipart upload helper (no Content-Type — browser sets it with boundary) ─
const upload = async (path: string, formData: FormData) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ── API surface ───────────────────────────────────────────────────────────────
export const api = {

  // Auth
  login:          (credentials: { email: string; password: string }) =>
    req('POST', '/auth/login', credentials),
  getMe:          () => req('GET', '/auth/me'),
  logout:         () => req('POST', '/auth/logout'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    req('POST', '/auth/change-password', data),
  resetPassword:  (userId: string, newPassword: string) =>
    req('POST', `/auth/reset-password/${userId}`, { newPassword }),

  // Users
  getUsers:        (role?: string) =>
    req('GET', `/users${role ? `?role=${role}` : ''}`),
  getUser:         (id: string) => req('GET', `/users/${id}`),
  createCaregiver: (data: unknown) => req('POST', '/users/caregivers', data),
  updateUser:      (id: string, data: unknown) => req('PUT', `/users/${id}`, data),
  setUserActive:   (id: string, isActive: boolean) =>
    req('PATCH', `/users/${id}/active`, { isActive }),
  deleteUser:      (id: string) => req('DELETE', `/users/${id}`),

  // Patients
  getPatients: (filters?: { doctorId?: string; caregiverId?: string }) => {
    const q = filters?.doctorId
      ? `?doctorId=${filters.doctorId}`
      : filters?.caregiverId
      ? `?caregiverId=${filters.caregiverId}`
      : '';
    return req('GET', `/patients${q}`);
  },
  getPatient:    (id: string)              => req('GET',    `/patients/${id}`),
  createPatient: (data: unknown)           => req('POST',   '/patients', data),
  updatePatient: (id: string, data: unknown) => req('PUT',  `/patients/${id}`, data),
  deletePatient: (id: string)              => req('DELETE', `/patients/${id}`),

  // Medications
  getMedications:   (patientId?: string) =>
    req('GET', `/medications${patientId ? `?patientId=${patientId}` : ''}`),
  createMedication: (data: unknown) => req('POST',   '/medications', data),
  deleteMedication: (id: string)    => req('DELETE', `/medications/${id}`),

  // Adherence
  getLogs:  ()             => req('GET',  '/adherence'),
  takeDose: (data: unknown) => req('POST', '/adherence/take', data),
  missDose: (data: unknown) => req('POST', '/adherence/miss', data),

  // Alerts
  getAlerts:    ()           => req('GET',  '/alerts'),
  resolveAlert: (id: string) => req('POST', `/alerts/resolve/${id}`),

  // Patient Notes
  getNotes:   ()             => req('GET',  '/patient-notes'),
  createNote: (data: unknown) => req('POST', '/patient-notes', data),

  // Medical Reports
  getReports:   (patientId?: string) =>
    req('GET', `/reports${patientId ? `?patientId=${patientId}` : ''}`),
  deleteReport: (id: string) => req('DELETE', `/reports/${id}`),
  uploadReport: (formData: FormData) => upload('/reports', formData),
};
