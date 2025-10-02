import { useAuth } from '@/components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { HelpdeskLayout } from '@/components/helpdesk/HelpdeskLayout';
import { HelpdeskKnowledgeBase } from '@/components/knowledge/HelpdeskKnowledgeBase';

const HelpdeskKnowledge = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !profile || profile.role !== 'it_helpdesk') {
    return <Navigate to="/" replace />;
  }

  return (
    <HelpdeskLayout>
      <HelpdeskKnowledgeBase />
    </HelpdeskLayout>
  );
};

export default HelpdeskKnowledge;
