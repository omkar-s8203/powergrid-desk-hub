import { useEffect, useState } from 'react';
import { EmployeeLayout } from '@/components/employee/EmployeeLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MyTicketData {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  ticketsByCategory: Array<{ category: string; count: number }>;
  ticketTrends: Array<{ date: string; tickets: number }>;
}

const EmployeeReports = () => {
  const [data, setData] = useState<MyTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchMyTicketAnalytics();
    }
  }, [profile]);

  const fetchMyTicketAnalytics = async () => {
    try {
      setLoading(true);

      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('employee_id', profile?.id);

      if (error) throw error;

      const totalTickets = tickets?.length || 0;
      const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
      const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0;

      // Calculate average resolution time
      const resolvedTicketsList = tickets?.filter(t => t.status === 'resolved') || [];
      const avgResolutionTime = resolvedTicketsList.length > 0
        ? Math.round(resolvedTicketsList.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at);
            const resolved = new Date(ticket.updated_at);
            return sum + (resolved.getTime() - created.getTime());
          }, 0) / resolvedTicketsList.length / (1000 * 60 * 60))
        : 0;

      // Process tickets by category
      const categoryCount: Record<string, number> = {};
      tickets?.forEach(ticket => {
        categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1;
      });
      
      const ticketsByCategory = Object.entries(categoryCount).map(([category, count]) => ({
        category: category.replace('_', ' ').toUpperCase(),
        count
      }));

      // Process ticket trends (last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const ticketTrends = last30Days.map(date => {
        const ticketsOnDate = tickets?.filter(t => 
          new Date(t.created_at).toISOString().split('T')[0] === date
        ).length || 0;

        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          tickets: ticketsOnDate
        };
      });

      setData({
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResolutionTime,
        ticketsByCategory,
        ticketTrends,
      });
    } catch (error) {
      console.error('Error fetching my ticket analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load your ticket analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
            <p className="text-muted-foreground">Your personal ticket analytics and insights.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  if (!data) return null;

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
          <p className="text-muted-foreground">Your personal ticket analytics and insights.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{data.openTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Tickets</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.resolvedTickets}</div>
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
          {/* My Tickets by Category */}
          <Card>
            <CardHeader>
              <CardTitle>My Tickets by Category</CardTitle>
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

          {/* My Ticket Creation Trends */}
          <Card>
            <CardHeader>
              <CardTitle>My Ticket Creation Trends (Last 30 Days)</CardTitle>
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
                      dataKey="tickets" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Tickets Created"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeReports;