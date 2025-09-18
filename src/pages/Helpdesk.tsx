import { useAuth } from '@/components/auth/AuthContext';
import { HelpdeskLayout } from '@/components/helpdesk/HelpdeskLayout';
import { HelpdeskDashboard } from '@/components/helpdesk/HelpdeskDashboard';
import { Navigate } from 'react-router-dom';

export default function Helpdesk() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || profile.role !== 'it_helpdesk') {
    return <Navigate to="/login" replace />;
  }

  return (
    <HelpdeskLayout>
      <HelpdeskDashboard />
    </HelpdeskLayout>
  );
}