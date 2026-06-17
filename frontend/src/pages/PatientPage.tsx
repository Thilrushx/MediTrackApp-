import { RefreshCw } from 'lucide-react';
import { useData, SESSION } from '../DataContext';
import PageLayout from '../components/PageLayout';
import PatientPanel from '../components/PatientPanel';

export default function PatientPage() {
  const { loading, patients, medications, logs, notes, alerts, fetchAll } = useData();
  const currentPatient = patients.find(p => p.id === SESSION.patient) || null;
  const patientMeds    = medications.filter(m => m.patientId === SESSION.patient);
  const patientLogs    = logs.filter(l => patientMeds.some(m => m.id === l.medicationId));

  return (
    <PageLayout role="patient" alerts={alerts} onRefresh={fetchAll}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-sm font-mono">Loading Patient Portal...</span>
        </div>
      ) : (
        <PatientPanel
          patient={currentPatient}
          medications={patientMeds}
          logs={patientLogs}
          notes={notes}
          onRefresh={fetchAll}
        />
      )}
    </PageLayout>
  );
}
