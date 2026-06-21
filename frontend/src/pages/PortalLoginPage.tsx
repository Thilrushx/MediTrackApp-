import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HeartPulse, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2,
  Stethoscope, UserCheck, User, ArrowLeft, CheckCircle2,
  Activity, Shield, ClipboardList, BriefcaseMedical,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { api }     from '../api';
import { UserRole } from '../types';

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CFG = {
  doctor: {
    label:       'Doctor Portal',
    role:        'doctor' as UserRole,
    gradient:    'from-blue-700 to-indigo-700',
    accent:      'teal',
    ringColor:   'focus:ring-blue-500',
    btnClass:    'bg-blue-600 hover:bg-blue-700',
    tabActive:   'border-blue-600 text-blue-600',
    icon:        <Stethoscope className="w-10 h-10 text-white" />,
    description: 'Manage patients, prescribe medications, monitor adherence and resolve escalation alerts.',
    features: [
      { icon: <ClipboardList className="w-4 h-4" />,      text: 'Create & manage patient accounts' },
      { icon: <BriefcaseMedical className="w-4 h-4" />,   text: 'Prescribe & track medications' },
      { icon: <Activity className="w-4 h-4" />,           text: 'Real-time adherence dashboard' },
      { icon: <Shield className="w-4 h-4" />,             text: 'Resolve escalation alerts' },
    ],
    canRegister:  true,
    registerNote: 'Use your hospital registration code to create a new doctor account.',
    loginDemo:    { email: 'evans@meditrack.com', password: 'Doctor@123' },
  },
  caregiver: {
    label:       'Caregiver Portal',
    role:        'caregiver' as UserRole,
    gradient:    'from-purple-700 to-violet-700',
    accent:      'purple',
    ringColor:   'focus:ring-purple-500',
    btnClass:    'bg-purple-600 hover:bg-purple-700',
    tabActive:   'border-purple-600 text-purple-600',
    icon:        <UserCheck className="w-10 h-10 text-white" />,
    description: 'View your assigned patients, monitor their medication schedules and track daily dose adherence.',
    features: [
      { icon: <User className="w-4 h-4" />,               text: 'View assigned patients' },
      { icon: <ClipboardList className="w-4 h-4" />,      text: 'Monitor medication schedules' },
      { icon: <Activity className="w-4 h-4" />,           text: 'Track daily dose adherence' },
      { icon: <Shield className="w-4 h-4" />,             text: 'Resolve missed-dose alerts' },
    ],
    canRegister:  false,
    registerNote: '',
    loginDemo:    { email: 'sarah.care@example.com', password: 'Caregiver@123' },
  },
  patient: {
    label:       'Patient Portal',
    role:        'patient' as UserRole,
    gradient:    'from-emerald-700 to-teal-700',
    accent:      'emerald',
    ringColor:   'focus:ring-emerald-500',
    btnClass:    'bg-emerald-600 hover:bg-emerald-700',
    tabActive:   'border-emerald-600 text-emerald-600',
    icon:        <User className="w-10 h-10 text-white" />,
    description: "View your daily medication schedule, mark doses as taken or missed and submit personal health notes.",
    features: [
      { icon: <ClipboardList className="w-4 h-4" />,      text: "Today's dose schedule" },
      { icon: <Activity className="w-4 h-4" />,           text: 'Medication history & logs' },
      { icon: <BriefcaseMedical className="w-4 h-4" />,   text: 'Submit personal health notes' },
      { icon: <Shield className="w-4 h-4" />,             text: 'AI risk analysis & insights' },
    ],
    canRegister:  false,
    registerNote: '',
    loginDemo:    { email: 'william@example.com', password: 'Patient@123' },
  },
};

