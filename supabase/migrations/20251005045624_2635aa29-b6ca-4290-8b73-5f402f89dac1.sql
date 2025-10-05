-- Add transfer request tracking to tickets table
ALTER TABLE public.tickets 
ADD COLUMN transfer_requested boolean NOT NULL DEFAULT false,
ADD COLUMN transfer_reason text;

-- Add comment for documentation
COMMENT ON COLUMN public.tickets.transfer_requested IS 'Indicates if IT Helpdesk has requested to transfer this ticket to another member';
COMMENT ON COLUMN public.tickets.transfer_reason IS 'Reason provided by IT Helpdesk for requesting transfer';