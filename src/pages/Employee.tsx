import { useAuth } from '@/components/auth/AuthContext';
import { EmployeeLayout } from '@/components/employee/EmployeeLayout';
import { EmployeeDashboard } from '@/components/employee/EmployeeDashboard';
import { Navigate } from 'react-router-dom';

export default function Employee() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || profile.role !== 'employee') {
    return <Navigate to="/login" replace />;
  }

  return (
    <EmployeeLayout>
      <EmployeeDashboard />
    </EmployeeLayout>
  );
}