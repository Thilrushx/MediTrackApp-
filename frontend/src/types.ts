export type UserRole = 'doctor' | 'caregiver' | 'patient';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  specialty?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition?: string;
  phone?: string;
  email?: string;
  doctorId?: string;
  caregiverId?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  category: string;
  startDate: string;
  notes?: string;
  isActive: boolean;
  prescribedBy?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

export interface AdherenceLog {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  date: string;
  status: 'taken' | 'missed' | 'pending';
  timestamp?: string;
  patientNotes?: string;
}

export interface EscalationAlert {
  id: string;
  medicationId?: string;
  medicationName: string;
  scheduledTime: string;
  date: string;
  severity: 'medium' | 'high';
  status: 'triggered' | 'notified' | 'resolved';
  notifiedRole: string;
  message: string;
  timestamp: string;
}

export interface PatientNote {
  id: string;
  date: string;
  noteText: string;
  sentiment?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  riskAnalysis?: string;
  sideEffects?: string;
  recommendations?: string;
}
