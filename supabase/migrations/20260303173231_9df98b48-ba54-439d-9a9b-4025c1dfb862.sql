-- Add AI analysis columns to tickets table
ALTER TABLE public.tickets 
ADD COLUMN ai_summary TEXT,
ADD COLUMN sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'frustrated', 'urgent')),
ADD COLUMN sentiment_score NUMERIC(3,2),
ADD COLUMN ai_analyzed_at TIMESTAMP WITH TIME ZONE;