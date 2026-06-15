export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[]; // e.g. ["08:00", "20:00"]
  category: string; // e.g. "Heart", "Diabetes", "Pain", "Vitamins", "Other"
  startDate: string;
  notes?: string;
  isActive: boolean;
  recipientEmail?: string;
  recipientPhone?: string;
  doctorName?: string;
}

export interface AdherenceLog {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string; // e.g. "08:00"
  date: string; // YYYY-MM-DD
  status: 'taken' | 'missed' | 'pending';
  timestamp?: string; // ISO string when taken
  patientNotes?: string; // Patient notes or feedback
}

export interface EscalationAlert {
  id: string;
  medicationId?: string;
  medicationName: string;
  scheduledTime: string;
  date: string;
  severity: 'medium' | 'high';
  status: 'triggered' | 'notified' | 'resolved';
  notifiedRole: string; // "Caregiver" | "Doctor" | "Emergency"
  message: string;
  timestamp: string;
}

export interface PatientNote {
  id: string;
  date: string;
  noteText: string;
  sentiment?: string; // Positive / Neutral / Negative / Risk
  riskLevel?: 'Low' | 'Medium' | 'High';
  riskAnalysis?: string; // AI generated insights
  sideEffects?: string;
  recommendations?: string;
}

export type UserRole = 'patient' | 'caregiver' | 'doctor';
