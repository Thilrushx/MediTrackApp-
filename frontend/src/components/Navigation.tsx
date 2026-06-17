import React, { useState, useEffect } from 'react';
import { HeartPulse, Bell, Clock, Activity } from 'lucide-react';
import { UserRole } from '../types';

interface Props {
  currentRole: UserRole;
  onRoleChange: (r: UserRole) => void;
  alertCount: number;
  onOpenAlerts: () => void;
}

const ROLE_COLORS: Record<UserRole, string> = {
  doctor:    'bg-blue-600 text-white',
  caregiver: 'bg-purple-600 text-white',
  patient:   'bg-emerald-600 text-white',
};

export default function Navigation({ currentRole, onRoleChange, alertCount, onOpenAlerts }: Props) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-200">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-slate-900 tracking-tight">MediTrack</span>
              <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded">AI Adherence</span>
            </div>
            <p className="text-xs text-slate-400">Cloud Healthcare Dashboard</p>
          </div>
        </div>

        {/* Info + alerts */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600">
            <Activity className="w-3.5 h-3.5 text-teal-500 animate-bounce" />
            <span className="font-semibold">MediTrack v2.0</span>
          </div>

          <button onClick={onOpenAlerts}
            className="relative p-2 rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition">
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                {alertCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold">{time}</span>
          </div>
        </div>

        {/* Role switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['doctor', 'caregiver', 'patient'] as UserRole[]).map(r => (
            <button key={r} onClick={() => onRoleChange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                currentRole === r ? `${ROLE_COLORS[r]} shadow` : 'text-slate-600 hover:bg-slate-50'
              }`}>{r}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
}
