import { useAuth } from '@/components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

const Admin = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
};

export default Admin;