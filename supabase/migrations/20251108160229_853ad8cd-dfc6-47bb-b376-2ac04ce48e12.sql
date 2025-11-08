-- Create table to track AI chatbot resolutions
CREATE TABLE public.chatbot_resolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  issue_type TEXT NOT NULL,
  resolution_method TEXT NOT NULL, -- 'password_reset', 'vpn_guide', 'troubleshooting', 'ticket_created'
  was_resolved_by_ai BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_resolutions ENABLE ROW LEVEL SECURITY;

-- Admin can view all resolutions
CREATE POLICY "Admins can view all chatbot resolutions"
ON public.chatbot_resolutions
FOR SELECT
USING (get_current_user_role() = 'admin');

-- Create index for faster queries
CREATE INDEX idx_chatbot_resolutions_created_at ON public.chatbot_resolutions(created_at);
CREATE INDEX idx_chatbot_resolutions_user_id ON public.chatbot_resolutions(user_id);
CREATE INDEX idx_chatbot_resolutions_issue_type ON public.chatbot_resolutions(issue_type);