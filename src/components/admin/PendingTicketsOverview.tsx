import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, AlertTriangle, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingTicket {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  employee_name: string;
  employee_email: string;
  assigned_to_name?: string;
  days_pending: number;
}

export function PendingTicketsOverview() {
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingTickets();
  }, []);

  const fetchPendingTickets = async () => {
    try {
      setLoading(true);
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          category,
          status,
          created_at,
          employee:profiles!tickets_employee_id_fkey(full_name, email),
          assigned_user:profiles!tickets_assigned_to_fkey(full_name)
        `)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const processedTickets = tickets?.map(ticket => {
        const daysPending = Math.floor(
          (new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          id: ticket.id,
          title: ticket.title,
          category: ticket.category,
          status: ticket.status,
          created_at: ticket.created_at,
          employee_name: ticket.employee?.full_name || 'Unknown',
          employee_email: ticket.employee?.email || 'Unknown',
          assigned_to_name: ticket.assigned_user?.full_name,
          days_pending: daysPending,
        };
      }) || [];

      setPendingTickets(processedTickets);
    } catch (error) {
      console.error('Error fetching pending tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load pending tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      hardware: 'bg-orange-100 text-orange-800 border-orange-200',
      software: 'bg-blue-100 text-blue-800 border-blue-200',
      network: 'bg-purple-100 text-purple-800 border-purple-200',
      access: 'bg-green-100 text-green-800 border-green-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getStatusColor = (status: string) => {
    return status === 'open' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getPriorityLevel = (days: number) => {
    if (days >= 7) return { level: 'High', color: 'text-red-600', icon: AlertTriangle };
    if (days >= 3) return { level: 'Medium', color: 'text-yellow-600', icon: Clock };
    return { level: 'Low', color: 'text-green-600', icon: Clock };
  };

  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
        <CardHeader>
          <CardTitle>Pending Tickets Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Pending Tickets Overview
          <Badge variant="secondary" className="ml-2">
            {pendingTickets.length} tickets
          </Badge>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchPendingTickets}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {pendingTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending tickets! Great job! 🎉</p>
            </div>
          ) : (
            pendingTickets.map((ticket) => {
              const priority = getPriorityLevel(ticket.days_pending);
              const PriorityIcon = priority.icon;
              
              return (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <PriorityIcon className={`h-4 w-4 ${priority.color}`} />
                      <span className={`text-xs font-medium ${priority.color}`}>
                        {priority.level}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{ticket.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {ticket.employee_name}
                        </span>
                        <Calendar className="h-3 w-3 text-muted-foreground ml-2" />
                        <span className="text-xs text-muted-foreground">
                          {ticket.days_pending} days ago
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(ticket.category)} variant="outline">
                      {ticket.category.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)} variant="outline">
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="ml-4">
                    {ticket.assigned_to_name ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {ticket.assigned_to_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {ticket.assigned_to_name}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Unassigned
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}