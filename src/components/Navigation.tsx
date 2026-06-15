import React, { useState, useEffect } from 'react';
import { Shield, Clock, Bell, User, HeartPulse, Activity } from 'lucide-react';
import { UserRole } from '../types';

interface NavigationProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  alertCount: number;
  onOpenAlerts: () => void;
}

export default function Navigation({
  currentRole,
  onRoleChange,
  alertCount,
  onOpenAlerts,
}: NavigationProps) {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    // Standard clock showing current time
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'patient':
        return 'Patient Portal (William)';
      case 'caregiver':
        return 'Caregiver Portal (Sarah)';
      case 'doctor':
        return 'Clinician Portal (Dr. Evans)';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'patient':
        return 'bg-emerald-500 text-white';
      case 'caregiver':
        return 'bg-purple-600 text-white';
      case 'doctor':
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <header id="app-navigation-header" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 md:px-8 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand Logo & Clinician Identity */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-100">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-tight text-slate-900">MediTrack</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100 font-mono">
                AI Adherence
              </span>
            </div>
            <p className="text-xs text-slate-500">Cloud Healthcare Adherence Dashboard</p>
          </div>
        </div>

        {/* Dynamic System Info & Clock */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Patient Indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
            <Activity className="w-3.5 h-3.5 text-teal-600 animate-bounce" />
            <span className="text-xs font-semibold text-slate-700">Subject: William (Age 82)</span>
          </div>

          {/* Simulated Live Alert Counter */}
          <button 
            id="nav-alerts-btn"
            onClick={onOpenAlerts}
            className="relative flex items-center justify-center p-2 rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
            title="Escalation Alerts"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                {alertCount}
              </span>
            )}
          </button>

          {/* Time & Clock */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-100 font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">{timeStr || '08:00 AM'}</span>
          </div>
        </div>

        {/* Persona/Role Selector Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start md:self-auto">
          {(['patient', 'caregiver', 'doctor'] as UserRole[]).map((role) => (
            <button
              id={`role-btn-${role}`}
              key={role}
              onClick={() => onRoleChange(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize duration-200 ${
                currentRole === role
                  ? `${getRoleColor(role)} shadow-xs`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
}
