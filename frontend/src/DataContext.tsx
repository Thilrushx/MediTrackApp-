import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User, Patient, Medication, AdherenceLog,
  EscalationAlert, PatientNote, MedicalReport,
} from './types';
import { api } from './api';
import { useAuth } from './AuthContext';

interface DataCtx {
  loading:     boolean;
  error:       string | null;
  users:       User[];
  patients:    Patient[];
  medications: Medication[];
  logs:        AdherenceLog[];
  alerts:      EscalationAlert[];
  notes:       PatientNote[];
  reports:     MedicalReport[];
  fetchAll:    () => void;
}

const Ctx = createContext<DataCtx>({
  loading:     true,
  error:       null,
  users:       [],
  patients:    [],
  medications: [],
  logs:        [],
  alerts:      [],
  notes:       [],
  reports:     [],
  fetchAll:    () => {},
});

export const useData = () => useContext(Ctx);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [users,       setUsers]       = useState<User[]>([]);
  const [patients,    setPatients]    = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs,        setLogs]        = useState<AdherenceLog[]>([]);
  const [alerts,      setAlerts]      = useState<EscalationAlert[]>([]);
  const [notes,       setNotes]       = useState<PatientNote[]>([]);
  const [reports,     setReports]     = useState<MedicalReport[]>([]);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(null);
    setLoading(true);
    try {
      const [u, p, m, l, a, n, r] = await Promise.all([
        api.getUsers(),
        api.getPatients(),
        api.getMedications(),
        api.getLogs(),
        api.getAlerts(),
        api.getNotes(),
        api.getReports(),
      ]);
      setUsers(u);
      setPatients(p);
      setMedications(m);
      setLogs(l);
      setAlerts(a);
      setNotes(n);
      setReports(r);
    } catch (e: any) {
      console.error('API fetch failed:', e);
      setError('Cannot connect to MediTrack API. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch data once auth is resolved and user is authenticated
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchAll();
      } else {
        // Clear all data on logout
        setUsers([]);
        setPatients([]);
        setMedications([]);
        setLogs([]);
        setAlerts([]);
        setNotes([]);
        setReports([]);
        setLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, fetchAll]);

  return (
    <Ctx.Provider value={{
      loading, error, users, patients, medications,
      logs, alerts, notes, reports, fetchAll,
    }}>
      {children}
    </Ctx.Provider>
  );
}
