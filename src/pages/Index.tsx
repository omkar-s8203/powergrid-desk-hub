import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Zap, 
  Users, 
  Headphones, 
  Shield, 
  ArrowRight,
  Ticket,
  Monitor,
  Settings
} from 'lucide-react';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (!loading && user && profile) {
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
      }
    }
  }, [user, profile, loading, navigate]);

  const loginOptions = [
    {
      type: 'admin',
      title: 'Admin Login',
      description: 'Manage users, tickets, and system settings',
      icon: Shield,
      color: 'from-destructive/20 to-destructive/10',
      borderColor: 'border-destructive/20',
      href: '/login/admin'
    },
    {
      type: 'employee',
      title: 'Employee Login',
      description: 'Submit tickets and track support requests',
      icon: Users,
      color: 'from-primary/20 to-primary/10',
      borderColor: 'border-primary/20',
      href: '/login/employee'
    },
    {
      type: 'it_helpdesk',
      title: 'IT Helpdesk Login',
      description: 'Manage and resolve support tickets',
      icon: Headphones,
      color: 'from-accent/40 to-accent/20',
      borderColor: 'border-accent/40',
      href: '/login/it_helpdesk'
    }
  ];

  const features = [
    {
      icon: Ticket,
      title: 'Ticket Management',
      description: 'Streamlined ticket creation and tracking system'
    },
    {
      icon: Monitor,
      title: 'Real-time Updates',
      description: 'Live status updates and notifications'
    },
    {
      icon: Settings,
      title: 'Role-based Access',
      description: 'Secure access control for different user types'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Header */}
      <div className="container mx-auto px-4 pt-8 pb-12">
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center space-x-3">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-lg">
              <Zap className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              PowerGrid HelpDesk
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Centralized IT support system for efficient ticket management and user assistance
          </p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          {loginOptions.map((option) => (
            <Card 
              key={option.type} 
              className={`hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-br ${option.color} ${option.borderColor} border-2 cursor-pointer group`}
              onClick={() => navigate(option.href)}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-background/80 rounded-full w-fit">
                  <option.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">{option.title}</CardTitle>
                <CardDescription className="text-sm">{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full group-hover:bg-primary/90 transition-colors" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(option.href);
                  }}
                >
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">System Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