// ── Input field helper ────────────────────────────────────────────────────────
function Field({
  id, label, type = 'text', value, onChange, placeholder, icon, ringColor, autoComplete,
  rightSlot,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string; icon: React.ReactNode;
  ringColor: string; autoComplete?: string; rightSlot?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
        <input
          id={id} type={type} value={value} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full pl-10 ${rightSlot ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${ringColor} focus:border-transparent transition`}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PortalLoginPage() {
  const { role: roleParam } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const cfg = ROLE_CFG[roleParam as keyof typeof ROLE_CFG] ?? ROLE_CFG.doctor;

  // Tab state
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login state
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError,    setLoginError]    = useState<string | null>(null);
  const [loginLoading,  setLoginLoading]  = useState(false);

  // Register state (doctor only)
  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');
  const [regSpecialty,setRegSpecialty]= useState('');
  const [regCode,     setRegCode]     = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError,    setRegError]    = useState<string | null>(null);
  const [regSuccess,  setRegSuccess]  = useState(false);
  const [regLoading,  setRegLoading]  = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await login({ email: loginEmail.trim(), password: loginPassword.trim() });
      navigate('/', { replace: true });
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters.');
      return;
    }
    setRegLoading(true);
    try {
      const result = await api.register({
        name:         regName.trim(),
        email:        regEmail.trim(),
        password:     regPassword,
        specialty:    regSpecialty.trim() || undefined,
        registerCode: regCode.trim(),
      });
      // Auto-login after registration
      localStorage.setItem('meditrack_token', result.token);
      localStorage.setItem('meditrack_user',  JSON.stringify(result.user));
      setRegSuccess(true);
      setTimeout(() => navigate('/doctor', { replace: true }), 1500);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  const fillDemo = () => {
    setLoginEmail(cfg.loginDemo.email);
    setLoginPassword(cfg.loginDemo.password);
    setLoginError(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">

      {/* ── Header ── */}
      <header className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-sm px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow shadow-teal-200">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div className="-space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[20px] text-slate-900 tracking-tight">
                  Medi<span className="text-teal-600">Track</span>
                </span>
                <span className="text-[10px] font-mono bg-teal-100 text-teal-700 px-1.5 py-px rounded">
                  AI Adherence
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">Cloud Health Care.</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* ── Split screen body ── */}
      <div className="flex-1 flex items-stretch">

        {/* ── LEFT — role info panel ── */}
        <div className={`hidden lg:flex w-2/5 bg-gradient-to-br ${cfg.gradient} flex-col justify-between p-12 text-white`}>
          <div>
            {/* Icon badge */}
            <div className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mb-8 shadow-lg">
              {cfg.icon}
            </div>

            <h1 className="text-3xl font-bold mb-3">{cfg.label}</h1>
            <p className="text-white/75 text-sm leading-relaxed mb-10">{cfg.description}</p>

            {/* Feature list */}
            <ul className="space-y-4">
              {cfg.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    {f.icon}
                  </span>
                  <span className="text-sm font-medium text-white/90">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom note */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-[11px] text-white/50 font-mono">
              © 2026 MediTrack · B.G.T.D. Wijerathne · SEU/IS/20/ICT/055
            </p>
          </div>
        </div>

        {/* ── RIGHT — form panel ── */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Mobile role badge */}
            <div className={`lg:hidden flex items-center gap-3 mb-8 p-4 rounded-2xl bg-gradient-to-r ${cfg.gradient} text-white`}>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {cfg.icon}
              </div>
              <div>
                <p className="font-bold text-sm">{cfg.label}</p>
                <p className="text-[11px] text-white/70">{cfg.description}</p>
              </div>
            </div>

            {/* ── Tabs (only doctor has Register tab) ── */}
            {cfg.canRegister && (
              <div className="flex border-b border-slate-200 mb-6">
                {(['login', 'register'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setLoginError(null); setRegError(null); }}
                    className={`flex-1 pb-3 text-sm font-semibold capitalize border-b-2 transition ${
                      tab === t
                        ? `${cfg.tabActive} border-b-2`
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {tab === 'login' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                  <p className="text-slate-500 text-sm mt-1">Sign in to your {cfg.label}</p>
                </div>

                {/* Demo fill */}
                <button
                  type="button"
                  onClick={fillDemo}
                  className="w-full mb-5 py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                  Fill demo credentials
                </button>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7">
                  <form onSubmit={handleLogin} className="space-y-5" noValidate>
                    {loginError && (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <Field
                      id="login-email" label="Email address" type="email"
                      value={loginEmail} onChange={setLoginEmail}
                      placeholder="you@example.com" icon={<Mail className="w-4 h-4" />}
                      ringColor={cfg.ringColor} autoComplete="email"
                    />

                    <Field
                      id="login-password" label="Password" type={showLoginPass ? 'text' : 'password'}
                      value={loginPassword} onChange={setLoginPassword}
                      placeholder="••••••••" icon={<Lock className="w-4 h-4" />}
                      ringColor={cfg.ringColor} autoComplete="current-password"
                      rightSlot={
                        <button type="button" onClick={() => setShowLoginPass(p => !p)}
                          className="text-slate-400 hover:text-slate-600 transition">
                          {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    <button
                      type="submit"
                      disabled={loginLoading || !loginEmail || !loginPassword}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 ${cfg.btnClass} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition text-sm shadow-sm`}
                    >
                      {loginLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                        : 'Sign in'}
                    </button>
                  </form>
                </div>

                {!cfg.canRegister && (
                  <p className="text-center text-xs text-slate-400 mt-5 leading-relaxed">
                    Accounts are created by your doctor.<br />
                    Contact your care provider if you need access.
                  </p>
                )}
              </div>
            )}

            {/* ── REGISTER FORM (doctor only) ── */}
            {tab === 'register' && cfg.canRegister && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
                  <p className="text-slate-500 text-sm mt-1">{cfg.registerNote}</p>
                </div>

                {regSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                    <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                    <p className="font-bold text-slate-800 text-lg">Account created!</p>
                    <p className="text-slate-500 text-sm">Redirecting to your portal…</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7">
                    <form onSubmit={handleRegister} className="space-y-4" noValidate>
                      {regError && (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{regError}</span>
                        </div>
                      )}

                      <Field
                        id="reg-name" label="Full name" value={regName} onChange={setRegName}
                        placeholder="Dr. John Smith" icon={<User className="w-4 h-4" />}
                        ringColor={cfg.ringColor} autoComplete="name"
                      />
                      <Field
                        id="reg-email" label="Email address" type="email"
                        value={regEmail} onChange={setRegEmail}
                        placeholder="doctor@hospital.com" icon={<Mail className="w-4 h-4" />}
                        ringColor={cfg.ringColor} autoComplete="email"
                      />
                      <Field
                        id="reg-specialty" label="Specialty (optional)" value={regSpecialty}
                        onChange={setRegSpecialty} placeholder="e.g. Cardiology"
                        icon={<Stethoscope className="w-4 h-4" />} ringColor={cfg.ringColor}
                      />
                      <Field
                        id="reg-password" label="Password" type={showRegPass ? 'text' : 'password'}
                        value={regPassword} onChange={setRegPassword}
                        placeholder="Min. 8 characters" icon={<Lock className="w-4 h-4" />}
                        ringColor={cfg.ringColor} autoComplete="new-password"
                        rightSlot={
                          <button type="button" onClick={() => setShowRegPass(p => !p)}
                            className="text-slate-400 hover:text-slate-600 transition">
                            {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                      <Field
                        id="reg-confirm" label="Confirm password"
                        type={showRegPass ? 'text' : 'password'}
                        value={regConfirm} onChange={setRegConfirm}
                        placeholder="Repeat password" icon={<Lock className="w-4 h-4" />}
                        ringColor={cfg.ringColor} autoComplete="new-password"
                      />

                      {/* Registration code */}
                      <div className="space-y-1.5">
                        <label htmlFor="reg-code" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Hospital Registration Code
                        </label>
                        <input
                          id="reg-code" type="text" value={regCode}
                          onChange={e => setRegCode(e.target.value)}
                          placeholder="Enter code provided by your hospital"
                          className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${cfg.ringColor} focus:border-transparent transition font-mono`}
                        />
                        <p className="text-[10px] text-slate-400">
                          Demo code: <span className="font-mono font-bold text-slate-600">MEDITRACK_DOCTOR_2026</span>
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={regLoading || !regName || !regEmail || !regPassword || !regConfirm || !regCode}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 ${cfg.btnClass} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition text-sm shadow-sm`}
                      >
                        {regLoading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                          : 'Create Doctor Account'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-100 py-4 text-center text-[11px] text-slate-400 font-mono">
        <p>© 2026 MediTrack Cloud System · B.G.T.D. Wijerathne · SEU/IS/20/ICT/055</p>
      </footer>
    </div>
  );
}
