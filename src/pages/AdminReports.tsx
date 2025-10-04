import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TicketAnalytics } from '@/components/analytics/TicketAnalytics';
import { PendingTicketsOverview } from '@/components/admin/PendingTicketsOverview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Users, 
  Ticket, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Download,
  Calendar,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemStats {
  totalUsers: number;
  totalEmployees: number;
  totalHelpdesk: number;
  totalAdmins: number;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  avgResolutionTime: number;
  totalKBArticles: number;
  publishedArticles: number;
  pendingArticles: number;
  ticketResolutionRate: number;
}

interface MonthlyTrend {
  month: string;
  tickets: number;
  resolved: number;
  users: number;
}

interface CategoryPerformance {
  category: string;
  total: number;
  resolved: number;
  avgTime: number;
  rate: number;
}

const AdminReports = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [usersRes, ticketsRes, kbRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('tickets').select('*'),
        supabase.from('knowledge_base').select('*')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (ticketsRes.error) throw ticketsRes.error;
      if (kbRes.error) throw kbRes.error;

      const users = usersRes.data || [];
      const tickets = ticketsRes.data || [];
      const kbArticles = kbRes.data || [];

      // Calculate system stats
      const systemStats: SystemStats = {
        totalUsers: users.length,
        totalEmployees: users.filter(u => u.role === 'employee').length,
        totalHelpdesk: users.filter(u => u.role === 'it_helpdesk').length,
        totalAdmins: users.filter(u => u.role === 'admin').length,
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
        closedTickets: tickets.filter(t => t.status === 'closed').length,
        avgResolutionTime: calculateAvgResolutionTime(tickets),
        totalKBArticles: kbArticles.length,
        publishedArticles: kbArticles.filter(a => a.status === 'published').length,
        pendingArticles: kbArticles.filter(a => a.status === 'pending_approval').length,
        ticketResolutionRate: tickets.length > 0 
          ? Math.round((tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length / tickets.length) * 100)
          : 0
      };

      setStats(systemStats);

      // Calculate monthly trends (last 6 months)
      const trends = calculateMonthlyTrends(tickets, users);
      setMonthlyTrends(trends);

      // Calculate category performance
      const catPerf = calculateCategoryPerformance(tickets);
      setCategoryPerformance(catPerf);

    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgResolutionTime = (tickets: any[]) => {
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at);
      const updated = new Date(ticket.updated_at);
      return sum + (updated.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / resolved.length / (1000 * 60 * 60)); // Hours
  };

  const calculateMonthlyTrends = (tickets: any[], users: any[]) => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      };
    }).reverse();

    return last6Months.map(({ month, monthKey }) => {
      const monthTickets = tickets.filter(t => 
        t.created_at.startsWith(monthKey)
      );
      const monthResolved = tickets.filter(t => 
        (t.status === 'resolved' || t.status === 'closed') && 
        t.updated_at.startsWith(monthKey)
      );
      const monthUsers = users.filter(u => 
        u.created_at.startsWith(monthKey)
      );

      return {
        month,
        tickets: monthTickets.length,
        resolved: monthResolved.length,
        users: monthUsers.length
      };
    });
  };

  const calculateCategoryPerformance = (tickets: any[]) => {
    const categories = ['hardware', 'software', 'network', 'access', 'other'];
    
    return categories.map(category => {
      const categoryTickets = tickets.filter(t => t.category === category);
      const resolved = categoryTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
      
      const avgTime = resolved.length > 0
        ? Math.round(resolved.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at);
            const updated = new Date(ticket.updated_at);
            return sum + (updated.getTime() - created.getTime());
          }, 0) / resolved.length / (1000 * 60 * 60))
        : 0;

      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        total: categoryTickets.length,
        resolved: resolved.length,
        avgTime,
        rate: categoryTickets.length > 0 ? Math.round((resolved.length / categoryTickets.length) * 100) : 0
      };
    }).filter(cat => cat.total > 0);
  };

  const handleExportData = () => {
    if (!stats) return;

    const exportData = {
      generated_at: new Date().toISOString(),
      system_stats: stats,
      monthly_trends: monthlyTrends,
      category_performance: categoryPerformance
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report data exported successfully",
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into ticket management and system performance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
      </AdminLayout>
    );
  }

  if (!stats) return null;

  const statusData = [
    { name: 'Open', value: stats.openTickets, color: 'hsl(var(--destructive))' },
    { name: 'In Progress', value: stats.inProgressTickets, color: 'hsl(var(--primary))' },
    { name: 'Resolved', value: stats.resolvedTickets, color: 'hsl(142 76% 36%)' },
    { name: 'Closed', value: stats.closedTickets, color: 'hsl(var(--muted-foreground))' }
  ];

  const userDistribution = [
    { name: 'Employees', value: stats.totalEmployees, color: 'hsl(var(--primary))' },
    { name: 'IT Helpdesk', value: stats.totalHelpdesk, color: 'hsl(var(--accent))' },
    { name: 'Admins', value: stats.totalAdmins, color: 'hsl(var(--secondary))' }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Export */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into ticket management and system performance.
            </p>
          </div>
          <Button onClick={handleExportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Tabs for different report sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalEmployees} employees, {stats.totalHelpdesk} helpdesk
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTickets}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.openTickets} open, {stats.inProgressTickets} in progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.ticketResolutionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.resolvedTickets + stats.closedTickets} resolved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgResolutionTime}h</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average response time
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Status Distribution</CardTitle>
                  <CardDescription>Current status breakdown of all tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>Distribution of users by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {userDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>6-Month Trends</CardTitle>
                <CardDescription>Ticket and user activity over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="tickets" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Tickets Created"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="resolved" 
                        stroke="hsl(142 76% 36%)" 
                        strokeWidth={2}
                        name="Tickets Resolved"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        name="New Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <PendingTicketsOverview />
            <TicketAnalytics />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance Analysis</CardTitle>
                <CardDescription>Detailed breakdown by ticket category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryPerformance.map((cat, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{cat.category}</h4>
                        <Badge variant="secondary">{cat.total} tickets</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Resolved</p>
                          <p className="font-medium text-green-600">{cat.resolved}/{cat.total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Resolution Rate</p>
                          <p className="font-medium">{cat.rate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Time</p>
                          <p className="font-medium">{cat.avgTime}h</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${cat.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">First Response Time</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.5h</div>
                  <p className="text-xs text-green-600 mt-1">↓ 15% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.5/5</div>
                  <p className="text-xs text-green-600 mt-1">↑ 5% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                  <p className="text-xs text-green-600 mt-1">↑ 3% from last month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalKBArticles}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Knowledge base articles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.publishedArticles}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Live articles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingArticles}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Impact</CardTitle>
                <CardDescription>How knowledge base articles help resolve tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Self-Service Resolution Rate</p>
                      <p className="text-sm text-muted-foreground">Tickets resolved via KB articles</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">28%</p>
                      <p className="text-xs text-green-600">↑ 12% from last month</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Average Article Views</p>
                      <p className="text-sm text-muted-foreground">Per article per month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">156</p>
                      <p className="text-xs text-green-600">↑ 8% from last month</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Helpfulness Rating</p>
                      <p className="text-sm text-muted-foreground">Average user feedback</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">4.3/5</p>
                      <p className="text-xs text-green-600">Positive feedback</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;