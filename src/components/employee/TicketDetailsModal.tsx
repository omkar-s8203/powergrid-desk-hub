import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Clock, User, Calendar, Tag, FileText } from 'lucide-react';
import { AIInsights } from '@/components/ticket/AIInsights';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TicketChat } from '@/components/chat/TicketChat';
import { TicketAttachments } from '@/components/ticket/TicketAttachments';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  ai_summary?: string | null;
  sentiment?: string | null;
  sentiment_score?: number | null;
  ai_analyzed_at?: string | null;
  assigned_user?: {
    full_name: string;
  };
}

interface TicketDetailsModalProps {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdate: () => void;
}

export function TicketDetailsModal({ 
  ticket, 
  open, 
  onOpenChange, 
  onTicketUpdate 
}: TicketDetailsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Open', variant: 'secondary' as const, color: 'text-orange-600' },
      in_progress: { label: 'In Progress', variant: 'default' as const, color: 'text-blue-600' },
      resolved: { label: 'Resolved', variant: 'outline' as const, color: 'text-green-600' },
      closed: { label: 'Closed', variant: 'outline' as const, color: 'text-gray-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
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

  const handleCloseTicket = async () => {
    if (ticket.status === 'closed') return;

    setIsClosing(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'closed' })
        .eq('id', ticket.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Ticket has been closed successfully',
      });

      onTicketUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to close ticket. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsClosing(false);
    }
  };

  const canCloseTicket = ticket.status === 'resolved' || ticket.status === 'in_progress';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ticket Details
          </DialogTitle>
          <DialogDescription>
            View and manage this support ticket
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

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span>{ticket.assigned_user?.full_name || 'Unassigned'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Category:</span>
                  <span className="capitalize">{ticket.category}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* AI Insights */}
            <AIInsights
              ticketId={ticket.id}
              aiSummary={ticket.ai_summary}
              sentiment={ticket.sentiment}
              sentimentScore={ticket.sentiment_score}
              analyzedAt={ticket.ai_analyzed_at}
              onAnalysisComplete={onTicketUpdate}
            />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold">Description</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            <Separator />

            {/* Attachments */}
            <div className="space-y-3">
              <TicketAttachments ticketId={ticket.id} />
            </div>

            {/* Actions */}
            {canCloseTicket && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Close Ticket</h4>
                    <p className="text-sm text-muted-foreground">
                      Mark this ticket as closed if your issue has been resolved.
                    </p>
                  </div>
                  <Button
                    onClick={handleCloseTicket}
                    disabled={isClosing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isClosing ? 'Closing...' : 'Close Ticket'}
                  </Button>
                </div>
              </>
            )}

            {/* Chat Section */}
            <div className="mt-6">
              <TicketChat ticketId={ticket.id} isEmployee={true} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}