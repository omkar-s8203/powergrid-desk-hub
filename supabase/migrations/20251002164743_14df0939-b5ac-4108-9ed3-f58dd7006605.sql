-- Create knowledge_base table
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category ticket_category NOT NULL,
  video_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'pending_approval', 'published')),
  views_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Everyone can view published articles
CREATE POLICY "Everyone can view published knowledge base articles"
ON public.knowledge_base
FOR SELECT
USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins can manage all knowledge base articles"
ON public.knowledge_base
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Helpdesk can create pending articles
CREATE POLICY "Helpdesk can create pending articles"
ON public.knowledge_base
FOR INSERT
WITH CHECK (
  get_current_user_role() = 'it_helpdesk' 
  AND status = 'pending_approval'
  AND created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Helpdesk can view their own pending articles
CREATE POLICY "Helpdesk can view their own pending articles"
ON public.knowledge_base
FOR SELECT
USING (
  created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND get_current_user_role() = 'it_helpdesk'
);

-- Create trigger for updated_at
CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster searches
CREATE INDEX idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX idx_knowledge_base_status ON public.knowledge_base(status);