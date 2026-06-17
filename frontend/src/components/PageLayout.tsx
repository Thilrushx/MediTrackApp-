import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Bell, Clock, Home, Stethoscope, UserCheck, User, ShieldAlert, WifiOff } from 'lucide-react';
import { UserRole, EscalationAlert } from '../types';
import { api } from '../api';
import { useData } from '../DataContext';

interface Props {
  role:        UserRole;
  alerts:      EscalationAlert[];
  onRefresh:   () => void;
  children:    React.ReactNode;
}

const ROLE_CONFIG: Record<UserRole, { label: string; sub: string; icon: React.ReactNode; headerBg: string; headerText: string }> = {
  doctor: {
    label:      'Doctor Portal',
    sub:        'Dr. Evans',
    icon:       <Stethoscope className="w-4 h-4" />,
    headerBg:   'bg-blue-600',
    headerText: 'text-blue-600',
  },
  caregiver: {
    label:      'Caregiver Portal',
    sub:        'Sarah Peterson',
    icon:       <UserCheck className="w-4 h-4" />,
    headerBg:   'bg-purple-600',
    headerText: 'text-purple-600',
  },
  patient: {
    label:      'Patient Portal',
    sub:        'William Johnson',
    icon:       <User className="w-4 h-4" />,
    headerBg:   'bg-emerald-600',
    headerText: 'text-emerald-600',
  },
};

function LiveClock() {
  const [time, setTime] = React.useState('');
  React.useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-semibold tabular-nums">{time}</span>;
}

export default function PageLayout({ role, alerts, onRefresh, children }: Props) {
  const [showAlerts, setShowAlerts] = useState(false);
  const { error }    = useData();
  const cfg          = ROLE_CONFIG[role];
  const activeAlerts = alerts.filter(a => a.status === 'notified');

  // Show API connection error instead of blank page
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <WifiOff className="w-10 h-10 text-rose-400" />
        <h2 className="font-bold text-slate-800 text-lg">API Connection Failed</h2>
        <p className="text-sm text-slate-500 text-center max-w-sm">{error}</p>
        <button onClick={onRefresh}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition">
          Retry
        </button>
        <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Navigation ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 flex items-center justify-center text-white shadow shadow-teal-200 transition">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-slate-900 tracking-tight">Medi<span className="text-teal-600">Track</span></span>
              <span className="ml-2 text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded">
                AI Adherence
              </span>
            </div>
          </Link>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/" className="hover:text-slate-600 transition">Home</Link>
            <span>/</span>
            <span className={`font-semibold ${cfg.headerText}`}>{cfg.label}</span>
          </div>

          {/* Active role badge */}
          <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${cfg.headerText} border-current/20 bg-white`}>
            {cfg.icon}
            <div className="leading-tight">
              <span className="block font-bold">{cfg.label}</span>
              <span className="font-normal opacity-60 text-[10px]">{cfg.sub}</span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Alert bell */}
            <button onClick={() => setShowAlerts(true)}
              className="relative p-2 rounded-xl text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
              title="Escalation Alerts">
              <Bell className="w-4 h-4" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {/* Clock */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <LiveClock />
            </div>

            {/* Home link */}
            <Link to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition border border-slate-200">
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-8">
        {children}
      </main>

      {/* ── Alerts overlay ── */}
      {showAlerts && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-slate-800">Escalation Alerts</h3>
              </div>
              <button onClick={() => setShowAlerts(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
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
                    <button onClick={async () => { await api.resolveAlert(a.id); onRefresh(); }}
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

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-100 py-5 text-center text-[11px] text-slate-400 font-mono">
        <p>© 2026 MediTrack Cloud System · B.G.T.D. Wijerathne · SEU/IS/20/ICT/055</p>
        <p className="text-slate-300 mt-0.5">Azure SQL · Express.js REST API · React + Vite · MySQL Sequelize ORM</p>
      </footer>
    </div>
  );
}
