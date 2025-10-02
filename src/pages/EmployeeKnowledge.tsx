import { useAuth } from '@/components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { EmployeeLayout } from '@/components/employee/EmployeeLayout';
import { KnowledgeBaseList } from '@/components/knowledge/KnowledgeBaseList';

const EmployeeKnowledge = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !profile || profile.role !== 'employee') {
    return <Navigate to="/" replace />;
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
          <p className="text-muted-foreground">Find solutions to common IT issues</p>
        </div>
        <KnowledgeBaseList />
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeKnowledge;
