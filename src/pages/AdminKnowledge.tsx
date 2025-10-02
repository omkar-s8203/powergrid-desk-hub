import { useAuth } from '@/components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminKnowledgeBase } from '@/components/knowledge/AdminKnowledgeBase';

const AdminKnowledge = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <AdminKnowledgeBase />
    </AdminLayout>
  );
};

export default AdminKnowledge;
