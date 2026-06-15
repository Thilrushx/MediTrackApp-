import React, { useState } from 'react';
import { Check, AlertCircle, Clock, Smile, MessageSquareShare, Pill, Sparkles, Frown } from 'lucide-react';
import { Medication, AdherenceLog } from '../types';

interface PatientMedicationTrayProps {
  medications: Medication[];
  logs: AdherenceLog[];
  onTakeDose: (medicationId: string, scheduledTime: string, notes?: string) => void;
  onMissDose: (medicationId: string, scheduledTime: string) => void;
}

export default function PatientMedicationTray({
  medications,
  logs,
  onTakeDose,
  onMissDose,
}: PatientMedicationTrayProps) {
  const [filterTime, setFilterTime] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [patientNoteInput, setPatientNoteInput] = useState<string>('');
  const [selectedMedForNote, setSelectedMedForNote] = useState<{ medId: string; time: string } | null>(null);
  
  const todayStr = "2026-06-14";

  // Get only medications that are scheduled for today
  const getTodayDoses = () => {
    const list: Array<{ med: Medication; time: string; log?: AdherenceLog }> = [];
    medications.forEach(med => {
      if (!med.isActive) return;
      med.times.forEach(time => {
        // Find existing Log for today
        const log = logs.find(l => l.medicationId === med.id && l.scheduledTime === time && l.date === todayStr);
        list.push({ med, time, log });
      });
    });

    // Filter by selected time window
    return list.filter(({ time }) => {
      if (filterTime === 'all') return true;
      const hour = parseInt(time.split(':')[0]);
      if (filterTime === 'morning') return hour < 12;
      if (filterTime === 'afternoon') return hour >= 12 && hour < 17;
      if (filterTime === 'evening') return hour >= 17;
      return true;
    });
  };

  const todayDoses = getTodayDoses();

  // Sort: pending first, then time
  const sortedDoses = [...todayDoses].sort((a, b) => {
    const statusOrder = { pending: 0, missed: 1, taken: 2 };
    const statusA = a.log?.status || 'pending';
    const statusB = b.log?.status || 'pending';
    
    if (statusOrder[statusA] !== statusOrder[statusB]) {
      return statusOrder[statusA] - statusOrder[statusB];
    }
    return a.time.localeCompare(b.time);
  });

  const handleMarkTaken = (medId: string, time: string) => {
    if (patientNoteInput.trim() && selectedMedForNote?.medId === medId && selectedMedForNote?.time === time) {
      onTakeDose(medId, time, patientNoteInput);
      setPatientNoteInput('');
      setSelectedMedForNote(null);
    } else {
      onTakeDose(medId, time);
    }
  };

  const pendingCount = todayDoses.filter(d => !d.log || d.log.status === 'pending').length;

  return (
    <div id="patient-medication-tray-container" className="space-y-6">
      
      {/* Friendly Welcome & Guidance Cards */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 w-1/3 pointer-events-none">
          <Pill className="w-56 h-56 -mr-12 -mb-12 rotate-45" />
        </div>
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 tracking-wide">
            <Smile className="w-4 h-4 text-emerald-200" /> Active Helper
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">Hello, William!</h2>
          <p className="text-emerald-100 text-sm mt-1.5 leading-relaxed">
            {pendingCount > 0 
              ? `You have ${pendingCount} prescription dose${pendingCount === 1 ? '' : 's'} remaining to check off today. Your health is tracking well!`
              : "Excellent job! You are fully caught up with all scheduled doses for today."
            }
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs font-mono bg-black/15 px-3 py-1.5 rounded-lg border border-white/10">
              Caregiver: Sarah Peterson
            </span>
            <span className="text-xs font-mono bg-black/15 px-3 py-1.5 rounded-lg border border-white/10">
              Assigned Clinician: Dr. Evans
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-xs">
        <span className="text-xs font-semibold text-slate-500 pl-3">Filter by Time of Day</span>
        <div className="flex space-x-1">
          {(['all', 'morning', 'afternoon', 'evening'] as const).map((block) => (
            <button
              id={`filter-pill-${block}`}
              key={block}
              onClick={() => setFilterTime(block)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all duration-200 ${
                filterTime === block
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {block}
            </button>
          ))}
        </div>
      </div>

      {/* Pill Checklist Cards */}
      <div id="pills-checklists-wrapper" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedDoses.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-150 p-6">
            <Pill className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-700">No Medications Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are no active medications found in the scheduling database matching this specific timeframe.
            </p>
          </div>
        ) : (
          sortedDoses.map(({ med, time, log }) => {
            const status = log?.status || 'pending';
            const isNoteSelected = selectedMedForNote?.medId === med.id && selectedMedForNote?.time === time;

            return (
              <div 
                key={`${med.id}-${time}`}
                className={`relative bg-white rounded-3xl border p-5 md:p-6 transition-all duration-200 ${
                  status === 'taken'
                    ? 'border-emerald-200 bg-emerald-50/10 opacity-75'
                    : status === 'missed'
                    ? 'border-rose-200 bg-rose-50/10'
                    : 'border-slate-150 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Header info */}
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-lg text-slate-800">{med.name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                        {med.dosage}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Scheduled: <strong className="text-slate-800">{time}</strong>
                    </span>
                  </div>

                  {/* Status Indicator Badge */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold capitalize ${
                    status === 'taken'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : status === 'missed'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {status === 'taken' ? 'Taken' : status === 'missed' ? 'Overdue' : 'Due Now'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-800 block text-[10px] uppercase font-mono tracking-wider mb-0.5">Instructions:</span>
                  {med.notes || "Check regular clinical requirements."}
                </p>

                {/* Patient Feedback Note attachment toggler */}
                {status === 'pending' && (
                  <div className="mt-4">
                    {isNoteSelected ? (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-fadeIn">
                        <label className="block text-[11px] font-semibold text-slate-500">
                          Attach a note about how you feel taking this medication:
                        </label>
                        <textarea
                          placeholder="e.g. Taking with lunch, feeling slightly dizzy today, or feeling great!"
                          value={patientNoteInput}
                          onChange={(e) => setPatientNoteInput(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800"
                          rows={2}
                        />
                        <div className="flex justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedMedForNote(null)}
                            className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleMarkTaken(med.id, time)}
                            className="bg-emerald-600 text-white font-medium px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 transition"
                          >
                            Save & Mark Taken
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedMedForNote({ medId: med.id, time })}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-700 transition-colors text-xs py-1"
                      >
                        <MessageSquareShare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Add symptom/feeling note first...</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Actions Block */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                  {status === 'pending' ? (
                    <>
                      <button
                        onClick={() => onMissDose(med.id, time)}
                        className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-100"
                      >
                        Report Missed
                      </button>
                      
                      {!isNoteSelected && (
                        <button
                          onClick={() => handleMarkTaken(med.id, time)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-2xl transition shadow-sm shadow-emerald-100"
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark Taken</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                      {status === 'taken' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Complete: {log?.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00'}</span>
                          {log?.patientNotes && (
                            <span className="text-slate-400 italic block mt-0.5">Note: "{log.patientNotes}"</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          <span>Reported overdue. Caregiver was alerted.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
