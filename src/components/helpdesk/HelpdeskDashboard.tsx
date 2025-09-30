import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, CheckCircle, Clock, AlertCircle, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

export function HelpdeskDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  });
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchTicketStats();
    }
  }, [profile?.id]);

  const fetchTicketStats = async () => {
    if (!profile?.id) return;

    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('status')
        .eq('assigned_to', profile.id);

      if (error) {
        console.error('Error fetching ticket stats:', error);
        return;
      }

      // Calculate status stats
      const statusCounts = tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const newStats = {
        total: tickets.length,
        open: statusCounts.open || 0,
        in_progress: statusCounts.in_progress || 0,
        resolved: statusCounts.resolved || 0,
        closed: statusCounts.closed || 0
      };

      setStats(newStats);

      // Create chart data for status distribution
      const chartData: StatusData[] = [
        { name: 'Open', value: newStats.open, color: '#f59e0b' },
        { name: 'In Progress', value: newStats.in_progress, color: '#3b82f6' },
        { name: 'Resolved', value: newStats.resolved, color: '#10b981' },
        { name: 'Closed', value: newStats.closed, color: '#6b7280' },
      ].filter(item => item.value > 0);

      setStatusData(chartData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {profile?.full_name}</h1>
          <p className="text-muted-foreground">
            IT Helpdesk Dashboard
            {profile?.specialization && (
              <span className="ml-2">
                • <span className="capitalize">{profile.specialization}</span> Specialist
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total assigned to you</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.in_progress}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved + stats.closed}</div>
            <p className="text-xs text-muted-foreground">Completed tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Chart */}
      {statusData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-full bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Ticket Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stats.total === 0 && (
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <Headphones className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No tickets assigned</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You don't have any tickets assigned yet. Check back later or contact your admin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}