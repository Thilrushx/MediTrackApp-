import React, { useState } from 'react';
import { Pill, Check, X, Clock, Calendar, MessageSquare, UserCheck, Phone, Mail } from 'lucide-react';
import { Patient, Medication, AdherenceLog, PatientNote, User } from '../types';
import { api } from '../api';

interface Props {
  patient:     Patient | null;
  caregiver:   User | null;
  medications: Medication[];
  logs:        AdherenceLog[];
  notes:       PatientNote[];
  onRefresh:   () => void;
}

export default function PatientPanel({ patient, caregiver, medications, logs, notes, onRefresh }: Props) {
  const [tab, setTab]         = useState<'today' | 'history' | 'notes'>('today');
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Today's doses
  const todayDoses = medications.flatMap(med =>
    med.times.map(time => ({
      med,
      time,
      log: logs.find(l => l.medicationId === med.id && l.scheduledTime === time && l.date === today),
    }))
  ).sort((a, b) => a.time.localeCompare(b.time));

  const takenCount   = logs.filter(l => l.status === 'taken').length;
  const missedCount  = logs.filter(l => l.status === 'missed').length;
  const adherence    = takenCount + missedCount > 0
    ? Math.round((takenCount / (takenCount + missedCount)) * 100) : 100;

  const handleTake = async (medId: string, time: string) => {
    await api.takeDose({ medicationId: medId, scheduledTime: time, date: today });
    onRefresh();
  };

  const handleMiss = async (medId: string, time: string) => {
    await api.missDose({ medicationId: medId, scheduledTime: time, date: today });
    onRefresh();
  };

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteLoading(true);
    await api.createNote({ noteText, date: today });
    setNoteText('');
    setNoteLoading(false);
    onRefresh();
  };

  // Group history by date
  const historyDates = Array.from(new Set(logs.map(l => l.date))).sort().reverse();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10"><Pill className="w-32 h-32 rotate-12" /></div>
        <h2 className="text-xl font-bold">{patient ? `Hello, ${patient.name.split(' ')[0]}!` : 'Patient Portal'}</h2>
        <p className="text-emerald-100 text-xs mt-1">{patient?.condition || 'Managing your health daily'}</p>
        <div className="flex gap-3 mt-4 flex-wrap">
          {[
            { label: 'Adherence', value: `${adherence}%` },
            { label: 'Taken',    value: takenCount },
            { label: 'Missed',   value: missedCount },
            { label: 'Meds',     value: medications.length },
          ].map(s => (
            <div key={s.label} className="bg-white/20 rounded-xl px-3 py-2 text-center">
              <p className="text-sm font-bold">{s.value}</p>
              <p className="text-[10px] text-emerald-100">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Caregiver card */}
      {caregiver && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Your Assigned Caregiver
            </p>
            <p className="font-bold text-slate-800 text-sm">{caregiver.name}</p>
            <div className="flex flex-wrap gap-3 mt-1">
              {caregiver.email && (
                <a href={`mailto:${caregiver.email}`}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 transition">
                  <Mail className="w-3 h-3" />
                  {caregiver.email}
                </a>
              )}
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
            Active
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit">
        {(['today', 'history', 'notes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition ${
              tab === t ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
            }`}>{t === 'today' ? "Today's Doses" : t === 'history' ? 'History' : 'My Notes'}</button>
        ))}
      </div>

      {/* TODAY */}
      {tab === 'today' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayDoses.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
              No medications scheduled for today.
            </div>
          )}
          {todayDoses.map(({ med, time, log }) => {
            const status = log?.status || 'pending';
            return (
              <div key={`${med.id}-${time}`}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition ${
                  status === 'taken' ? 'border-emerald-200 opacity-80' :
                  status === 'missed' ? 'border-rose-200' : 'border-slate-100'
                }`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{med.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">{med.dosage}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {time} · {med.category}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                    status === 'taken' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    status === 'missed' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>{status === 'pending' ? 'Due' : status}</span>
                </div>
                {med.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl mb-3">{med.notes}</p>
                )}
                {status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleMiss(med.id, time)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 border border-rose-100 hover:bg-rose-50 rounded-xl transition">
                      Missed
                    </button>
                    <button onClick={() => handleTake(med.id, time)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition">
                      <Check className="w-3.5 h-3.5" /> Mark Taken
                    </button>
                  </div>
                )}
                {status === 'taken' && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5" /> Taken at {log?.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : time}
                  </p>
                )}
                {status === 'missed' && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <X className="w-3.5 h-3.5" /> Reported missed · Caregiver notified
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* HISTORY */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-800 text-sm">Medication History</span>
          </div>
          <div className="divide-y divide-slate-50">
            {historyDates.map(date => {
              const dayLogs = logs.filter(l => l.date === date);
              const t = dayLogs.filter(l => l.status === 'taken').length;
              const m = dayLogs.filter(l => l.status === 'missed').length;
              return (
                <div key={date} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 font-mono">{date}</span>
                    <div className="flex gap-2 text-[10px]">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">✓ {t} taken</span>
                      {m > 0 && <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-mono">✗ {m} missed</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayLogs.map(l => (
                      <span key={l.id} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        l.status === 'taken' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        l.status === 'missed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>{l.medicationName} {l.scheduledTime}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NOTES */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h4 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" /> Add a Note
            </h4>
            <form onSubmit={submitNote} className="space-y-3">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                rows={3} placeholder="How are you feeling? Any side effects or concerns..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
              <button type="submit" disabled={noteLoading || !noteText.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition">
                {noteLoading ? 'Saving...' : 'Submit Note'}
              </button>
            </form>
          </div>

          {notes.map(n => (
            <div key={n.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{n.date}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  n.riskLevel === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  n.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>Risk: {n.riskLevel || 'Low'}</span>
              </div>
              <p className="text-xs text-slate-700 italic">"{n.noteText}"</p>
              {n.riskAnalysis && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
                  <p><strong>Sentiment:</strong> {n.sentiment}</p>
                  {n.sideEffects && <p><strong>Side Effects:</strong> {n.sideEffects}</p>}
                  <p><strong>Analysis:</strong> {n.riskAnalysis}</p>
                  <p><strong>Recommendations:</strong> {n.recommendations}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
