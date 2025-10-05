import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Eye, UserCog, Settings, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  transfer_requested: boolean;
  transfer_reason: string | null;
  employee?: {
    full_name: string;
    email: string;
  };
  assigned_user?: {
    full_name: string;
    specialization: string;
  };
}

interface HelpDeskUser {
  id: string;
  full_name: string;
  specialization: string;
}

export function AdminTicketManagement() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [transferFilter, setTransferFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [helpDeskUsers, setHelpDeskUsers] = useState<HelpDeskUser[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  useEffect(() => {
    fetchTickets();
    fetchHelpDeskUsers();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, categoryFilter, transferFilter]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          employee:profiles!tickets_employee_id_fkey(full_name, email),
          assigned_user:profiles!tickets_assigned_to_fkey(full_name, specialization)
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

  const fetchHelpDeskUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, specialization')
        .eq('role', 'it_helpdesk')
        .order('full_name');

      if (error) throw error;
      setHelpDeskUsers(data || []);
    } catch (error) {
      console.error('Error fetching helpdesk users:', error);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(
        ticket =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    if (transferFilter === 'requested') {
      filtered = filtered.filter(ticket => ticket.transfer_requested === true);
    } else if (transferFilter === 'not_requested') {
      filtered = filtered.filter(ticket => ticket.transfer_requested === false);
    }

    setFilteredTickets(filtered);
  };

  const handleReassign = async () => {
    if (!selectedTicket || !selectedAssignee) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: selectedAssignee === 'unassigned' ? null : selectedAssignee,
          status: selectedAssignee === 'unassigned' ? 'open' : 'in_progress',
          transfer_requested: false,
          transfer_reason: null
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket reassigned successfully",
      });

      setReassignModalOpen(false);
      setSelectedTicket(null);
      setSelectedAssignee('');
      fetchTickets();
    } catch (error) {
      console.error('Error reassigning ticket:', error);
      toast({
        title: "Error",
        description: "Failed to reassign ticket",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Open', className: 'bg-amber-100 text-amber-800' },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      hardware: { label: 'Hardware', className: 'bg-red-100 text-red-800' },
      software: { label: 'Software', className: 'bg-blue-100 text-blue-800' },
      network: { label: 'Network', className: 'bg-green-100 text-green-800' },
      access: { label: 'Access', className: 'bg-yellow-100 text-yellow-800' },
      other: { label: 'Other', className: 'bg-gray-100 text-gray-800' },
    };

    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.other;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading tickets...</div>;
  }

  const transferRequestCount = tickets.filter(t => t.transfer_requested).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Ticket Management</h2>
        <p className="text-muted-foreground">Manage and reassign tickets across the organization</p>
      </div>

      {/* Transfer Requests Alert */}
      {transferRequestCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">
                  {transferRequestCount} Transfer Request{transferRequestCount !== 1 ? 's' : ''} Pending
                </h3>
                <p className="text-sm text-orange-700">
                  IT Helpdesk members have requested ticket reassignments. Review and action them below.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={() => setTransferFilter('requested')}
              >
                View Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets, employees, or helpdesk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
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
            <Select value={transferFilter} onValueChange={setTransferFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Transfer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="requested">Transfer Requested</SelectItem>
                <SelectItem value="not_requested">No Transfer Request</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            All Tickets ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transfer</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    className={ticket.transfer_requested ? 'bg-orange-50/50' : ''}
                  >
                    <TableCell className="font-mono text-sm">
                      #{ticket.id.slice(-8)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {ticket.title}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.employee?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{ticket.employee?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(ticket.category)}
                    </TableCell>
                    <TableCell>
                      {ticket.assigned_user?.full_name || 'Unassigned'}
                      {ticket.assigned_user?.specialization && (
                        <div className="text-sm text-muted-foreground">
                          {ticket.assigned_user.specialization}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(ticket.status)}
                    </TableCell>
                    <TableCell>
                      {ticket.transfer_requested ? (
                        <Badge className="bg-orange-100 text-orange-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Requested
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setReassignModalOpen(true);
                            setSelectedAssignee(ticket.assigned_to || '');
                          }}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reassign Modal */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTicket && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">{selectedTicket.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Employee: {selectedTicket.employee?.full_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Category: {selectedTicket.category}
                </p>
                {selectedTicket.transfer_requested && selectedTicket.transfer_reason && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">Transfer Request</p>
                        <p className="text-sm text-orange-700 mt-1">{selectedTicket.transfer_reason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign to:</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {helpDeskUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setReassignModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReassign}>
                Reassign Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}