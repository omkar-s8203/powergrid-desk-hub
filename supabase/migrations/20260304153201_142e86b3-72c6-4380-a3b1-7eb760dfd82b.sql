
-- Store all chatbot conversation messages
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Store AI-generated conversation tone analysis per session
CREATE TABLE public.chat_session_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  tone text NOT NULL,
  tone_score numeric,
  summary text,
  message_count integer DEFAULT 0,
  analyzed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_session_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all conversations"
  ON public.chat_conversations FOR SELECT
  USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Users can view own conversations"
  ON public.chat_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all session analyses"
  ON public.chat_session_analysis FOR SELECT
  USING (get_current_user_role() = 'admin'::user_role);

CREATE INDEX idx_chat_conversations_user ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_session ON public.chat_conversations(session_id);
CREATE INDEX idx_chat_session_analysis_user ON public.chat_session_analysis(user_id);
