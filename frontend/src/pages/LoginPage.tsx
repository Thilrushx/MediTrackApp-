import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HeartPulse, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2,
  Stethoscope, UserCheck, User,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';

// ── Demo credential hints per role ────────────────────────────────────────────
const DEMO: Record<UserRole, { email: string; password: string; label: string; icon: React.ReactNode; color: string }> = {
  doctor: {
    label:    'Doctor',
    email:    'evans@meditrack.com',
    password: 'Doctor@123',
    icon:     <Stethoscope className="w-4 h-4" />,
    color:    'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  },
  caregiver: {
    label:    'Caregiver',
    email:    'sarah.care@example.com',
    password: 'Caregiver@123',
    icon:     <UserCheck className="w-4 h-4" />,
    color:    'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
  },
  patient: {
    label:    'Patient',
    email:    'william@example.com',
    password: 'Patient@123',
    icon:     <User className="w-4 h-4" />,
    color:    'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
  },
};

const ROLE_REDIRECT: Record<UserRole, string> = {
  doctor:    '/doctor',
  caregiver: '/caregiver',
  patient:   '/patient',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // After login redirect to where they were trying to go, or role-based default
  const from = (location.state as any)?.from?.pathname as string | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password: password.trim() });
      // Re-read user from context after login — useAuth() re-renders with new state
      // Determine redirect from the JWT role (handled in PrivateRoute / navigate below)
      // We navigate to 'from' or let App.tsx redirect via role
      navigate(from || '/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (role: UserRole) => {
    setEmail(DEMO[role].email.trim());
    setPassword(DEMO[role].password.trim());
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">

      {/* Header */}
      <header className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-sm px-4 md:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow shadow-teal-200">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Medi<span className="text-teal-600">Track</span>
            </span>
            <span className="ml-2 text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded">
              AI Adherence
            </span>
          </div>
        </div>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200 mb-4">
              <HeartPulse className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your MediTrack account</p>
          </div>

          {/* Demo quick-fill buttons */}
          <div className="mb-6">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
              Quick demo login
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DEMO) as UserRole[]).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(role)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${DEMO[role].color}`}
                >
                  {DEMO[role].icon}
                  {DEMO[role].label}
                </button>
              ))}
            </div>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition text-sm shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Accounts are created by your doctor. Contact Dr. K.Perera if you need access.
          </p>
          <p className="text-center text-xs text-slate-400 mt-8">
            +94 76 123 4567
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-4 text-center text-[11px] text-slate-400 font-mono">
        <p>© 2026 MediTrack Cloud System · B.G.T.D. Wijerathne · SEU/IS/20/ICT/055</p>
      </footer>
    </div>
  );
}
