import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldAlert, Bell } from 'lucide-react';
import { UserRole, Patient, Medication, AdherenceLog, EscalationAlert, PatientNote, User } from './types';
import { api } from './api';
import Navigation from './components/Navigation';
import DoctorPanel from './components/DoctorPanel';
import CaregiverPanel from './components/CaregiverPanel';
import PatientPanel from './components/PatientPanel';

// Demo active session IDs (replace with auth session in production)
const SESSION = {
  doctor:    'usr-doc-1',
  caregiver: 'usr-cgv-1',
  patient:   'pat-1',
};

export default function App() {
  const [role, setRole]   = useState<UserRole>('doctor');
  const [loading, setLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(false);

  // Global data state
  const [users,       setUsers]       = useState<User[]>([]);
  const [patients,    setPatients]    = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs,        setLogs]        = useState<AdherenceLog[]>([]);
  const [alerts,      setAlerts]      = useState<EscalationAlert[]>([]);
  const [notes,       setNotes]       = useState<PatientNote[]>([]);

  const fetchAll = useCallback(async () => {
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
    } catch (e) {
      console.error('API fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const caregivers   = users.filter(u => u.role === 'caregiver');
  const activeAlerts = alerts.filter(a => a.status === 'notified');

  // Derive scoped data per role
  const doctorId    = SESSION.doctor;
  const caregiverId = SESSION.caregiver;
  const patientId   = SESSION.patient;

  const doctorPatients    = patients.filter(p => p.doctorId === doctorId);
  const caregiverPatients = patients.filter(p => p.caregiverId === caregiverId);
  const currentPatient    = patients.find(p => p.id === patientId) || null;
  const patientMeds       = medications.filter(m => m.patientId === patientId);
  const patientLogs       = logs.filter(l => patientMeds.some(m => m.id === l.medicationId));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navigation
        currentRole={role}
        onRoleChange={setRole}
        alertCount={activeAlerts.length}
        onOpenAlerts={() => setShowAlerts(true)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
            <span className="text-sm font-mono">Connecting to MediTrack API...</span>
          </div>
        ) : (
          <>
            {/* Role workspace label */}
            <div className="mb-6">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Active Workspace</p>
              <h1 className="text-2xl font-bold text-slate-900 capitalize">{role} Portal</h1>
            </div>

            {role === 'doctor' && (
              <DoctorPanel
                patients={doctorPatients}
                medications={medications}
                logs={logs}
                alerts={alerts}
                caregivers={caregivers}
                doctorId={doctorId}
                onRefresh={fetchAll}
              />
            )}

            {role === 'caregiver' && (
              <CaregiverPanel
                patients={caregiverPatients}
                medications={medications}
                logs={logs}
                alerts={alerts}
                caregiverId={caregiverId}
                onRefresh={fetchAll}
              />
            )}

            {role === 'patient' && (
              <PatientPanel
                patient={currentPatient}
                medications={patientMeds}
                logs={patientLogs}
                notes={notes}
                onRefresh={fetchAll}
              />
            )}
          </>
        )}
      </main>

      {/* Global alerts overlay */}
      {showAlerts && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-slate-800">Escalation Alerts</h3>
              </div>
              <button onClick={() => setShowAlerts(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">✕</button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {activeAlerts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No active alerts.</p>
              ) : (
                activeAlerts.map(a => (
                  <div key={a.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px] text-rose-600 font-semibold">
                      <span>{a.medicationName} Missed</span>
                      <span>{a.date} {a.scheduledTime}</span>
                    </div>
                    <p className="text-rose-800 leading-snug">{a.message}</p>
                    <button onClick={async () => { await api.resolveAlert(a.id); fetchAll(); }}
                      className="text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded-lg transition">
                      Resolve
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-50">
              <button onClick={() => setShowAlerts(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-100 py-5 text-center text-[11px] text-slate-400 font-mono">
        <p>© 2026 MediTrack Cloud System · B.G.T.D. Wijerathne · SEU/IS/20/ICT/055</p>
        <p className="text-slate-300 mt-0.5">Azure SQL · Express.js REST API · React + Vite · MySQL Sequelize ORM</p>
      </footer>
    </div>
  );
}
