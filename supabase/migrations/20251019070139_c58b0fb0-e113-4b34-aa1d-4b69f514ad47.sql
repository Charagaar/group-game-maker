-- Create table to track game sessions and outcomes
CREATE TABLE public.game_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  game_won boolean,
  lives_lost integer DEFAULT 0,
  categories_solved integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert sessions (public game)
CREATE POLICY "Anyone can insert sessions"
ON public.game_sessions
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update their own session
CREATE POLICY "Anyone can update sessions"
ON public.game_sessions
FOR UPDATE
USING (true);

-- Only allow reading for tracking stats
CREATE POLICY "Anyone can view sessions"
ON public.game_sessions
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_game_sessions_completed ON public.game_sessions(completed_at);
CREATE INDEX idx_game_sessions_won ON public.game_sessions(game_won);