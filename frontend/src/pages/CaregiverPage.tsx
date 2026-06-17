import { RefreshCw } from 'lucide-react';
import { useData, SESSION } from '../DataContext';
import PageLayout from '../components/PageLayout';
import CaregiverPanel from '../components/CaregiverPanel';
import ReportsPanel from '../components/ReportsPanel';

export default function CaregiverPage() {
  const { loading, patients, medications, logs, alerts, reports, fetchAll } = useData();
  const caregiverPatients = patients.filter(p => p.caregiverId === SESSION.caregiver);

  return (
    <PageLayout role="caregiver" alerts={alerts} onRefresh={fetchAll}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          <span className="text-sm font-mono">Loading Caregiver Portal...</span>
        </div>
      ) : (
        <div className="space-y-10">
          <CaregiverPanel
            patients={caregiverPatients}
            medications={medications}
            logs={logs}
            alerts={alerts}
            caregiverId={SESSION.caregiver}
            onRefresh={fetchAll}
          />
          <div className="border-t border-slate-100 pt-8">
            <div className="mb-4">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Patient Medical Records</p>
              <h2 className="text-xl font-bold text-slate-900">Reports</h2>
            </div>
            <ReportsPanel
              role="caregiver"
              patients={caregiverPatients}
              reports={reports.filter(r => caregiverPatients.some(p => p.id === r.patientId))}
              onRefresh={fetchAll}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
}
