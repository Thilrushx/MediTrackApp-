const BASE = '/api';

const req = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Users
export const api = {
  // Users
  getUsers: (role?: string) =>
    req('GET', `/users${role ? `?role=${role}` : ''}`),

  // Patients
  getPatients: (filters?: { doctorId?: string; caregiverId?: string }) => {
    const q = filters?.doctorId
      ? `?doctorId=${filters.doctorId}`
      : filters?.caregiverId
      ? `?caregiverId=${filters.caregiverId}`
      : '';
    return req('GET', `/patients${q}`);
  },
  getPatient:    (id: string)       => req('GET',    `/patients/${id}`),
  createPatient: (data: unknown)    => req('POST',   `/patients`, data),
  updatePatient: (id: string, data: unknown) => req('PUT', `/patients/${id}`, data),
  deletePatient: (id: string)       => req('DELETE', `/patients/${id}`),

  // Medications
  getMedications:  (patientId?: string) =>
    req('GET', `/medications${patientId ? `?patientId=${patientId}` : ''}`),
  createMedication: (data: unknown) => req('POST',   `/medications`, data),
  deleteMedication: (id: string)    => req('DELETE', `/medications/${id}`),

  // Adherence
  getLogs:   ()                     => req('GET',  '/adherence'),
  takeDose:  (data: unknown)        => req('POST', '/adherence/take', data),
  missDose:  (data: unknown)        => req('POST', '/adherence/miss', data),

  // Alerts
  getAlerts:    ()          => req('GET',  '/alerts'),
  resolveAlert: (id: string) => req('POST', `/alerts/resolve/${id}`),

  // Patient Notes
  getNotes:    ()            => req('GET',  '/patient-notes'),
  createNote:  (data: unknown) => req('POST', '/patient-notes', data),

  // Medical Reports
  getReports: (patientId?: string) =>
    req('GET', `/reports${patientId ? `?patientId=${patientId}` : ''}`),
  deleteReport: (id: string) => req('DELETE', `/reports/${id}`),
  uploadReport: async (formData: FormData) => {
    const res = await fetch('/api/reports', { method: 'POST', body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
