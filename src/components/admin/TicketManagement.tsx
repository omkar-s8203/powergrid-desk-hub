import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TicketAssignModal } from './TicketAssignModal';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'hardware' | 'software' | 'network' | 'access' | 'other';
  employee_id: string;
  assigned_to?: string;
  created_at: string;
  employee?: {
    full_name: string;
    email: string;
  };
  helpdesk?: {
    full_name: string;
    email: string;
    specialization?: string;
  };
}

export function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          employee:profiles!tickets_employee_id_fkey(full_name, email),
          helpdesk:profiles!tickets_assigned_to_fkey(full_name, email, specialization)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus as any })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryDisplay = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Ticket Management</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="access">Access</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center text-sm text-muted-foreground">
              <Filter className="h-4 w-4 mr-2" />
              {filteredTickets.length} tickets
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div>
                          <p className="truncate">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{ticket.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.employee?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{ticket.employee?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryDisplay(ticket.category)}</TableCell>
                      <TableCell>
          <Select 
            value={ticket.status} 
            onValueChange={(value: 'open' | 'in_progress' | 'resolved' | 'closed') => updateTicketStatus(ticket.id, value)}
          >
                          <SelectTrigger className="w-32">
                            <SelectValue>
                              <Badge className={getStatusBadgeColor(ticket.status)}>
                                {getStatusDisplay(ticket.status)}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {ticket.helpdesk ? (
                          <div>
                            <p className="font-medium">{ticket.helpdesk.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.helpdesk.specialization ? 
                                getCategoryDisplay(ticket.helpdesk.specialization) : 
                                'General'
                              }
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setAssignModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTickets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tickets found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <TicketAssignModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onSuccess={() => {
          fetchTickets();
          setAssignModalOpen(false);
          setSelectedTicket(null);
        }}
      />
    </div>
  );
}