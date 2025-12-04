-- Relax UPDATE check so completed_at (and other fields) can be set when finishing a game
DROP POLICY IF EXISTS "Allow updating incomplete sessions" ON public.game_sessions;

-- Allow updates only while the row is still incomplete, but permit setting completed_at/non-null fields
CREATE POLICY "Allow updating incomplete sessions"
  ON public.game_sessions
  FOR UPDATE
  USING (completed_at IS NULL)
  WITH CHECK (true);
