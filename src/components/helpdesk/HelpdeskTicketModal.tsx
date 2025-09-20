import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, User, Calendar, Tag, FileText, Play, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TicketChat } from '@/components/chat/TicketChat';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  employee_id: string;
  resolution_notes: string | null;
  employee?: {
    full_name: string;
    email: string;
  };
}

interface HelpdeskTicketModalProps {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdate: () => void;
}

export function HelpdeskTicketModal({ 
  ticket, 
  open, 
  onOpenChange, 
  onTicketUpdate 
}: HelpdeskTicketModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolution_notes || '');
  const { toast } = useToast();

  const updateTicketStatus = async (newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `Ticket status updated to ${newStatus.replace('_', ' ')}`,
      });

      onTicketUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const saveResolutionNotes = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ resolution_notes: resolutionNotes })
        .eq('id', ticket.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Resolution notes saved successfully',
      });

      onTicketUpdate();
    } catch (error) {
      console.error('Error saving resolution notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save resolution notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ticket Management
          </DialogTitle>
          <DialogDescription>
            Manage ticket status and add resolution notes
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Ticket ID: #{ticket.id.slice(-8)}</span>
              </div>
              <h2 className="text-xl font-semibold">{ticket.title}</h2>
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(ticket.status)}
                {getCategoryBadge(ticket.category)}
              </div>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Employee:</span>
                  <div>
                    <div className="font-medium">{ticket.employee?.full_name}</div>
                    <div className="text-xs text-muted-foreground">{ticket.employee?.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Category:</span>
                  <span className="capitalize">{ticket.category}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{format(new Date(ticket.created_at), 'MMM dd, yyyy \'at\' HH:mm')}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{format(new Date(ticket.updated_at), 'MMM dd, yyyy \'at\' HH:mm')}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold">Issue Description</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            <Separator />

            {/* Resolution Notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="resolution-notes" className="font-semibold">
                  Resolution Notes
                </Label>
                <Button
                  onClick={saveResolutionNotes}
                  disabled={isUpdating}
                  size="sm"
                  variant="outline"
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-3 w-3" />
                  )}
                  Save Notes
                </Button>
              </div>
              <Textarea
                id="resolution-notes"
                placeholder="Add resolution notes, steps taken, or solution details..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="min-h-[100px]"
                disabled={isUpdating}
              />
            </div>

            {/* Status Actions */}
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Update Status</h3>
              <div className="flex flex-wrap gap-3">
                {ticket.status === 'open' && (
                  <Button
                    onClick={() => updateTicketStatus('in_progress')}
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Working
                  </Button>
                )}
                
                {ticket.status === 'in_progress' && (
                  <Button
                    onClick={() => updateTicketStatus('resolved')}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Resolved
                  </Button>
                )}

                {(ticket.status === 'resolved' || ticket.status === 'in_progress') && (
                  <Button
                    onClick={() => updateTicketStatus('open')}
                    disabled={isUpdating}
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    Reopen Ticket
                  </Button>
                )}
              </div>
            </div>

            {/* Chat Section */}
            <div className="mt-6">
              <TicketChat ticketId={ticket.id} isEmployee={false} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}