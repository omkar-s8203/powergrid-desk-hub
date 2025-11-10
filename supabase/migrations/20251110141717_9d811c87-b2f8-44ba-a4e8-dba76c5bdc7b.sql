-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false);

-- Create ticket_attachments table
CREATE TABLE public.ticket_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on ticket_attachments
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for ticket_attachments table
-- Employees can view attachments for their own tickets
CREATE POLICY "Employees can view attachments for their tickets"
ON public.ticket_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_attachments.ticket_id
    AND t.employee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- IT Helpdesk can view attachments for assigned tickets
CREATE POLICY "IT Helpdesk can view attachments for assigned tickets"
ON public.ticket_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_attachments.ticket_id
    AND t.assigned_to IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'it_helpdesk'
    )
  )
);

-- Admins can view all attachments
CREATE POLICY "Admins can view all attachments"
ON public.ticket_attachments
FOR SELECT
USING (get_current_user_role() = 'admin');

-- Employees can insert attachments for their tickets
CREATE POLICY "Employees can insert attachments for their tickets"
ON public.ticket_attachments
FOR INSERT
WITH CHECK (
  uploaded_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_attachments.ticket_id
    AND t.employee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Storage policies for ticket-attachments bucket
-- Users can view files for tickets they have access to
CREATE POLICY "Users can view files for their tickets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1 FROM tickets t
    INNER JOIN ticket_attachments ta ON ta.ticket_id = t.id
    WHERE ta.file_path = storage.objects.name
    AND (
      t.employee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR t.assigned_to IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    )
  )
);

-- Employees can upload files for their tickets
CREATE POLICY "Employees can upload files for their tickets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND auth.uid() IS NOT NULL
);

-- Users can delete their own uploaded files
CREATE POLICY "Users can delete their uploaded files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1 FROM ticket_attachments ta
    WHERE ta.file_path = storage.objects.name
    AND ta.uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);