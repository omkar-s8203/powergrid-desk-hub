import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Headphones, Ticket, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalEmployees: number;
  totalItHelpdesk: number;
  openTickets: number;
  closedTickets: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalItHelpdesk: 0,
    openTickets: 0,
    closedTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Get user counts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');

      // Get ticket counts
      const { data: tickets } = await supabase
        .from('tickets')
        .select('status');

      if (profiles) {
        const employees = profiles.filter(p => p.role === 'employee').length;
        const itHelpdesk = profiles.filter(p => p.role === 'it_helpdesk').length;
        
        setStats(prev => ({
          ...prev,
          totalEmployees: employees,
          totalItHelpdesk: itHelpdesk,
        }));
      }

      if (tickets) {
        const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
        const closedTickets = tickets.filter(t => t.status === 'resolved').length;
        
        setStats(prev => ({
          ...prev,
          openTickets,
          closedTickets,
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'IT Helpdesk Staff',
      value: stats.totalItHelpdesk,
      icon: Headphones,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Open Tickets', 
      value: stats.openTickets,
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Resolved Tickets',
      value: stats.closedTickets,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">PowerGrid Helpdesk Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Manage Users</span>
                </div>
              </Card>
              <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">View Tickets</span>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Authentication</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Service</span>
                <span className="text-sm font-medium text-green-600">Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}