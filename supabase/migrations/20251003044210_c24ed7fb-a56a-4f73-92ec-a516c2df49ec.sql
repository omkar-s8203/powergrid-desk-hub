-- Create comments table for knowledge base articles
CREATE TABLE IF NOT EXISTS public.kb_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS on kb_comments
ALTER TABLE public.kb_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments on published articles
CREATE POLICY "Users can view comments on published articles"
ON public.kb_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM knowledge_base kb
    WHERE kb.id = kb_comments.article_id
    AND kb.status = 'published'
  )
);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.kb_comments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.kb_comments
FOR UPDATE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.kb_comments
FOR DELETE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create updated_at trigger for kb_comments
CREATE TRIGGER update_kb_comments_updated_at
BEFORE UPDATE ON public.kb_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_kb_comments_article_id ON public.kb_comments(article_id);
CREATE INDEX idx_kb_comments_user_id ON public.kb_comments(user_id);

-- Create likes table for knowledge base articles
CREATE TABLE IF NOT EXISTS public.kb_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_profile_like FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(article_id, user_id)
);

-- Enable RLS on kb_likes
ALTER TABLE public.kb_likes ENABLE ROW LEVEL SECURITY;

-- Everyone can view likes
CREATE POLICY "Users can view likes"
ON public.kb_likes
FOR SELECT
USING (true);

-- Authenticated users can like articles
CREATE POLICY "Authenticated users can like articles"
ON public.kb_likes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can unlike articles
CREATE POLICY "Users can unlike articles"
ON public.kb_likes
FOR DELETE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_kb_likes_article_id ON public.kb_likes(article_id);
CREATE INDEX idx_kb_likes_user_id ON public.kb_likes(user_id);