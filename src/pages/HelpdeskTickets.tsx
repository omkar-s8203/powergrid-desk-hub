import { useAuth } from '@/components/auth/AuthContext';
import { HelpdeskLayout } from '@/components/helpdesk/HelpdeskLayout';
import { AssignedTickets } from '@/components/helpdesk/AssignedTickets';
import { Navigate } from 'react-router-dom';

export default function HelpdeskTickets() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || profile.role !== 'it_helpdesk') {
    return <Navigate to="/login" replace />;
  }

  return (
    <HelpdeskLayout>
      <AssignedTickets />
    </HelpdeskLayout>
  );
}