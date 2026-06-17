import React, { useState } from 'react';
import {
  Users, Trash2, Edit3, Pill, X, Check,
  ClipboardList, UserPlus, HeartPulse, AlertTriangle, Plus,
} from 'lucide-react';
import { Patient, Medication, AdherenceLog, EscalationAlert, User } from '../types';
import { api } from '../api';

interface Props {
  patients: Patient[];
  medications: Medication[];
  logs: AdherenceLog[];
  alerts: EscalationAlert[];
  caregivers: User[];
  doctorId: string;
  onRefresh: () => void;
}

const EMPTY_PATIENT = { name: '', age: '', gender: 'Male', condition: '', phone: '', email: '', caregiverId: '' };
const EMPTY_MED     = { name: '', dosage: '', frequency: 'Daily', times: '08:00', category: 'Diabetes', notes: '', startDate: '' };

export default function DoctorPanel({ patients, medications, logs, alerts, caregivers, doctorId, onRefresh }: Props) {
  const [tab, setTab] = useState<'dashboard' | 'patients'>('dashboard');

  // Patient modal
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatient, setEditingPatient]     = useState<Patient | null>(null);
  const [patientForm, setPatientForm]           = useState<any>(EMPTY_PATIENT);
  const [patientError, setPatientError]         = useState('');

  // Prescribe modal — bound to a specific patient
  const [prescribeFor, setPrescribeFor] = useState<Patient | null>(null);
  const [medForm, setMedForm]           = useState<any>(EMPTY_MED);
  const [medError, setMedError]         = useState('');

  // Expanded patient card
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const takenLogs    = logs.filter(l => l.status === 'taken').length;
  const missedLogs   = logs.filter(l => l.status === 'missed').length;
  const activeAlerts = alerts.filter(a => a.status === 'notified').length;
  const adherence    = takenLogs + missedLogs > 0
    ? Math.round((takenLogs / (takenLogs + missedLogs)) * 100) : 100;

  const patientMeds = (id: string) => medications.filter(m => m.patientId === id);

  // ── Patient CRUD ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingPatient(null);
    setPatientForm(EMPTY_PATIENT);
    setPatientError('');
    setShowPatientModal(true);
  };

  const openEdit = (p: Patient) => {
    setEditingPatient(p);
    setPatientForm({ name: p.name, age: p.age, gender: p.gender, condition: p.condition || '', phone: p.phone || '', email: p.email || '', caregiverId: p.caregiverId || '' });
    setPatientError('');
    setShowPatientModal(true);
  };

  const submitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError('');
    try {
      if (editingPatient) {
        await api.updatePatient(editingPatient.id, {
          name: patientForm.name, age: Number(patientForm.age),
          gender: patientForm.gender, condition: patientForm.condition,
          phone: patientForm.phone, email: patientForm.email,
          caregiverId: patientForm.caregiverId,
        });
      } else {
        await api.createPatient({ ...patientForm, age: Number(patientForm.age), doctorId });
      }
      setShowPatientModal(false);
      onRefresh();
    } catch { setPatientError('Failed to save patient. Please try again.'); }
  };

  const deletePatient = async (id: string) => {
    if (!confirm('Delete this patient and all their records?')) return;
    await api.deletePatient(id);
    onRefresh();
  };

  // ── Prescribe (per patient) ────────────────────────────────────────────────
  const openPrescribe = (p: Patient) => {
    setPrescribeFor(p);
    setMedForm(EMPTY_MED);
    setMedError('');
  };

  const submitMed = async (e: React.FormEvent) => {
    e.preventDefault();
    setMedError('');
    try {
      await api.createMedication({
        ...medForm,
        patientId:      prescribeFor!.id,
        times:          medForm.times.split(',').map((t: string) => t.trim()),
        startDate:      medForm.startDate || new Date().toISOString().split('T')[0],
        prescribedBy:   'Dr. Evans',
        recipientEmail: prescribeFor!.email || '',
        recipientPhone: prescribeFor!.phone || '',
      });
      setPrescribeFor(null);
      onRefresh();
    } catch { setMedError('Failed to prescribe medication. Check all fields.'); }
  };

  return (
    <div className="space-y-6">

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit">
        {(['dashboard', 'patients'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-xs font-semibold capitalize transition ${
              tab === t ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
            }`}>{t}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'My Patients',    value: patients.length,       color: 'bg-blue-50 text-blue-700 border-blue-100',     icon: <Users className="w-5 h-5" /> },
              { label: 'Medications',    value: medications.length,    color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <Pill className="w-5 h-5" /> },
              { label: 'Adherence Rate', value: `${adherence}%`,       color: 'bg-teal-50 text-teal-700 border-teal-100',     icon: <HeartPulse className="w-5 h-5" /> },
              { label: 'Active Alerts',  value: activeAlerts,          color: 'bg-rose-50 text-rose-700 border-rose-100',     icon: <AlertTriangle className="w-5 h-5" /> },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border p-5 flex items-center gap-4 ${s.color}`}>
                <div className="p-2 rounded-xl bg-white/60">{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs font-medium opacity-70">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Patient overview table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-500" /> Patient Overview
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono">
                  <tr>{['Patient', 'Age', 'Condition', 'Caregiver', 'Meds', 'Adherence'].map(h =>
                    <th key={h} className="px-4 py-3">{h}</th>
                  )}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map(p => {
                    const pMeds   = patientMeds(p.id);
                    const pLogs   = logs.filter(l => pMeds.some(m => m.id === l.medicationId));
                    const taken   = pLogs.filter(l => l.status === 'taken').length;
                    const missed  = pLogs.filter(l => l.status === 'missed').length;
                    const adh     = taken + missed > 0 ? Math.round((taken / (taken + missed)) * 100) : 100;
                    const cg      = caregivers.find(c => c.id === p.caregiverId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                        <td className="px-4 py-3 text-slate-500">{p.age}</td>
                        <td className="px-4 py-3 text-slate-600">{p.condition || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{cg?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono">{pMeds.length}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-semibold ${adh >= 85 ? 'bg-emerald-50 text-emerald-700' : adh >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                            {adh}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active alerts */}
          {activeAlerts > 0 && (
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
              <h3 className="font-semibold text-rose-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Active Escalation Alerts
              </h3>
              <div className="space-y-2">
                {alerts.filter(a => a.status === 'notified').map(a => (
                  <div key={a.id} className="flex items-start justify-between gap-4 p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs">
                    <p className="text-rose-800">{a.message}</p>
                    <button onClick={async () => { await api.resolveAlert(a.id); onRefresh(); }}
                      className="shrink-0 px-2 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700">
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PATIENTS ──────────────────────────────────────────────────────── */}
      {tab === 'patients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">My Patients</h3>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow">
              <UserPlus className="w-4 h-4" /> Add Patient
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients.map(p => {
              const pMeds     = patientMeds(p.id);
              const cg        = caregivers.find(c => c.id === p.caregiverId);
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id}
                  className={`bg-white rounded-2xl border shadow-sm transition ${isExpanded ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-100'}`}>

                  {/* Card header — clickable to expand */}
                  <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.age} yrs · {p.gender} · {p.condition || 'No condition'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Caregiver: {cg?.name || 'None assigned'}</p>
                      </div>
                      <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                        {/* Prescribe button — opens modal pre-bound to this patient */}
                        <button onClick={() => openPrescribe(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition">
                          <Plus className="w-3 h-3" /> Prescribe
                        </button>
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deletePatient(p.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded: show this patient's medications only */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-slate-50">
                      <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-3 mb-2">
                        Prescriptions ({pMeds.length})
                      </p>
                      {pMeds.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">No medications prescribed yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {pMeds.map(m => (
                            <div key={m.id} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl">
                              <div>
                                <span className="font-semibold text-slate-700">{m.name}</span>
                                <span className="ml-1.5 text-slate-500">{m.dosage}</span>
                                <span className="ml-2 font-mono text-slate-400">{(Array.isArray(m.times) ? m.times : JSON.parse(m.times || '[]')).join(', ')}</span>
                              </div>
                              <button onClick={async () => { await api.deleteMedication(m.id); onRefresh(); }}
                                className="text-rose-400 hover:text-rose-600 ml-3 shrink-0">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PATIENT MODAL ─────────────────────────────────────────────────── */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{editingPatient ? 'Edit Patient' : 'New Patient'}</h3>
                <p className="text-xs text-blue-100">Fill in patient details</p>
              </div>
              <button onClick={() => setShowPatientModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitPatient} className="p-6 space-y-3">
              {patientError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{patientError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input value={patientForm.name} onChange={e => setPatientForm({ ...patientForm, name: e.target.value })}
                    required placeholder="Patient full name"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
                  <input type="number" value={patientForm.age} onChange={e => setPatientForm({ ...patientForm, age: e.target.value })}
                    required placeholder="Age"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                  <select value={patientForm.gender} onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Medical Condition</label>
                  <input value={patientForm.condition} onChange={e => setPatientForm({ ...patientForm, condition: e.target.value })}
                    placeholder="e.g. Diabetes, Hypertension"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input value={patientForm.phone} onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" value={patientForm.email} onChange={e => setPatientForm({ ...patientForm, email: e.target.value })}
                    placeholder="patient@example.com"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Caregiver</label>
                  <select value={patientForm.caregiverId} onChange={e => setPatientForm({ ...patientForm, caregiverId: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">— None —</option>
                    {caregivers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition">
                  <Check className="w-3.5 h-3.5 inline mr-1" />{editingPatient ? 'Update' : 'Create Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRESCRIBE MODAL (per patient) ─────────────────────────────────── */}
      {prescribeFor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Prescribe Medication</h3>
                <p className="text-xs text-emerald-100">Patient: {prescribeFor.name}</p>
              </div>
              <button onClick={() => setPrescribeFor(null)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitMed} className="p-6 space-y-3">
              {medError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{medError}</p>}
              <div className="grid grid-cols-2 gap-3">
                {[['Drug name', 'name', 'e.g. Metformin'], ['Dosage', 'dosage', 'e.g. 500mg']].map(([label, key, ph]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                    <input value={medForm[key]} onChange={e => setMedForm({ ...medForm, [key]: e.target.value })}
                      placeholder={ph} required
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Frequency</label>
                  <select value={medForm.frequency} onChange={e => setMedForm({ ...medForm, frequency: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {['Daily', 'Twice daily', 'Weekly', 'As needed'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select value={medForm.category} onChange={e => setMedForm({ ...medForm, category: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {['Diabetes', 'Heart & Pressure', 'Cholesterol', 'Vitamins', 'Pain Relief', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Times (HH:MM, comma sep.)</label>
                  <input value={medForm.times} onChange={e => setMedForm({ ...medForm, times: e.target.value })}
                    placeholder="08:00, 20:00"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input type="date" value={medForm.startDate} onChange={e => setMedForm({ ...medForm, startDate: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Clinical Notes</label>
                <textarea value={medForm.notes} onChange={e => setMedForm({ ...medForm, notes: e.target.value })}
                  rows={2} placeholder="Instructions for patient..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPrescribeFor(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition">
                  <Check className="w-3.5 h-3.5 inline mr-1" /> Prescribe & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
