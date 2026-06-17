import { RefreshCw } from 'lucide-react';
import { useData }   from '../DataContext';
import { useAuth }   from '../AuthContext';
import PageLayout    from '../components/PageLayout';
import DoctorPanel   from '../components/DoctorPanel';
import ReportsPanel  from '../components/ReportsPanel';

export default function DoctorPage() {
  const { loading, users, patients, medications, logs, alerts, reports, fetchAll } = useData();
  const { user } = useAuth();

  const caregivers     = users.filter(u => u.role === 'caregiver');
  // Show all patients assigned to this doctor
  const doctorPatients = patients.filter(p => p.doctorId === user?.id);

  return (
    <PageLayout role="doctor" alerts={alerts} onRefresh={fetchAll}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-sm font-mono">Loading Doctor Portal…</span>
        </div>
      ) : (
        <div className="space-y-10">
          <DoctorPanel
            patients={doctorPatients}
            medications={medications}
            logs={logs}
            alerts={alerts}
            caregivers={caregivers}
            doctorId={user?.id ?? ''}
            onRefresh={fetchAll}
          />
          <div className="border-t border-slate-100 pt-8">
            <ReportsPanel
              role="doctor"
              patients={doctorPatients}
              reports={reports}
              onRefresh={fetchAll}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
}
