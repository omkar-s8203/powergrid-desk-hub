import { useEffect, useState } from 'react';
import { HelpdeskLayout } from '@/components/helpdesk/HelpdeskLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HelpdeskAnalytics {
  assignedTickets: number;
  resolvedTickets: number;
  inProgressTickets: number;
  avgResolutionTime: number;
  resolutionRate: number;
  ticketsByCategory: Array<{ category: string; count: number }>;
  dailyResolutions: Array<{ date: string; resolved: number }>;
  performanceData: Array<{ metric: string; value: number; target: number }>;
}

const HelpdeskReports = () => {
  const [data, setData] = useState<HelpdeskAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchHelpdeskAnalytics();
    }
  }, [profile]);

  const fetchHelpdeskAnalytics = async () => {
    try {
      setLoading(true);

      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', profile?.id);

      if (error) throw error;

      const assignedTickets = tickets?.length || 0;
      const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0;
      const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;

      // Calculate average resolution time
      const resolvedTicketsList = tickets?.filter(t => t.status === 'resolved') || [];
      const avgResolutionTime = resolvedTicketsList.length > 0
        ? Math.round(resolvedTicketsList.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at);
            const resolved = new Date(ticket.updated_at);
            return sum + (resolved.getTime() - created.getTime());
          }, 0) / resolvedTicketsList.length / (1000 * 60 * 60))
        : 0;

      const resolutionRate = assignedTickets > 0 ? Math.round((resolvedTickets / assignedTickets) * 100) : 0;

      // Process tickets by category
      const categoryCount: Record<string, number> = {};
      tickets?.forEach(ticket => {
        categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1;
      });
      
      const ticketsByCategory = Object.entries(categoryCount).map(([category, count]) => ({
        category: category.replace('_', ' ').toUpperCase(),
        count
      }));

      // Daily resolutions (last 14 days)
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const dailyResolutions = last14Days.map(date => {
        const resolved = tickets?.filter(t => 
          t.status === 'resolved' && 
          new Date(t.updated_at).toISOString().split('T')[0] === date
        ).length || 0;

        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          resolved
        };
      });

      // Performance metrics
      const performanceData = [
        { metric: 'Resolution Rate', value: resolutionRate, target: 85 },
        { metric: 'Avg Response Time', value: Math.min(avgResolutionTime, 100), target: 24 },
        { metric: 'Customer Satisfaction', value: 88, target: 90 }, // Mock data
        { metric: 'First Call Resolution', value: 75, target: 80 }, // Mock data
      ];

      setData({
        assignedTickets,
        resolvedTickets,
        inProgressTickets,
        avgResolutionTime,
        resolutionRate,
        ticketsByCategory,
        dailyResolutions,
        performanceData,
      });
    } catch (error) {
      console.error('Error fetching helpdesk analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load helpdesk analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <HelpdeskLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Performance</h1>
            <p className="text-muted-foreground">Your helpdesk performance metrics and analytics.</p>
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
      </HelpdeskLayout>
    );
  }

  if (!data) return null;

  return (
    <HelpdeskLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Performance</h1>
          <p className="text-muted-foreground">Your helpdesk performance metrics and analytics.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.assignedTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.resolvedTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{data.inProgressTickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.resolutionRate}%</div>
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

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance vs Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.performanceData} layout="horizontal">
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="metric" type="category" width={120} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Current" />
                    <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Daily Resolutions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Daily Resolutions (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyResolutions}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke="hsl(142 76% 36%)" 
                      strokeWidth={2}
                      name="Tickets Resolved"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </HelpdeskLayout>
  );
};

export default HelpdeskReports;