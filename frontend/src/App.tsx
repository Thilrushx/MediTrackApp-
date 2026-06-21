import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { DataProvider }          from './DataContext';
import PrivateRoute              from './components/PrivateRoute';
import LoginPage                 from './pages/LoginPage';
import PortalLoginPage           from './pages/PortalLoginPage';
import HomePage                  from './pages/HomePage';
import DoctorPage                from './pages/DoctorPage';
import CaregiverPage             from './pages/CaregiverPage';
import PatientPage               from './pages/PatientPage';
import { UserRole }              from './types';

// ── Role-aware root redirect ──────────────────────────────────────────────────
// After login the user lands on "/" → redirect them to their portal automatically
function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null; // PrivateRoute handles the spinner

  if (!isAuthenticated) return <HomePage />;

  const ROLE_HOME: Record<UserRole, string> = {
    doctor:    '/doctor',
    caregiver: '/caregiver',
    patient:   '/patient',
  };
  return <Navigate to={ROLE_HOME[user!.role]} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/login/:role"  element={<PortalLoginPage />} />

          {/* Root — shows home or redirects to role portal if logged in */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected portals */}
          <Route
            path="/doctor"
            element={
              <PrivateRoute roles={['doctor']}>
                <DoctorPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/caregiver"
            element={
              <PrivateRoute roles={['caregiver']}>
                <CaregiverPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/patient"
            element={
              <PrivateRoute roles={['patient']}>
                <PatientPage />
              </PrivateRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DataProvider>
    </AuthProvider>
  );
}
