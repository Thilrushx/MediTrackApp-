import { RefreshCw } from 'lucide-react';
import { useData, SESSION } from '../DataContext';
import PageLayout from '../components/PageLayout';
import DoctorPanel from '../components/DoctorPanel';

export default function DoctorPage() {
  const { loading, users, patients, medications, logs, alerts, fetchAll } = useData();
  const caregivers     = users.filter(u => u.role === 'caregiver');
  const doctorPatients = patients.filter(p => p.doctorId === SESSION.doctor);

  return (
    <PageLayout role="doctor" alerts={alerts} onRefresh={fetchAll}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-sm font-mono">Loading Doctor Portal...</span>
        </div>
      ) : (
        <DoctorPanel
          patients={doctorPatients}
          medications={medications}
          logs={logs}
          alerts={alerts}
          caregivers={caregivers}
          doctorId={SESSION.doctor}
          onRefresh={fetchAll}
        />
      )}
    </PageLayout>
  );
}
