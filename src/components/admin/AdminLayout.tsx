import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import powerGrideLogo from '@/assets/powerGrideLogo.png';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'AI Demo', href: '/admin/demo', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "bg-card border-r border-border transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <img src={powerGrideLogo} alt="POWERGRID Logo" className="h-8 w-8" />
              <span className="font-semibold text-foreground">Admin Panel</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-foreground hover:bg-muted"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground",
                  !sidebarOpen && "px-2",
                  isActive && "bg-muted text-foreground"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className="h-4 w-4" />
                {sidebarOpen && <span className="ml-2">{item.name}</span>}
              </Button>
            );
          })}
        </nav>

        {/* User Profile & Sign Out */}
        <div className="p-4 border-t border-border">
          {sidebarOpen && (
            <div className="mb-3 p-2 bg-muted rounded">
              <p className="text-sm font-medium text-foreground">
                {profile?.full_name}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground",
              !sidebarOpen && "px-2"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-auto">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}