import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap } from 'lucide-react';

export default function Login() {
  const { userType } = useParams<{ userType: string }>();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'employee':
          navigate('/employee');
          break;
        case 'it_helpdesk':
          navigate('/helpdesk');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, profile, loading, navigate]);

  if (!['admin', 'employee', 'it_helpdesk'].includes(userType || '')) {
    navigate('/');
    return null;
  }

  const handleSuccess = () => {
    // Navigation will be handled by the useEffect above
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Zap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              PowerGrid HelpDesk
            </h1>
          </div>
        </div>

        {/* Login Form */}
        <LoginForm 
          userType={userType as 'admin' | 'employee' | 'it_helpdesk'} 
          onSuccess={handleSuccess} 
        />

        {/* Back Button */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}