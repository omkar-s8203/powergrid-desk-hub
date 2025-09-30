import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import powerGrideLogo from '@/assets/powerGrideLogo.png';
import heroPowergrid from '@/assets/hero-powergrid.jpg';
import { ArrowLeft } from 'lucide-react';

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

  const getTitle = () => {
    switch (userType) {
      case 'admin':
        return 'Admin Portal';
      case 'employee':
        return 'Employee Login';
      case 'it_helpdesk':
        return 'IT Helpdesk Login';
      default:
        return 'Login';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background from Index.tsx */}
        <div className="absolute inset-0 z-0">
            <img src={heroPowergrid} alt="PowerGrid IT Infrastructure" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/80 to-green-800/90" />
        </div>

        <div className="relative z-10 w-full max-w-md">
            <Card className="bg-background/80 backdrop-blur-sm border-border/50 shadow-2xl">
                <CardHeader>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <img src={powerGrideLogo} alt="POWERGRID Logo" className="h-8 w-8" />
                            <div className="flex flex-col items-start">
                                <span className="text-lg font-bold text-primary">POWERGRID</span>
                                <span className="text-xs text-muted-foreground -mt-1">IT Sahayata Desk</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">{getTitle()}</h1>
                    </div>
                </CardHeader>
                <CardContent>
                    <LoginForm 
                      userType={userType as 'admin' | 'employee' | 'it_helpdesk'} 
                      onSuccess={handleSuccess} 
                    />
                </CardContent>
            </Card>
            <div className="text-center mt-6">
                <Button variant="ghost" onClick={() => navigate('/')} className="text-white/80 hover:text-white hover:bg-white/10">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>
            </div>
        </div>
    </div>
  );
}