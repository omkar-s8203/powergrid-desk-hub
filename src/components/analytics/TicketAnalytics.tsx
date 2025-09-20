import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, TrendingUp, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  ticketsByCategory: Array<{ category: string; count: number }>;
  ticketsByStatus: Array<{ status: string; count: number; color: string }>;
  ticketTrends: Array<{ date: string; created: number; resolved: number }>;
  helpdeskPerformance: Array<{ name: string; assigned: number; resolved: number; avg_resolution: number }>;
  employeeIssues: Array<{ name: string; email: string; total_tickets: number; open_tickets: number }>;
  avgResolutionTime: number;
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function TicketAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch tickets data with related profiles
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          employee:profiles!tickets_employee_id_fkey(id, full_name, email),
          assigned_user:profiles!tickets_assigned_to_fkey(id, full_name, specialization)
        `);

      if (error) throw error;

      // Process data for analytics
      const ticketsByCategory = processTicketsByCategory(tickets || []);
      const ticketsByStatus = processTicketsByStatus(tickets || []);
      const ticketTrends = processTicketTrends(tickets || []);
      const helpdeskPerformance = processHelpdeskPerformance(tickets || []);
      const employeeIssues = processEmployeeIssues(tickets || []);
      const avgResolutionTime = calculateAvgResolutionTime(tickets || []);
      
      const totalTickets = tickets?.length || 0;
      const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
      const resolvedToday = tickets?.filter(t => 
        t.status === 'resolved' && 
        new Date(t.updated_at).toDateString() === new Date().toDateString()
      ).length || 0;

      setData({
        ticketsByCategory,
        ticketsByStatus,
        ticketTrends,
        helpdeskPerformance,
        employeeIssues,
        avgResolutionTime,
        totalTickets,
        openTickets,
        resolvedToday,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processTicketsByCategory = (tickets: any[]) => {
    const categoryCount: Record<string, number> = {};
    tickets.forEach(ticket => {
      categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1;
    });
    
    return Object.entries(categoryCount).map(([category, count]) => ({
      category: category.replace('_', ' ').toUpperCase(),
      count
    }));
  };

  const processTicketsByStatus = (tickets: any[]) => {
    const statusCount: Record<string, number> = {};
    tickets.forEach(ticket => {
      statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1;
    });
    
    const statusColors: Record<string, string> = {
      open: 'hsl(var(--destructive))',
      'in_progress': 'hsl(var(--primary))',
      resolved: 'hsl(142 76% 36%)',
      closed: 'hsl(var(--muted-foreground))'
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      status: status.replace('_', ' ').toUpperCase(),
      count,
      color: statusColors[status] || 'hsl(var(--muted))'
    }));
  };

  const processTicketTrends = (tickets: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const created = tickets.filter(t => 
        new Date(t.created_at).toISOString().split('T')[0] === date
      ).length;
      
      const resolved = tickets.filter(t => 
        t.status === 'resolved' && 
        new Date(t.updated_at).toISOString().split('T')[0] === date
      ).length;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created,
        resolved
      };
    });
  };

  const calculateAvgResolutionTime = (tickets: any[]) => {
    const resolvedTickets = tickets.filter(t => t.status === 'resolved');
    if (resolvedTickets.length === 0) return 0;

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at);
      const resolved = new Date(ticket.updated_at);
      return sum + (resolved.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // Convert to hours
  };

  const processHelpdeskPerformance = (tickets: any[]) => {
    const helpdeskMap: Record<string, { assigned: number; resolved: number; resolutionTimes: number[] }> = {};
    
    tickets.forEach(ticket => {
      if (ticket.assigned_user?.full_name) {
        const name = ticket.assigned_user.full_name;
        if (!helpdeskMap[name]) {
          helpdeskMap[name] = { assigned: 0, resolved: 0, resolutionTimes: [] };
        }
        
        helpdeskMap[name].assigned++;
        
        if (ticket.status === 'resolved') {
          helpdeskMap[name].resolved++;
          const resolutionTime = new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime();
          helpdeskMap[name].resolutionTimes.push(resolutionTime);
        }
      }
    });

    return Object.entries(helpdeskMap).map(([name, data]) => ({
      name,
      assigned: data.assigned,
      resolved: data.resolved,
      avg_resolution: data.resolutionTimes.length > 0 
        ? Math.round(data.resolutionTimes.reduce((sum, time) => sum + time, 0) / data.resolutionTimes.length / (1000 * 60 * 60))
        : 0
    }));
  };

  const processEmployeeIssues = (tickets: any[]) => {
    const employeeMap: Record<string, { name: string; email: string; total: number; open: number }> = {};
    
    tickets.forEach(ticket => {
      if (ticket.employee?.full_name) {
        const key = ticket.employee.id;
        if (!employeeMap[key]) {
          employeeMap[key] = {
            name: ticket.employee.full_name,
            email: ticket.employee.email,
            total: 0,
            open: 0
          };
        }
        
        employeeMap[key].total++;
        if (ticket.status === 'open' || ticket.status === 'in_progress') {
          employeeMap[key].open++;
        }
      }
    });

    return Object.values(employeeMap)
      .map(emp => ({
        name: emp.name,
        email: emp.email,
        total_tickets: emp.total,
        open_tickets: emp.open
      }))
      .sort((a, b) => b.total_tickets - a.total_tickets);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.openTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.resolvedToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution (hrs)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgResolutionTime}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ticketsByCategory}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tickets by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.ticketsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="count"
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {data.ticketsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Ticket Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ticket Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.ticketTrends}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="Created"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="hsl(142 76% 36%)" 
                    strokeWidth={2}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}