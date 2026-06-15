import React, { useState } from 'react';
import { 
  Plus, AlertTriangle, CheckCircle2, Trash, Mail, Phone, Calendar, 
  Clock, ShieldCheck, RefreshCw, Sparkles, User, BellRing 
} from 'lucide-react';
import { Medication, AdherenceLog, EscalationAlert } from '../types';

interface CaregiverPanelProps {
  medications: Medication[];
  logs: AdherenceLog[];
  alerts: EscalationAlert[];
  onAddMedication: (med: Omit<Medication, 'id' | 'isActive'>) => void;
  onDeleteMedication: (id: string) => void;
  onResolveAlert: (id: string) => void;
  onSimulateMissedDoseEscalation: () => void;
}

export default function CaregiverPanel({
  medications,
  logs,
  alerts,
  onAddMedication,
  onDeleteMedication,
  onResolveAlert,
  onSimulateMissedDoseEscalation,
}: CaregiverPanelProps) {
  // Modal toggle state
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Medication Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [category, setCategory] = useState('Diabetes');
  const [timesInput, setTimesInput] = useState('08:00');
  const [notes, setNotes] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('sarah.care@example.com');
  const [recipientPhone, setRecipientPhone] = useState('+1 (555) 019-9281');
  const [doctorName, setDoctorName] = useState('Dr. Evans');

  const [formError, setFormError] = useState('');

  const activeAlerts = alerts.filter(a => a.status === 'notified');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || !timesInput) {
      setFormError('Drug name, dosage and scheduled time are required.');
      return;
    }

    const timesArray = timesInput.split(',').map(t => t.trim());
    const validTimePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    
    for (let t of timesArray) {
      if (!validTimePattern.test(t)) {
        setFormError(`Invalid time format for "${t}". Please use HH:MM format like 08:00.`);
        return;
      }
    }

    onAddMedication({
      name,
      dosage,
      frequency,
      times: timesArray,
      category,
      startDate: new Date().toISOString().split('T')[0],
      notes,
      recipientEmail,
      recipientPhone,
      doctorName
    });

    // Reset Form
    setName('');
    setDosage('');
    setFrequency('Daily');
    setCategory('Diabetes');
    setTimesInput('08:00');
    setNotes('');
    setShowAddModal(false);
    setFormError('');
  };

  return (
    <div id="caregiver-panel-container" className="space-y-6">
      
      {/* 1. Alerts & Escalations Header Card */}
      <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs">
        <div className="md:flex items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-4">
          <div className="space-y-1">
            <h2 className="font-display font-medium text-lg text-slate-800 flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              Security & Escalation Monitors
            </h2>
            <p className="text-xs text-slate-500">
              Trigger alerts conceptualized through automatic SMS & Emails on missed schedule margins.
            </p>
          </div>

          <div className="flex gap-2 mt-3 md:mt-0">
            {/* Quick action to trigger simulation testing */}
            <button
              onClick={onSimulateMissedDoseEscalation}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-150 flex items-center gap-1"
            >
              <BellRing className="w-3.5 h-3.5 animate-bounce" />
              Simulate Missed Dose Outage
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm shadow-purple-200"
            >
              <Plus className="w-4 h-4" />
              Prescribe Medication
            </button>
          </div>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="flex items-center gap-3 bg-amber-50/50 text-amber-900 px-4 py-3 border border-amber-100 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <p className="text-xs">
              <strong>All systems secure:</strong> There are currently no active unresolved misses. Caregiver monitors list no emergencies.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map(alert => (
              <div 
                key={alert.id}
                className="bg-rose-50 text-rose-900 border border-rose-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-pulse-slow"
              >
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold font-mono">
                      [ALERT STATUS: ESCALATED TO FAMILY] Date: {alert.date} {alert.scheduledTime}
                    </p>
                    <p className="text-xs text-rose-800 leading-relaxed max-w-2xl">{alert.message}</p>
                    <span className="text-[10px] text-rose-500 font-mono block">
                      Triggered: {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => onResolveAlert(alert.id)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs self-start md:self-auto shrink-0"
                >
                  Resolve Alert & Clear Alert
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Active Medications Table Controls */}
      <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">Active Schedules Database</h3>
            <p className="text-xs text-slate-500">Edit, review or audit active clinical dosages for William</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-mono">
            {medications.length} Prescriptions Running
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold font-mono border-b border-slate-100 uppercase tracking-wider">
                <th className="p-3">Drug & Category</th>
                <th className="p-3">Dosage & Frequency</th>
                <th className="p-3">Scheduled Times</th>
                <th className="p-3">Assigned Physician</th>
                <th className="p-3">Caregiver Backstop</th>
                <th className="p-3 text-right">Emergency Purge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {medications.map(med => (
                <tr key={med.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-3">
                    <div className="font-semibold text-slate-800 text-sm flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {med.name}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-100 font-medium text-slate-500 border border-slate-200 mt-1 uppercase font-mono">
                      {med.category}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-700">{med.dosage}</div>
                    <span className="text-slate-400 text-[10px]">{med.frequency}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {med.times.map(t => (
                        <span key={t} className="inline-flex items-center bg-teal-50 text-teal-800 border border-teal-150 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                          <Clock className="w-2.5 h-2.5 mr-1" /> {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 font-sans">{med.doctorName || "Not assigned"}</td>
                  <td className="p-3 text-slate-600 space-y-0.5 font-mono text-[10px]">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{med.recipientPhone || "None"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Mail className="w-3 h-3" />
                      <span>{med.recipientEmail || "None"}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => onDeleteMedication(med.id)}
                      className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition"
                      title="Delete prescription"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medication Modal Dialog code */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-5 text-white">
              <h3 className="font-display font-semibold text-lg">Prescribe New Medication</h3>
              <p className="text-xs text-purple-100">Establish a new dosage timeline for Patient William.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-150 font-semibold">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">Drug name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Metformin" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">Dosage density</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 500mg, 1 tablet" 
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">Frequencies</label>
                  <select 
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-800"
                  >
                    <option>Daily</option>
                    <option>Twice daily</option>
                    <option>Weekly</option>
                    <option>As needed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">Category Tag</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-800"
                  >
                    <option>Diabetes</option>
                    <option>Heart & Pressure</option>
                    <option>Cholesterol</option>
                    <option>Vitamins</option>
                    <option>Pain Relief</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">
                  Scheduled Dosing Time (HH:MM style, comma separated for multiple times)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 08:00, 20:00" 
                  value={timesInput}
                  onChange={(e) => setTimesInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800 font-mono"
                />
              </div>

              <div className="space-y-1 animate-fadeIn bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                <span className="block text-[10px] uppercase font-mono font-bold text-indigo-700 tracking-wider">
                  Conceptual Notification Hub Settings
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-[9px] font-semibold text-slate-500">Caregiver Phone (SMS Alerts)</span>
                    <input 
                      type="text" 
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full text-[11px] p-2 bg-white border border-slate-100 rounded-md text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-slate-500">Caregiver Email</span>
                    <input 
                      type="text" 
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full text-[11px] p-2 bg-white border border-slate-100 rounded-md text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1">
                <label className="block text-xs font-semibold text-slate-600">Overseeing Clinician / General Practitioner</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dr. Evans" 
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl Focus:ring-1 focus:ring-purple-600 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">Dosage Clinical Notes (Instructions)</label>
                <textarea 
                  placeholder="e.g. Must take on full stomach with lukewarm water." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-slate-800"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-50 text-xs font-bold">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-slate-50 rounded-xl transition text-slate-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition"
                >
                  Prescribe Dosage & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
