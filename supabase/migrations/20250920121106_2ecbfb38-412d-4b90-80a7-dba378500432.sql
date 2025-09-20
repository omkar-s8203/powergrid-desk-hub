-- Create ticket_messages table for chat functionality
CREATE TABLE public.ticket_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on ticket_messages
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for ticket_messages
CREATE POLICY "Users can view messages for tickets they have access to" 
ON public.ticket_messages 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.tickets t 
        WHERE t.id = ticket_id 
        AND (
            -- Employee can see messages for their own tickets
            t.employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            -- IT helpdesk can see messages for tickets assigned to them  
            OR t.assigned_to IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            -- Admins can see all messages
            OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
        )
    )
);

CREATE POLICY "Users can create messages for tickets they have access to" 
ON public.ticket_messages 
FOR INSERT 
WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.tickets t 
        WHERE t.id = ticket_id 
        AND (
            -- Employee can send messages for their own tickets
            t.employee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            -- IT helpdesk can send messages for tickets assigned to them
            OR t.assigned_to IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            -- Admins can send messages for all tickets
            OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
        )
    )
);

-- Add trigger for updated_at
CREATE TRIGGER update_ticket_messages_updated_at
    BEFORE UPDATE ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for ticket_messages
ALTER TABLE public.ticket_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;