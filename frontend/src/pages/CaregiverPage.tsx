import { RefreshCw } from 'lucide-react';
import { useData, SESSION } from '../DataContext';
import PageLayout from '../components/PageLayout';
import CaregiverPanel from '../components/CaregiverPanel';

export default function CaregiverPage() {
  const { loading, patients, medications, logs, alerts, fetchAll } = useData();
  const caregiverPatients = patients.filter(p => p.caregiverId === SESSION.caregiver);

  return (
    <PageLayout role="caregiver" alerts={alerts} onRefresh={fetchAll}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          <span className="text-sm font-mono">Loading Caregiver Portal...</span>
        </div>
      ) : (
        <CaregiverPanel
          patients={caregiverPatients}
          medications={medications}
          logs={logs}
          alerts={alerts}
          caregiverId={SESSION.caregiver}
          onRefresh={fetchAll}
        />
      )}
    </PageLayout>
  );
}
