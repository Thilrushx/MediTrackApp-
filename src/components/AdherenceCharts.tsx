import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Medication, AdherenceLog } from '../types';

interface AdherenceChartsProps {
  medications: Medication[];
  logs: AdherenceLog[];
}

export default function AdherenceCharts({ medications, logs }: AdherenceChartsProps) {
  // Filter for logs that are either taken or missed (not pending future ones)
  const completedLogs = logs.filter(l => l.status === 'taken' || l.status === 'missed');
  const takenLogs = completedLogs.filter(l => l.status === 'taken');
  
  const adherenceScore = completedLogs.length > 0 
    ? Math.round((takenLogs.length / completedLogs.length) * 100) 
    : 100;

  // Group by medication to calculate per-medication compliance score
  const getMedCompliance = (medId: string) => {
    const medLogs = completedLogs.filter(l => l.medicationId === medId);
    const medTaken = medLogs.filter(l => l.status === 'taken');
    if (medLogs.length === 0) return 100;
    return Math.round((medTaken.length / medLogs.length) * 100);
  };

  // Get date groups (unique past days)
  const uniqueDates = Array.from(new Set(logs.map(l => l.date))).sort();

  return (
    <div id="adherence-insights-section" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Bespoke circular adherence meter */}
      <div id="gauge-card" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-sm">Overall Patient Compliance</h3>
          <p className="text-xs text-slate-500">Calculated across all logged dosages</p>
        </div>

        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG custom animated gauge ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-slate-100"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
              />
              <circle
                className="text-teal-600 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - adherenceScore / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="38"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-bold text-slate-900">{adherenceScore}%</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Adherence</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100/60 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Target: &gt;85% (Safe)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center border-t border-slate-50 pt-3">
          <div>
            <span className="block text-xs text-slate-400">Doses Taken</span>
            <span className="font-mono text-sm font-semibold text-emerald-600">{takenLogs.length}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-400">Doses Missed</span>
            <span className="font-mono text-sm font-semibold text-rose-500">
              {completedLogs.filter(l => l.status === 'missed').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual adherence calendar dot logger */}
      <div id="calendar-grid-card" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Adherence Grid Status</h3>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Recent 5 Days
            </span>
          </div>
          <p className="text-xs text-slate-500">Color coded checklist overview</p>
        </div>

        <div className="my-4 space-y-3">
          {uniqueDates.map(date => {
            const dayLogs = logs.filter(l => l.date === date);
            const takenCount = dayLogs.filter(l => l.status === 'taken').length;
            const missedCount = dayLogs.filter(l => l.status === 'missed').length;
            const pendingCount = dayLogs.filter(l => l.status === 'pending').length;

            const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString([], { 
              weekday: 'short', 
              month: 'numeric', 
              day: 'numeric' 
            });

            return (
              <div key={date} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                <span className="text-xs font-medium text-slate-600 font-mono w-20">{formattedDate}</span>
                <div className="flex items-center space-x-1.5 flex-1 justify-end">
                  {dayLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold font-mono ${
                        log.status === 'taken' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : log.status === 'missed'
                          ? 'bg-rose-100 text-rose-700 border border-rose-250 animate-bounce'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                      title={`${log.medicationName} (${log.scheduledTime}) - ${log.status}`}
                    >
                      {log.status === 'taken' ? '✓' : log.status === 'missed' ? '✗' : '•'}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-50">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-xs inline-block"></span> Taken</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-400 rounded-xs inline-block"></span> Missed</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-300 rounded-xs inline-block"></span> Upcoming</span>
        </div>
      </div>

      {/* 3. Pill-by-pill compliance rating */}
      <div id="pills-rating-card" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-sm">Individual Drug Compliance</h3>
          <p className="text-xs text-slate-500">Adherence percentage per active presription</p>
        </div>

        <div className="my-4 space-y-3.5">
          {medications.map(med => {
            const score = getMedCompliance(med.id);
            const progressColor = score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <div key={med.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{med.name}</span>
                  <span className="font-mono text-slate-500">{score}%</span>
                </div>
                {/* Custom bar chart progress meter */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`${progressColor} h-full rounded-full transition-all duration-700`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-teal-50 rounded-xl p-3 border border-teal-100/60 mt-1">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-teal-800 leading-relaxed font-sans">
              <strong>Clinical Insight:</strong> William's adherence is strong for Morning medications, but evening dosage adherence carries moderate forgetfulness risks.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
