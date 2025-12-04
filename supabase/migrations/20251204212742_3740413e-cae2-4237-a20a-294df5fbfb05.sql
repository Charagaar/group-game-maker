-- Add client_id and puzzle_id columns to game_sessions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_sessions' AND column_name = 'client_id') THEN
    ALTER TABLE public.game_sessions ADD COLUMN client_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_sessions' AND column_name = 'puzzle_id') THEN
    ALTER TABLE public.game_sessions ADD COLUMN puzzle_id text;
  END IF;
END $$;

-- Create view: game_metrics_by_client
CREATE OR REPLACE VIEW public.game_metrics_by_client AS
SELECT 
  client_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE game_won = true) as wins,
  COUNT(*) FILTER (WHERE game_won = false) as losses,
  COUNT(*) FILTER (WHERE game_won IS NULL) as incomplete,
  ROUND(COUNT(*) FILTER (WHERE game_won = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE game_won IS NOT NULL), 0) * 100, 2) as win_rate,
  MIN(started_at) as first_session,
  MAX(started_at) as last_session,
  ROUND(AVG(lives_lost)::numeric, 2) as avg_lives_lost,
  ROUND(AVG(categories_solved)::numeric, 2) as avg_categories_solved
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
  COUNT(*) FILTER (WHERE game_won IS NULL) as incomplete,
  COUNT(DISTINCT client_id) as unique_clients,
  ROUND(COUNT(*) FILTER (WHERE game_won = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE game_won IS NOT NULL), 0) * 100, 2) as win_rate
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
  COUNT(*) FILTER (WHERE game_won IS NULL) as incomplete,
  ROUND(COUNT(*) FILTER (WHERE game_won = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE game_won IS NOT NULL), 0) * 100, 2) as win_rate,
  ROUND(AVG(lives_lost)::numeric, 2) as avg_lives_lost
FROM public.game_sessions
WHERE client_id IS NOT NULL
GROUP BY client_id, puzzle_id;

-- Create view: game_metrics_daily_by_puzzle
CREATE OR REPLACE VIEW public.game_metrics_daily_by_puzzle AS
SELECT 
  DATE(started_at) as date,
  puzzle_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE game_won = true) as wins,
  COUNT(*) FILTER (WHERE game_won = false) as losses,
  COUNT(*) FILTER (WHERE game_won IS NULL) as incomplete,
  COUNT(DISTINCT client_id) as unique_clients,
  ROUND(COUNT(*) FILTER (WHERE game_won = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE game_won IS NOT NULL), 0) * 100, 2) as win_rate
FROM public.game_sessions
GROUP BY DATE(started_at), puzzle_id
ORDER BY date DESC;