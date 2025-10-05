import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const assignSchema = z.object({
  assigned_to: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  resolution_notes: z.string().optional(),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface HelpDeskUser {
  id: string;
  full_name: string;
  email: string;
  specialization?: string;
}

interface Ticket {
  id: string;
  title: string;
  category: string;
  status: string;
  assigned_to?: string;
  resolution_notes?: string;
}

interface TicketAssignModalProps {
  open: boolean;
  onClose: () => void;
  ticket?: Ticket | null;
  onSuccess: () => void;
}

export function TicketAssignModal({ open, onClose, ticket, onSuccess }: TicketAssignModalProps) {
  const [loading, setLoading] = useState(false);
  const [helpDeskUsers, setHelpDeskUsers] = useState<HelpDeskUser[]>([]);
  const { toast } = useToast();

  const form = useForm<AssignFormData>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      assigned_to: 'unassigned',
      status: 'open',
      resolution_notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchHelpDeskUsers();
    }
  }, [open]);

  useEffect(() => {
    if (ticket) {
      form.reset({
        assigned_to: ticket.assigned_to || 'unassigned',
        status: ticket.status as any,
        resolution_notes: ticket.resolution_notes || '',
      });
    }
  }, [ticket, form]);

  const fetchHelpDeskUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, specialization')
        .eq('role', 'it_helpdesk')
        .order('full_name');

      if (error) throw error;
      setHelpDeskUsers(data || []);
    } catch (error) {
      console.error('Error fetching helpdesk users:', error);
      toast({
        title: "Error",
        description: "Failed to load helpdesk users",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: AssignFormData) => {
    if (!ticket) return;

    try {
      setLoading(true);

      const updateData: any = {
        status: data.status,
        resolution_notes: data.resolution_notes || null,
      };

      if (data.assigned_to && data.assigned_to !== 'unassigned') {
        updateData.assigned_to = data.assigned_to;
      } else {
        updateData.assigned_to = null;
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id);

      if (error) throw error;

      // Send status change notification
      if (data.assigned_to) {
        try {
          const { data: assignedProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', data.assigned_to)
            .single();

          await supabase.functions.invoke('notify-ticket-status-change', {
            body: {
              ticket_id: ticket.id,
              status: data.status,
              assigned_to: data.assigned_to,
              assigned_to_email: assignedProfile?.email,
            },
          });
        } catch (webhookError) {
          console.error('Failed to send status change notification:', webhookError);
        }
      }

      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRelevantHelpDeskUsers = () => {
    if (!ticket) return helpDeskUsers;
    
    // Filter users by specialization matching ticket category
    const relevantUsers = helpDeskUsers.filter(user => 
      user.specialization === ticket.category || user.specialization === 'other'
    );
    
    // If no relevant users found, return all helpdesk users
    return relevantUsers.length > 0 ? relevantUsers : helpDeskUsers;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Ticket: {ticket?.title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to IT Helpdesk</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select helpdesk member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {getRelevantHelpDeskUsers().map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col">
                            <span>{user.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.specialization ? 
                                user.specialization.charAt(0).toUpperCase() + user.specialization.slice(1) : 
                                'General'
                              }
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resolution_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add notes about the resolution or progress..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Ticket'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}