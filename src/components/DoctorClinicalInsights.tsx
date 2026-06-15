import React, { useState } from 'react';
import { 
  Sparkles, Brain, AlertTriangle, ChevronRight, Activity, MessageSquareDot, 
  RefreshCw, SmilePlus, CheckCircle, ShieldAlert, BookOpen 
} from 'lucide-react';
import { PatientNote } from '../types';

interface DoctorClinicalInsightsProps {
  notes: PatientNote[];
  onAddAndAnalyzeNote: (text: string, date: string) => Promise<void>;
}

export default function DoctorClinicalInsights({
  notes,
  onAddAndAnalyzeNote,
}: DoctorClinicalInsightsProps) {
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [activeTabNoteId, setActiveTabNoteId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const today = "2026-06-14";
      await onAddAndAnalyzeNote(noteText, today);
      setSuccessMessage('Patient journal record successfully added. AI cognitive analysis calculated!');
      setNoteText('');
    } catch (err: any) {
      setErrorMessage('AI analysis failed. Please verify API configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Default to first note if not selected
  const selectedNoteId = activeTabNoteId || (notes.length > 0 ? notes[0].id : null);
  const activeNote = notes.find(n => n.id === selectedNoteId);

  const getRiskLabelColor = (level?: 'Low' | 'Medium' | 'High') => {
    switch (level) {
      case 'High':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div id="clinician-insights-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
      
      {/* LEFT: Journal Log Submissions & Feed */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Clinician Assistant Panel */}
        <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-800 text-sm">Add Feedback Log & Run Cognitive analysis</h3>
              <p className="text-xs text-slate-500">Inserts client transcript and analyzes adherence risk</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              id="raw-note-textarea"
              placeholder="e.g. William complains 'the Metformin makes me feel weak'. He states he wants to skip evening doses because he feels fine on his own, or caregiver notes nausea..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800 leading-relaxed"
              rows={4}
              disabled={isLoading}
            />

            {errorMessage && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">{errorMessage}</p>
            )}
            
            {successMessage && (
              <p className="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">{successMessage}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Model: <strong className="text-slate-600">Gemini 3.5 Flash</strong> (Structured Analysis)
              </span>
              <button
                type="submit"
                disabled={isLoading || !noteText.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl tracking-wide transition flex items-center gap-1.5 shadow-sm shadow-teal-100"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Notes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Journal Feed Selection */}
        <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs">
          <h3 className="font-display font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" /> Patient Feedback Journal Logs
          </h3>

          {notes.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No clinical log records found. Use the analyzer above to add one.</p>
          ) : (
            <div id="doctor-journal-list" className="space-y-3">
              {notes.map(note => {
                const isActive = selectedNoteId === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => setActiveTabNoteId(note.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-4 ${
                      isActive 
                        ? 'border-teal-300 bg-teal-50/15 shadow-sm' 
                        : 'border-slate-150 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <span className="text-[10px] text-slate-400 font-mono block">{note.date}</span>
                      <p className="text-xs font-medium text-slate-700 clamp-2">{note.noteText}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {note.sentiment && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 font-mono">
                            {note.sentiment}
                          </span>
                        )}
                        {note.sideEffects && note.sideEffects !== "None reported" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                            Side-effect: {note.sideEffects}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 justify-between self-stretch">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border ${getRiskLabelColor(note.riskLevel)}`}>
                        Risk: {note.riskLevel || 'Unknown'}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? 'translate-x-1 text-teal-600' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT: Selected Cognitive Analysis Findings */}
      <div className="lg:col-span-5">
        <div className="sticky top-24 bg-teal-950 text-white rounded-3xl p-6 shadow-xl border border-teal-900 flex flex-col h-full min-h-[500px]">
          
          <div className="flex items-center gap-2.5 border-b border-teal-800 pb-4 mb-4">
            <Activity className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm tracking-wide uppercase text-teal-300 font-mono">Cognitive Analysis Report</span>
                <span className="bg-teal-800 text-teal-200 text-[10px] px-2 py-0.5 rounded-full tracking-wide">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-teal-200 mt-0.5">Automated Clinical Adherence Risk Audit</p>
            </div>
          </div>

          {activeNote ? (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              
              {/* Core risk scoring stats block */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-teal-900/50 p-3 rounded-2xl border border-teal-800/80">
                  <span className="text-[10px] text-teal-300 font-mono font-bold block uppercase tracking-wider mb-0.5">Adherence Risk</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      activeNote.riskLevel === 'High' ? 'bg-rose-500' : activeNote.riskLevel === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}></span>
                    <span className="text-sm font-display font-extrabold">{activeNote.riskLevel || 'Low'}</span>
                  </div>
                </div>

                <div className="bg-teal-900/50 p-3 rounded-2xl border border-teal-800/80">
                  <span className="text-[10px] text-teal-300 font-mono font-semibold block uppercase tracking-wider mb-0.5">Note Sentiment</span>
                  <p className="text-xs font-semibold mt-1 text-slate-200 truncate">{activeNote.sentiment || 'Awaiting evaluation'}</p>
                </div>
              </div>

              {/* Text Blocks */}
              <div className="space-y-3.5">
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider font-mono font-bold text-teal-400">Raw Feedback Excerpt:</h4>
                  <p className="text-xs text-teal-100 font-sans italic mt-1 bg-teal-900/40 p-3 rounded-xl border border-teal-850">
                    "{activeNote.noteText}"
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] uppercase tracking-wider font-mono font-bold text-teal-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-450" /> Medical / Behavioral Risk Analysis:
                  </h4>
                  <p className="text-xs text-teal-100 font-sans leading-relaxed mt-1">
                    {activeNote.riskAnalysis || "No adherence issues detected inside the raw journal log."}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-teal-400 block">Identified Side-effects:</span>
                  <span className="inline-block mt-1 px-3 py-1 bg-teal-900 border border-teal-850 text-rose-300 text-xs font-mono font-medium rounded-lg">
                    {activeNote.sideEffects || "None reported"}
                  </span>
                </div>

                <div>
                  <h4 className="text-[11px] uppercase tracking-wider font-mono font-bold text-teal-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Direct Clinical Recommendations:
                  </h4>
                  <p className="text-xs text-teal-100 font-sans leading-relaxed mt-1 whitespace-pre-line">
                    {activeNote.recommendations || "Support standard clinical procedures. No adjustments requested."}
                  </p>
                </div>
              </div>

              <div className="border-t border-teal-800 pt-4 text-[10px] text-teal-300 font-mono text-center">
                Cognitive evaluation simulated via Azure Cognitive alternate LLM interface.
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-teal-300">
              <Brain className="w-12 h-12 text-teal-500 mb-3 animate-pulse" />
              <p className="text-xs font-medium">Please submit or select a patient note log in the left panel to trigger cognitive adherence evaluation insights.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
