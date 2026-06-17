import React, { useState } from 'react';
import { Users, Pill, Bell, ChevronRight, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';
import { Patient, Medication, AdherenceLog, EscalationAlert } from '../types';
import { api } from '../api';

interface Props {
  patients: Patient[];
  medications: Medication[];
  logs: AdherenceLog[];
  alerts: EscalationAlert[];
  caregiverId: string;
  onRefresh: () => void;
}

export default function CaregiverPanel({ patients, medications, logs, alerts, caregiverId, onRefresh }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(patients[0]?.id || null);

  const selected  = patients.find(p => p.id === selectedId);
  const patMeds   = medications.filter(m => m.patientId === selectedId);
  const patLogs   = logs.filter(l => patMeds.some(m => m.id === l.medicationId));
  const patAlerts = alerts.filter(a => patMeds.some(m => m.id === a.medicationId) && a.status === 'notified');

  const today      = new Date().toISOString().split('T')[0];
  const todayLogs  = patLogs.filter(l => l.date === today);
  const takenToday = todayLogs.filter(l => l.status === 'taken').length;
  const totalToday = todayLogs.length;

  const overallTaken  = patLogs.filter(l => l.status === 'taken').length;
  const overallMissed = patLogs.filter(l => l.status === 'missed').length;
  const adherence     = overallTaken + overallMissed > 0
    ? Math.round((overallTaken / (overallTaken + overallMissed)) * 100) : 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* Patient list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-purple-500" /> My Patients
        </h3>
        {patients.length === 0 && (
          <p className="text-xs text-slate-400 py-4 text-center">No patients assigned yet.</p>
        )}
        {patients.map(p => {
          const pAlerts = alerts.filter(a => medications.filter(m => m.patientId === p.id).some(m => m.id === a.medicationId) && a.status === 'notified');
          return (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between ${
                selectedId === p.id ? 'border-purple-300 bg-purple-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-300'
              }`}>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                <p className="text-xs text-slate-500">{p.age} yrs · {p.condition || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                {pAlerts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                <ChevronRight className={`w-4 h-4 text-slate-400 transition ${selectedId === p.id ? 'text-purple-500' : ''}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Patient detail */}
      <div className="md:col-span-2 space-y-4">
        {!selected ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
            Select a patient to view details.
          </div>
        ) : (
          <>
            {/* Patient header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-5">
              <h2 className="text-lg font-bold">{selected.name}</h2>
              <p className="text-xs text-purple-100 mt-0.5">{selected.age} yrs · {selected.gender} · {selected.condition || 'No condition noted'}</p>
              <div className="flex gap-3 mt-3">
                {[
                  { label: 'Adherence', value: `${adherence}%` },
                  { label: `Today (${takenToday}/${totalToday})`, value: totalToday > 0 ? `${Math.round((takenToday/totalToday)*100)}%` : 'N/A' },
                  { label: 'Active Alerts', value: patAlerts.length },
                ].map(s => (
                  <div key={s.label} className="bg-white/20 rounded-xl px-3 py-2 text-center">
                    <p className="text-sm font-bold">{s.value}</p>
                    <p className="text-[10px] text-purple-100">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            {patAlerts.length > 0 && (
              <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4 space-y-2">
                <h4 className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Missed Dose Alerts
                </h4>
                {patAlerts.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-rose-100">
                    <p className="text-rose-800">{a.message}</p>
                    <button onClick={async () => { await api.resolveAlert(a.id); onRefresh(); }}
                      className="shrink-0 px-2.5 py-1 bg-rose-600 text-white rounded-lg font-semibold text-[10px] hover:bg-rose-700">
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}

            {patAlerts.length === 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-2.5 text-xs">
                <ShieldCheck className="w-4 h-4" /> All doses on track. No active alerts.
              </div>
            )}

            {/* Medications */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-50 flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-slate-800 text-sm">Prescribed Medications</span>
                <span className="ml-auto text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{patMeds.length}</span>
              </div>
              {patMeds.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No medications prescribed yet.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {patMeds.map(m => {
                    const todayMedLogs = patLogs.filter(l => l.medicationId === m.id && l.date === today);
                    return (
                      <div key={m.id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{m.name}
                            <span className="ml-2 text-xs font-normal text-slate-500">{m.dosage}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{m.frequency} · {m.notes || ''}</p>
                          <div className="flex gap-1 mt-1.5">
                            {m.times.map(t => (
                              <span key={t} className="inline-flex items-center gap-0.5 text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded">
                                <Clock className="w-2.5 h-2.5" />{t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {todayMedLogs.map(l => (
                            <span key={l.id} className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                              l.status === 'taken' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              l.status === 'missed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{l.scheduledTime} · {l.status}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent adherence logs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-50">
                <span className="font-semibold text-slate-800 text-sm">Recent Adherence History</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
                {patLogs.slice(-20).reverse().map(l => (
                  <div key={l.id} className="px-5 py-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{l.medicationName} <span className="text-slate-400">{l.dosage}</span></span>
                    <span className="font-mono text-slate-400">{l.date} {l.scheduledTime}</span>
                    <span className={`px-2 py-0.5 rounded-full font-mono font-semibold ${
                      l.status === 'taken' ? 'bg-emerald-50 text-emerald-700' :
                      l.status === 'missed' ? 'bg-rose-50 text-rose-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{l.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
