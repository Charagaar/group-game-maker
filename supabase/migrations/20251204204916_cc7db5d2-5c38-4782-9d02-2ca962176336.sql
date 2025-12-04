-- Add client_id and puzzle_id columns to game_sessions
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS client_id text,
ADD COLUMN IF NOT EXISTS puzzle_id text;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_client_id ON public.game_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_puzzle_id ON public.game_sessions(puzzle_id);

-- Create view: game_metrics_by_client
CREATE OR REPLACE VIEW public.game_metrics_by_client AS
SELECT 
  client_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE game_won = true) as wins,
  COUNT(*) FILTER (WHERE game_won = false) as losses,
  COUNT(*) FILTER (WHERE completed_at IS NULL) as incomplete,
  ROUND(100.0 * COUNT(*) FILTER (WHERE game_won = true) / NULLIF(COUNT(*) FILTER (WHERE completed_at IS NOT NULL), 0), 1) as win_rate,
  MIN(started_at) as first_session,
  MAX(started_at) as last_session,
  AVG(lives_lost) as avg_lives_lost,
  AVG(categories_solved) as avg_categories_solved
FROM public.game_sessions
WHERE client_id IS NOT NULL
GROUP BY client_id;

-- Create view: game_metrics_daily
CREATE OR REPLACE VIEW public.game_metrics_daily AS
SELECT 
  DATE(started_at) as date,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE game_won = true) as wins,
  COUNT(*) FILTER (WHERE game_won = false) as losses,
  COUNT(*) FILTER (WHERE completed_at IS NULL) as incomplete,
  COUNT(DISTINCT client_id) as unique_clients,
  ROUND(100.0 * COUNT(*) FILTER (WHERE game_won = true) / NULLIF(COUNT(*) FILTER (WHERE completed_at IS NOT NULL), 0), 1) as win_rate
FROM public.game_sessions
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Create view: game_metrics_by_client_puzzle
CREATE OR REPLACE VIEW public.game_metrics_by_client_puzzle AS
SELECT 
  client_id,
  puzzle_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE game_won = true) as wins,
  COUNT(*) FILTER (WHERE game_won = false) as losses,
  COUNT(*) FILTER (WHERE completed_at IS NULL) as incomplete,
  ROUND(100.0 * COUNT(*) FILTER (WHERE game_won = true) / NULLIF(COUNT(*) FILTER (WHERE completed_at IS NOT NULL), 0), 1) as win_rate,
  AVG(lives_lost) as avg_lives_lost
FROM public.game_sessions
WHERE client_id IS NOT NULL AND puzzle_id IS NOT NULL
GROUP BY client_id, puzzle_id;

-- Create view: game_metrics_daily_by_puzzle
CREATE OR REPLACE VIEW public.game_metrics_daily_by_puzzle AS
SELECT 
  DATE(started_at) as date,
  puzzle_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE game_won = true) as wins,
  COUNT(*) FILTER (WHERE game_won = false) as losses,
  COUNT(*) FILTER (WHERE completed_at IS NULL) as incomplete,
  COUNT(DISTINCT client_id) as unique_clients,
  ROUND(100.0 * COUNT(*) FILTER (WHERE game_won = true) / NULLIF(COUNT(*) FILTER (WHERE completed_at IS NOT NULL), 0), 1) as win_rate
FROM public.game_sessions
WHERE puzzle_id IS NOT NULL
GROUP BY DATE(started_at), puzzle_id
ORDER BY date DESC;