-- Allow updating game sessions only if they are not yet completed
-- This prevents modification of finished games while allowing games in progress to be completed
CREATE POLICY "Allow updating incomplete sessions"
  ON public.game_sessions
  FOR UPDATE
  USING (completed_at IS NULL)
  WITH CHECK (completed_at IS NULL OR completed_at IS NOT NULL);