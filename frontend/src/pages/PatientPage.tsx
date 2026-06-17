import { RefreshCw }   from 'lucide-react';
import { useData }      from '../DataContext';
import { useAuth }      from '../AuthContext';
import PageLayout       from '../components/PageLayout';
import PatientPanel     from '../components/PatientPanel';
import ReportsPanel     from '../components/ReportsPanel';

export default function PatientPage() {
  const { loading, patients, medications, logs, notes, alerts, reports, fetchAll } = useData();
  const { user } = useAuth();

  // The JWT payload carries patientId for patient accounts
  const patientId      = user?.patientId ?? '';
  const currentPatient = patients.find(p => p.id === patientId) || null;
  const patientMeds    = medications.filter(m => m.patientId === patientId);
  const patientLogs    = logs.filter(l => patientMeds.some(m => m.id === l.medicationId));
  const patientReports = reports.filter(r => r.patientId === patientId);

  return (
    <PageLayout role="patient" alerts={alerts} onRefresh={fetchAll}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-sm font-mono">Loading Patient Portal…</span>
        </div>
      ) : (
        <div className="space-y-10">
          <PatientPanel
            patient={currentPatient}
            medications={patientMeds}
            logs={patientLogs}
            notes={notes}
            onRefresh={fetchAll}
          />
          <div className="border-t border-slate-100 pt-8">
            <div className="mb-4">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                My Medical Records
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                {currentPatient ? `${currentPatient.name}'s Reports` : 'My Reports'}
              </h2>
            </div>
            <ReportsPanel
              role="patient"
              patients={currentPatient ? [currentPatient] : []}
              reports={patientReports}
              patientId={patientId}
              onRefresh={fetchAll}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
}
