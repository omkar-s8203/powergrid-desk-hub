import { useAuth } from '@/components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AIResolutionAnalytics } from '@/components/analytics/AIResolutionAnalytics';

const AdminAIAnalytics = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Resolution Analytics</h1>
          <p className="text-muted-foreground">
            Track chatbot performance, resolution rates, and automation impact
          </p>
        </div>
        <AIResolutionAnalytics />
      </div>
    </AdminLayout>
  );
};

export default AdminAIAnalytics;
