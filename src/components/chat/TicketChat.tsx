import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Type definitions for ticket_messages (since not in generated types yet)
interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: {
    full_name: string;
    role: string;
  };
}

// Use the TicketMessage interface defined above
type Message = TicketMessage;

interface TicketChatProps {
  ticketId: string;
  isEmployee?: boolean;
}

export function TicketChat({ ticketId, isEmployee = false }: TicketChatProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticketId) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_ticket_messages', { ticket_id_param: ticketId });

      if (error) throw error;
      setMessages((data as TicketMessage[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Fallback to direct query with type assertion
      try {
        const client = supabase as any;
        const { data: fallbackData, error: fallbackError } = await client
          .from('ticket_messages')
          .select(`
            *,
            sender:profiles!ticket_messages_sender_id_fkey(full_name, role)
          `)
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (fallbackError) throw fallbackError;
        setMessages((fallbackData as TicketMessage[]) || []);
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          // Add the new message to the state
          const newMessage = payload.new as TicketMessage;
          // Fetch sender details
          supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', newMessage.sender_id)
            .single()
            .then(({ data: senderData }) => {
              const messageWithSender: TicketMessage = {
                ...newMessage,
                sender: senderData || { full_name: 'Unknown', role: 'user' }
              };
              setMessages(prev => [...prev, messageWithSender]);
            })
            .catch(err => {
              console.error('Error fetching sender details:', err);
              // Add message without sender details as fallback
              setMessages(prev => [...prev, newMessage]);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile?.id || sending) return;

    setSending(true);
    try {
      // Use RPC function to insert message
      const { error } = await supabase.rpc('insert_ticket_message', {
        p_ticket_id: ticketId,
        p_sender_id: profile.id,
        p_message: newMessage.trim()
      });

      if (error) {
        // Fallback to direct insert with type assertion
        const client = supabase as any;
        const { error: insertError } = await client
          .from('ticket_messages')
          .insert({
            ticket_id: ticketId,
            sender_id: profile.id,
            message: newMessage.trim()
          });

        if (insertError) throw insertError;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const getMessageAlignment = (senderId: string) => {
    return senderId === profile?.id ? 'justify-end' : 'justify-start';
  };

  const getMessageBubbleStyle = (senderId: string) => {
    return senderId === profile?.id
      ? 'bg-primary text-primary-foreground ml-12'
      : 'bg-muted mr-12';
  };

  const getSenderInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            Loading chat...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with {isEmployee ? 'IT Support' : 'Employee'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${getMessageAlignment(message.sender_id)}`}>
                  <div className="flex items-start gap-3 max-w-[80%]">
                    {message.sender_id !== profile?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getSenderInitials(message.sender?.full_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="space-y-1">
                      <div className={`rounded-lg p-3 ${getMessageBubbleStyle(message.sender_id)}`}>
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {message.sender_id !== profile?.id && (
                          <span>{message.sender?.full_name}</span>
                        )}
                        <span>{format(new Date(message.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                    </div>
                    {message.sender_id === profile?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getSenderInitials(profile?.full_name || 'You')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
            />
            <Button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}