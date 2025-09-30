import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, CheckCircle, Clock } from 'lucide-react';
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

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export function EmployeeDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
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
        .select('status, category')
        .eq('employee_id', profile.id);

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

      // Calculate category data for chart
      const categoryCounts = tickets.reduce((acc, ticket) => {
        acc[ticket.category] = (acc[ticket.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
      const chartData = Object.entries(categoryCounts).map(([category, count], index) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count,
        color: colors[index % colors.length]
      }));

      setCategoryData(chartData);
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
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {profile?.full_name}</h1>
          <p className="text-muted-foreground">Here's an overview of your support tickets</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold group-hover:text-primary transition-colors">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All tickets created</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500 group-hover:text-orange-400 transition-colors">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Waiting for assignment</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500 group-hover:text-blue-400 transition-colors">{stats.in_progress}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 group-hover:text-green-400 transition-colors">{stats.resolved + stats.closed}</div>
            <p className="text-xs text-muted-foreground">Completed tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Chart */}
      {categoryData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-full bg-white/5 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Tickets by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
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
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No tickets yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first support ticket.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}