import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, Activity, Pill, 
  Sparkles, CheckCircle2, User, Volume2, ShieldAlert, AlertCircle, RefreshCw 
} from 'lucide-react';
import { Medication, AdherenceLog, EscalationAlert, PatientNote, UserRole } from './types';
import Navigation from './components/Navigation';
import AdherenceCharts from './components/AdherenceCharts';
import PatientMedicationTray from './components/PatientMedicationTray';
import CaregiverPanel from './components/CaregiverPanel';
import DoctorClinicalInsights from './components/DoctorClinicalInsights';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('patient');
  
  // Data State managed full-stack
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
  const [escalationAlerts, setEscalationAlerts] = useState<EscalationAlert[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showNotificationAlerts, setShowNotificationAlerts] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  
  const fetchAllData = async () => {
    try {
      const [medsRes, logsRes, alertsRes, notesRes] = await Promise.all([
        fetch('/api/medications'),
        fetch('/api/adherence'),
        fetch('/api/alerts'),
        fetch('/api/patient-notes')
      ]);

      if (medsRes.ok) setMedications(await medsRes.json());
      if (logsRes.ok) setAdherenceLogs(await logsRes.json());
      if (alertsRes.ok) setEscalationAlerts(await alertsRes.json());
      if (notesRes.ok) setPatientNotes(await notesRes.json());
    } catch (e) {
      console.error("Failed to sync clinical database from Express API backend:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Web Audio Synthesizer: synthesized harmonically (no assets required!)
  const playSoundEffect = (type: 'success' | 'alert' | 'resolve') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'success') {
        // High, upbeat double harmonic chime (C5 -> G5)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'resolve') {
        // Comforting, flat note beep (E4 -> A4)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc.frequency.setValueAtTime(440.00, ctx.currentTime + 0.1); // A4
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Unsettling, dual-frequency descending warning beep (C4 -> F#3)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
        osc.frequency.linearRampToValueAtTime(185.00, ctx.currentTime + 0.25); // F#3 (tritone dissonance)
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio Context blocked by browser interaction restrictions", e);
    }
  };

  // Action: Take a dose today
  const handleTakeDose = async (medicationId: string, scheduledTime: string, notes?: string) => {
    try {
      const response = await fetch('/api/adherence/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationId,
          scheduledTime,
          date: '2026-06-14', // Core current calendar date
          patientNotes: notes
        })
      });

      if (response.ok) {
        playSoundEffect('success');
        await fetchAllData();
      }
    } catch (err) {
      console.error("Adherence take action failed:", err);
    }
  };

  // Action: report missed dose
  const handleMissDose = async (medicationId: string, scheduledTime: string) => {
    try {
      const response = await fetch('/api/adherence/miss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationId,
          scheduledTime,
          date: '2026-06-14'
        })
      });

      if (response.ok) {
        playSoundEffect('alert');
        await fetchAllData();
      }
    } catch (err) {
      console.error("Adherence miss action failed:", err);
    }
  };

  // Action: Resolve active escalation alert
  const handleResolveAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/alerts/resolve/${id}`, {
        method: 'POST'
      });

      if (response.ok) {
        playSoundEffect('resolve');
        await fetchAllData();
      }
    } catch (err) {
      console.error("Resolve alert failed:", err);
    }
  };

  // Action: Prescription Addition
  const handleAddMedication = async (medData: Omit<Medication, 'id' | 'isActive'>) => {
    try {
      const response = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medData)
      });

      if (response.ok) {
        playSoundEffect('resolve');
        await fetchAllData();
      }
    } catch (err) {
      console.error("Add medication failed:", err);
    }
  };

  // Action: Cancellation of Prescription
  const handleDeleteMedication = async (id: string) => {
    try {
      const response = await fetch(`/api/medications/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Delete medication failed:", err);
    }
  };

  // Action: Insert and analyze customized note transcripts with Gemini
  const handleAddAndAnalyzeNote = async (text: string, date: string) => {
    const response = await fetch('/api/patient-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteText: text, date })
    });

    if (!response.ok) {
      throw new Error("API analysis request rejected");
    }

    await fetchAllData();
  };

  // Action: Simulate a sudden, unexpected dosage miss to verify real-time alerts
  const handleSimulateOutage = async () => {
    // Select an active prescription to simulate a miss
    const targetMed = medications.find(m => m.name === "Metformin") || medications[0];
    if (targetMed) {
      await handleMissDose(targetMed.id, "12:00");
    }
  };

  const activeAlerts = escalationAlerts.filter(a => a.status === 'notified');

  return (
    <div id="meditrack-app-shell" className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      
      {/* 1. Header Navigation and perspective picker */}
      <Navigation 
        currentRole={currentRole} 
        onRoleChange={(role) => setCurrentRole(role)}
        alertCount={activeAlerts.length}
        onOpenAlerts={() => setShowNotificationAlerts(true)}
      />

      {/* 2. Main content container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8 space-y-8">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono text-xs">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-3" />
            <span>Connecting to MediTrack Secure Cloud Databases...</span>
          </div>
        ) : (
          <>
            {/* Top-level adherence dashboard, viewable across roles for clinical context */}
            <AdherenceCharts medications={medications} logs={adherenceLogs} />

            {/* Core Role Portal router */}
            <div id="role-workspace-wrapper" className="mt-6 border-t border-slate-100 pt-6">
              
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                    Active Environment perspective
                  </span>
                  <h2 className="font-display font-bold text-xl text-slate-900 capitalize">
                    {currentRole} Workspace
                  </h2>
                </div>

                {/* Sound toggler */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                    soundEnabled 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                  title={soundEnabled ? "Clinician alarm audio active" : "Alarms muted"}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{soundEnabled ? "Audio Active" : "Muted"}</span>
                </button>
              </div>

              {/* Patient View */}
              {currentRole === 'patient' && (
                <PatientMedicationTray 
                  medications={medications}
                  logs={adherenceLogs}
                  onTakeDose={handleTakeDose}
                  onMissDose={handleMissDose}
                />
              )}

              {/* Caregiver View */}
              {currentRole === 'caregiver' && (
                <CaregiverPanel 
                  medications={medications}
                  logs={adherenceLogs}
                  alerts={escalationAlerts}
                  onAddMedication={handleAddMedication}
                  onDeleteMedication={handleDeleteMedication}
                  onResolveAlert={handleResolveAlert}
                  onSimulateMissedDoseEscalation={handleSimulateOutage}
                />
              )}

              {/* Doctor/Clinic View */}
              {currentRole === 'doctor' && (
                <DoctorClinicalInsights 
                  notes={patientNotes}
                  onAddAndAnalyzeNote={handleAddAndAnalyzeNote}
                />
              )}

            </div>
          </>
        )}

      </main>

      {/* 3. Global Notification overlay for Active Escalations */}
      {showNotificationAlerts && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-bounce" />
              <h3 className="font-display font-semibold text-slate-800">Escalation Notification Log</h3>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {activeAlerts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No active family or doctor escalations flagged currently.</p>
              ) : (
                activeAlerts.map(alert => (
                  <div key={alert.id} className="p-3 bg-rose-50 text-rose-900 rounded-xl border border-rose-100 text-xs space-y-1">
                    <div className="flex justify-between items-center font-mono text-[10px] font-semibold text-rose-700">
                      <span>{alert.medicationName} Missed</span>
                      <span>{alert.date} {alert.scheduledTime}</span>
                    </div>
                    <p className="text-[11px] leading-snug">{alert.message}</p>
                    <button 
                      onClick={() => handleResolveAlert(alert.id)}
                      className="mt-2 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded transition"
                    >
                      Clear & Resolve
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-50">
              <button 
                onClick={() => setShowNotificationAlerts(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Close list
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Footer credits with Azure specifications mapped */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-[11px] text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-1">
          <p style={{ color: 'black' }}>© 2026 MediTrack Cloud System. Designed & Completed for Cloud Application Development.</p>
          <p className="text-slate-300" style={{ color: 'black' }}>
            Student: B.G.T.D. Wijerathne | Reg: SEU/IS/20/ICT/055 | Specialization: Software Technologies
          </p>
          <div className="flex justify-center items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 text-[9px]">
              Azure SQL Alternate: Express In-Memory Stack
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 text-[9px]">
             AI- Powerde
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 text-[9px]">
              Notification Hub: Real-time Client Alerts
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
