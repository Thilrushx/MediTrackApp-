import { Navigate, useLocation } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';

interface Props {
  /** Roles allowed to access this route. If omitted, any authenticated user is allowed. */
  roles?:    UserRole[];
  children:  React.ReactNode;
}

export default function PrivateRoute({ roles, children }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // While the auth state is being rehydrated from localStorage, show a spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <HeartPulse className="w-10 h-10 text-teal-500 animate-pulse" />
          <span className="text-sm font-mono">Loading…</span>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to /login, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their own portal
  if (roles && user && !roles.includes(user.role)) {
    const ROLE_HOME: Record<UserRole, string> = {
      doctor:    '/doctor',
      caregiver: '/caregiver',
      patient:   '/patient',
    };
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <>{children}</>;
}
