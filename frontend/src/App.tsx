import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './DataContext';
import HomePage       from './pages/HomePage';
import DoctorPage     from './pages/DoctorPage';
import CaregiverPage  from './pages/CaregiverPage';
import PatientPage    from './pages/PatientPage';

export default function App() {
  return (
    <DataProvider>
      <Routes>
        <Route path="/"          element={<HomePage />} />
        <Route path="/doctor"    element={<DoctorPage />} />
        <Route path="/caregiver" element={<CaregiverPage />} />
        <Route path="/patient"   element={<PatientPage />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}
