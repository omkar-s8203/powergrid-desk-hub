import { useAuth } from '@/components/auth/AuthContext';
import { EmployeeLayout } from '@/components/employee/EmployeeLayout';
import { CreateTicketForm } from '@/components/employee/CreateTicketForm';
import { Navigate } from 'react-router-dom';

export default function CreateTicket() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || profile.role !== 'employee') {
    return <Navigate to="/login" replace />;
  }

  return (
    <EmployeeLayout>
      <CreateTicketForm />
    </EmployeeLayout>
  );
}