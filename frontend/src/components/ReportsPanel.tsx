import React, { useState, useRef } from 'react';
import { FileText, Upload, Trash2, Download, Eye, X, CheckCircle } from 'lucide-react';
import { MedicalReport, Patient, UserRole } from '../types';
import { api } from '../api';

interface Props {
  role:       UserRole;
  patients:   Patient[];
  reports:    MedicalReport[];
  patientId?: string;
  uploadedBy?: string;
  onRefresh:  () => void;
}

const CATEGORIES = ['Lab Result', 'Prescription', 'Imaging', 'Discharge Summary', 'Other'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  'Lab Result':        'bg-blue-50 text-blue-700 border-blue-200',
  'Prescription':      'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Imaging':           'bg-purple-50 text-purple-700 border-purple-200',
  'Discharge Summary': 'bg-amber-50 text-amber-700 border-amber-200',
  'Other':             'bg-slate-50 text-slate-600 border-slate-200',
};

export default function ReportsPanel({ role, patients, reports, patientId, uploadedBy, onRefresh }: Props) {
  const [showUpload,      setShowUpload]      = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [reportName,      setReportName]      = useState('');
  const [category,        setCategory]        = useState<typeof CATEGORIES[number]>('Lab Result');
  const [file,            setFile]            = useState<File | null>(null);
  const [uploading,       setUploading]       = useState(false);
  const [uploadError,     setUploadError]     = useState('');
  const [uploadSuccess,   setUploadSuccess]   = useState(false);
  const [filterPatient,   setFilterPatient]   = useState(patientId || '');
  const fileRef = useRef<HTMLInputElement>(null);

  // When patientId is provided (patient/caregiver scoped view), use reports as-is (already filtered by page)
  // When doctor view, apply filterPatient dropdown
  const visibleReports = patientId
    ? reports
    : filterPatient
    ? reports.filter(r => r.patientId === filterPatient)
    : reports;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    if (!file)             { setUploadError('Please select a PDF file.'); return; }
    if (!reportName.trim()) { setUploadError('Report name is required.'); return; }
    const resolvedPatientId = patientId || selectedPatient;
    if (!resolvedPatientId)  { setUploadError('Please select a patient.'); return; }

    const fd = new FormData();
    fd.append('pdf',        file);
    fd.append('name',       reportName.trim());
    fd.append('category',   category);
    fd.append('patientId',  resolvedPatientId);
    fd.append('uploadedBy', uploadedBy || 'Doctor');

    try {
      setUploading(true);
      await api.uploadReport(fd);
      setUploadSuccess(true);
      setReportName('');
      setCategory('Lab Result');
      setFile(null);
      setSelectedPatient('');
      if (fileRef.current) fileRef.current.value = '';
      onRefresh();
      setTimeout(() => { setUploadSuccess(false); setShowUpload(false); }, 1500);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this report permanently?')) return;
    await api.deleteReport(id);
    onRefresh();
  };

  const openFile = (filename: string) => {
    window.open(`/uploads/${filename}`, '_blank');
  };

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-800">Medical Reports</h3>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
            {visibleReports.length} file{visibleReports.length !== 1 ? 's' : ''}
          </span>
        </div>
        {role === 'doctor' && (
          <button onClick={() => { setShowUpload(true); setUploadError(''); setUploadSuccess(false); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm">
            <Upload className="w-3.5 h-3.5" /> Upload Report
          </button>
        )}
      </div>

      {/* Filter by patient (doctor view only, not scoped) */}
      {role === 'doctor' && !patientId && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Filter by patient:</label>
          <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)}
            className="text-xs p-2 bg-white border border-slate-200 rounded-xl text-slate-700">
            <option value="">All Patients</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* Reports list */}
      {visibleReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No reports found</p>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'doctor' ? 'Upload a PDF report to get started.' : 'No reports have been uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {visibleReports.map(r => {
              const patient = patients.find(p => p.id === r.patientId);
              return (
                <div key={r.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-red-50 rounded-xl border border-red-100 shrink-0">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[r.category] || CATEGORY_COLORS['Other']}`}>
                          {r.category}
                        </span>
                        {patient && (
                          <span className="text-[10px] text-slate-400 font-mono">{patient.name}</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(r.uploadedAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {r.originalName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openFile(r.filename)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                      title="View PDF">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <a href={`/uploads/${r.filename}`} download={r.originalName}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                      title="Download PDF">
                      <Download className="w-3 h-3" /> Download
                    </a>
                    {role === 'doctor' && (
                      <button onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Delete report">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Upload Medical Report</h3>
                <p className="text-xs text-blue-100">PDF only · Max 10MB</p>
              </div>
              <button onClick={() => setShowUpload(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {uploadError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">{uploadError}</p>
              )}
              {uploadSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                  <CheckCircle className="w-4 h-4" /> Report uploaded successfully!
                </div>
              )}

              {/* Patient selector (only when not scoped to a patient) */}
              {!patientId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Patient</label>
                  <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                    <option value="">— Select patient —</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Report Name</label>
                <input value={reportName} onChange={e => setReportName(e.target.value)}
                  placeholder="e.g. Blood Test Results June 2026" required
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">PDF File</label>
                <div className="relative">
                  <input ref={fileRef} type="file" accept="application/pdf"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                </div>
                {file && (
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowUpload(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={uploading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Uploading...' : 'Upload Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
