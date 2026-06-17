import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Patient, Medication, AdherenceLog, EscalationAlert, PatientNote } from './types';
import { api } from './api';

export const SESSION = {
  doctor:    'usr-doc-1',
  caregiver: 'usr-cgv-1',
  patient:   'pat-1',
};

interface DataCtx {
  loading:     boolean;
  error:       string | null;
  users:       User[];
  patients:    Patient[];
  medications: Medication[];
  logs:        AdherenceLog[];
  alerts:      EscalationAlert[];
  notes:       PatientNote[];
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
  fetchAll:    () => {},
});

export const useData = () => useContext(Ctx);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [users,       setUsers]       = useState<User[]>([]);
  const [patients,    setPatients]    = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs,        setLogs]        = useState<AdherenceLog[]>([]);
  const [alerts,      setAlerts]      = useState<EscalationAlert[]>([]);
  const [notes,       setNotes]       = useState<PatientNote[]>([]);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [u, p, m, l, a, n] = await Promise.all([
        api.getUsers(),
        api.getPatients(),
        api.getMedications(),
        api.getLogs(),
        api.getAlerts(),
        api.getNotes(),
      ]);
      setUsers(u);
      setPatients(p);
      setMedications(m);
      setLogs(l);
      setAlerts(a);
      setNotes(n);
    } catch (e: any) {
      console.error('API fetch failed:', e);
      setError('Cannot connect to MediTrack API. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <Ctx.Provider value={{ loading, error, users, patients, medications, logs, alerts, notes, fetchAll }}>
      {children}
    </Ctx.Provider>
  );
}
