// ── Auth types ────────────────────────────────────────────────────────────────
export type UserRole = 'doctor' | 'caregiver' | 'patient';

export interface AuthUser {
  id:        string;
  email:     string;
  name:      string;
  role:      UserRole;
  specialty: string | null;
  /** Only present for patient accounts — the linked Patient record id */
  patientId: string | null;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface AuthState {
  token:           string | null;
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
}

// ── Domain types ──────────────────────────────────────────────────────────────
export interface User {
  id:        string;
  name:      string;
  role:      UserRole;
  email?:    string;
  specialty?: string;
  isActive?: boolean;
}

export interface Patient {
  id:          string;
  name:        string;
  age:         number;
  gender:      'Male' | 'Female' | 'Other';
  condition?:  string;
  phone?:      string;
  email?:      string;
  doctorId?:   string;
  caregiverId?: string;
  userId?:     string;
}

export interface Medication {
  id:              string;
  patientId:       string;
  name:            string;
  dosage:          string;
  frequency:       string;
  times:           string[];
  category:        string;
  startDate:       string;
  notes?:          string;
  isActive:        boolean;
  prescribedBy?:   string;
  recipientEmail?: string;
  recipientPhone?: string;
}

export interface AdherenceLog {
  id:             string;
  medicationId:   string;
  medicationName: string;
  dosage:         string;
  scheduledTime:  string;
  date:           string;
  status:         'taken' | 'missed' | 'pending';
  timestamp?:     string;
  patientNotes?:  string;
}

export interface EscalationAlert {
  id:            string;
  medicationId?: string;
  medicationName: string;
  scheduledTime: string;
  date:          string;
  severity:      'medium' | 'high';
  status:        'triggered' | 'notified' | 'resolved';
  notifiedRole:  string;
  message:       string;
  timestamp:     string;
}

export interface PatientNote {
  id:               string;
  date:             string;
  noteText:         string;
  sentiment?:       string;
  riskLevel?:       'Low' | 'Medium' | 'High';
  riskAnalysis?:    string;
  sideEffects?:     string;
  recommendations?: string;
}

export interface MedicalReport {
  id:           string;
  patientId:    string;
  name:         string;
  category:     'Lab Result' | 'Prescription' | 'Imaging' | 'Discharge Summary' | 'Other';
  filename:     string;
  originalName: string;
  uploadedBy:   string;
  uploadedAt:   string;
}

// ── Form types (used in DoctorPanel for creating accounts) ───────────────────
export interface CreateCaregiverForm {
  name:      string;
  email:     string;
  password:  string;
  specialty?: string;
}

export interface CreatePatientForm {
  name:        string;
  email:       string;
  password:    string;
  age:         number;
  gender:      'Male' | 'Female' | 'Other';
  condition?:  string;
  phone?:      string;
  caregiverId?: string;
}
