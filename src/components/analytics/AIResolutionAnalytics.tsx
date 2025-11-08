import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Bot, CheckCircle, TrendingUp, Zap } from 'lucide-react';

interface ResolutionStats {
  totalInteractions: number;
  aiResolved: number;
  ticketsCreated: number;
  resolutionRate: number;
  issueBreakdown: { name: string; value: number }[];
  methodBreakdown: { name: string; value: number }[];
}

export function AIResolutionAnalytics() {
  const [stats, setStats] = useState<ResolutionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_resolutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const totalInteractions = data.length;
        const aiResolved = data.filter(r => r.was_resolved_by_ai).length;
        const ticketsCreated = data.filter(r => r.resolution_method === 'ticket_created').length;
        const resolutionRate = totalInteractions > 0 ? (aiResolved / totalInteractions) * 100 : 0;

        // Issue type breakdown
        const issueTypes: Record<string, number> = {};
        data.forEach(r => {
          issueTypes[r.issue_type] = (issueTypes[r.issue_type] || 0) + 1;
        });

        // Resolution method breakdown
        const methods: Record<string, number> = {};
        data.forEach(r => {
          const methodName = r.resolution_method === 'password_reset' ? 'Password Reset' 
            : r.resolution_method === 'vpn_guide' ? 'VPN Guide'
            : r.resolution_method === 'troubleshooting' ? 'Troubleshooting'
            : 'Ticket Created';
          methods[methodName] = (methods[methodName] || 0) + 1;
        });

        setStats({
          totalInteractions,
          aiResolved,
          ticketsCreated,
          resolutionRate,
          issueBreakdown: Object.entries(issueTypes).map(([name, value]) => ({ name, value })),
          methodBreakdown: Object.entries(methods).map(([name, value]) => ({ name, value }))
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInteractions}</div>
            <p className="text-xs text-muted-foreground">
              AI chatbot conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aiResolved}</div>
            <p className="text-xs text-muted-foreground">
              Issues solved automatically
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolutionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Self-service success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Saved</CardTitle>
            <Zap className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.aiResolved}</div>
            <p className="text-xs text-muted-foreground">
              Manual tickets prevented
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Common Issues Resolved</CardTitle>
            <CardDescription>Breakdown by issue type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.issueBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolution Methods</CardTitle>
            <CardDescription>How issues were handled</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.methodBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {stats.methodBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Impact</CardTitle>
          <CardDescription>Benefits of AI-powered self-service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Tickets Avoided</span>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {stats.aiResolved} saved
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Manual Workload Reduced</span>
              <Badge variant="secondary">
                {stats.resolutionRate.toFixed(0)}% automated
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Estimated Time Saved</span>
              <Badge variant="secondary">
                ~{(stats.aiResolved * 15).toFixed(0)} minutes
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
