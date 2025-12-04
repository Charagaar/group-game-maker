-- Add client/puzzle/version metadata to game sessions
ALTER TABLE public.game_sessions
  ADD COLUMN client_id text,
  ADD COLUMN puzzle_id text,
  ADD COLUMN app_version text;

-- Indexes to support analytics queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_client ON public.game_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_puzzle ON public.game_sessions(puzzle_id);

-- Keep updates restricted to in-progress games while allowing the new fields to be set
DROP POLICY IF EXISTS "Allow updating incomplete sessions" ON public.game_sessions;
CREATE POLICY "Allow updating incomplete sessions"
  ON public.game_sessions
  FOR UPDATE
  USING (completed_at IS NULL)
  WITH CHECK (completed_at IS NULL);

-- Aggregate metrics per client
CREATE OR REPLACE VIEW public.game_metrics_by_client AS
SELECT
  client_id,
  COUNT(*) AS sessions,
  COUNT(*) FILTER (WHERE completed_at IS NULL) AS incomplete,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = TRUE) AS wins,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) AS losses,
  AVG(lives_lost) AS avg_lives_lost,
  AVG(categories_solved) AS avg_categories_solved,
  MIN(started_at) AS first_seen,
  COALESCE(MAX(completed_at), MAX(started_at)) AS last_seen,
  CASE WHEN COUNT(*) > 0
    THEN COUNT(*) FILTER (WHERE game_won = TRUE)::numeric / COUNT(*)
    ELSE 0 END AS win_rate
FROM public.game_sessions
WHERE client_id IS NOT NULL
GROUP BY client_id;

-- Daily metrics for simple time series
CREATE OR REPLACE VIEW public.game_metrics_daily AS
SELECT
  DATE(started_at) AS day,
  COUNT(*) AS sessions,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = TRUE) AS wins,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) AS losses,
  COUNT(*) FILTER (WHERE completed_at IS NULL) AS incomplete,
  COUNT(DISTINCT client_id) AS unique_clients,
  AVG(lives_lost) AS avg_lives_lost,
  AVG(categories_solved) AS avg_categories_solved
FROM public.game_sessions
GROUP BY DATE(started_at)
ORDER BY day DESC;
