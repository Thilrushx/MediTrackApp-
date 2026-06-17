import { Link } from 'react-router-dom';
import { HeartPulse, Stethoscope, UserCheck, User, ArrowRight, Activity, Shield } from 'lucide-react';

const ROLES = [
  {
    to:          '/doctor',
    label:       'Doctor Portal',
    sub:         'Dr. Evans',
    description: 'Manage patients, prescribe medications, view adherence dashboards and resolve escalation alerts.',
    icon:        <Stethoscope className="w-8 h-8" />,
    features:    ['Create & manage patients', 'Prescribe medications', 'Dashboard & analytics', 'Resolve alerts'],
    gradient:    'from-blue-600 to-indigo-600',
    border:      'border-blue-100 hover:border-blue-300',
    dot:         'bg-blue-500',
    btn:         'bg-blue-600 hover:bg-blue-700',
  },
  {
    to:          '/caregiver',
    label:       'Caregiver Portal',
    sub:         'Sarah Peterson',
    description: 'View assigned patients, monitor their medication schedules and track daily dose adherence.',
    icon:        <UserCheck className="w-8 h-8" />,
    features:    ['View assigned patients', 'Monitor medications', 'Track adherence', 'Resolve missed dose alerts'],
    gradient:    'from-purple-600 to-violet-600',
    border:      'border-purple-100 hover:border-purple-300',
    dot:         'bg-purple-500',
    btn:         'bg-purple-600 hover:bg-purple-700',
  },
  {
    to:          '/patient',
    label:       'Patient Portal',
    sub:         'William Johnson',
    description: "View your daily medication schedule, mark doses as taken or missed and submit personal health notes.",
    icon:        <User className="w-8 h-8" />,
    features:    ["Today's dose schedule", 'Medication history', 'Submit health notes', 'View AI risk analysis'],
    gradient:    'from-emerald-600 to-teal-600',
    border:      'border-emerald-100 hover:border-emerald-300',
    dot:         'bg-emerald-500',
    btn:         'bg-emerald-600 hover:bg-emerald-700',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">

      {/* Minimal top bar */}
      <header className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-sm px-4 md:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow shadow-teal-200">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Medi<span className="text-teal-600">Track</span></span>
            <span className="ml-2 text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded">AI Adherence</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-14 pb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200 mb-6">
          <HeartPulse className="w-9 h-9 animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
          AI-Powered Medication<br />
          <span className="text-teal-600">Adherence Tracker</span>
        </h1>
        <p className="mt-4 text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
          Cloud healthcare platform for patients, caregivers and doctors to track medication adherence in real time.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          {[
            { icon: <Activity className="w-3.5 h-3.5" />,   label: 'Real-time Monitoring' },
            { icon: <Shield className="w-3.5 h-3.5" />,     label: 'Escalation Alerts' },
            { icon: <HeartPulse className="w-3.5 h-3.5" />, label: 'Adherence Analytics' },
          ].map(b => (
            <span key={b.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
              {b.icon} {b.label}
            </span>
          ))}
        </div>
      </section>

      {/* Role cards */}
      <section className="w-full max-w-5xl mx-auto px-4 md:px-8 pb-16">
        <p className="text-center text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-8">
          Select your portal to continue
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map(r => (
            <div key={r.to}
              className={`bg-white rounded-3xl border-2 ${r.border} shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group`}>

              <div className={`bg-gradient-to-br ${r.gradient} p-6 text-white`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-white/20 rounded-xl">{r.icon}</div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/20 border border-white/30">
                    {r.sub}
                  </span>
                </div>
                <h2 className="text-lg font-bold">{r.label}</h2>
                <p className="text-xs mt-1 opacity-80 leading-relaxed">{r.description}</p>
              </div>

              <div className="p-5 flex-1">
                <ul className="space-y-2">
                  {r.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-slate-600">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.dot}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-5 pb-5">
                <Link to={r.to}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 ${r.btn} text-white text-xs font-bold rounded-xl transition shadow-sm group-hover:gap-3`}>
                  Enter {r.label.split(' ')[0]} Portal
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto bg-white border-t border-slate-100 py-5 text-center text-[11px] text-slate-400 font-mono">
        <p>© 2026 MediTrack Cloud System · B.G.T.D. Wijerathne · SEU/IS/20/ICT/055</p>
        <p className="text-slate-300 mt-0.5">Azure SQL · Express.js REST API · React + Vite · MySQL Sequelize ORM</p>
      </footer>
    </div>
  );
}
