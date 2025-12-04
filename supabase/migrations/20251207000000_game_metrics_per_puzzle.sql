-- Support per-puzzle analytics without losing existing rollups

CREATE OR REPLACE VIEW public.game_metrics_daily_by_puzzle AS
SELECT
  DATE(started_at) AS day,
  puzzle_id,
  COUNT(*) AS sessions,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = TRUE) AS wins,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) AS losses,
  COUNT(*) FILTER (WHERE completed_at IS NULL) AS incomplete,
  -- Total failures: completed losses + incomplete (incomplete games are treated as failed)
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) + 
    COUNT(*) FILTER (WHERE completed_at IS NULL) AS total_failures,
  COUNT(DISTINCT client_id) AS unique_clients,
  AVG(lives_lost) AS avg_lives_lost,
  AVG(categories_solved) AS avg_categories_solved
FROM public.game_sessions
WHERE puzzle_id IS NOT NULL
GROUP BY DATE(started_at), puzzle_id
ORDER BY day DESC;

CREATE OR REPLACE VIEW public.game_metrics_by_client_puzzle AS
SELECT
  puzzle_id,
  client_id,
  COUNT(*) AS sessions,
  COUNT(*) FILTER (WHERE completed_at IS NULL) AS incomplete,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = TRUE) AS wins,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) AS losses,
  -- Total failures: completed losses + incomplete (incomplete games are treated as failed)
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) + 
    COUNT(*) FILTER (WHERE completed_at IS NULL) AS total_failures,
  AVG(lives_lost) AS avg_lives_lost,
  AVG(categories_solved) AS avg_categories_solved,
  MIN(started_at) AS first_seen,
  COALESCE(MAX(completed_at), MAX(started_at)) AS last_seen,
  -- Win rate: wins / total sessions (incomplete games count as failures)
  CASE
    WHEN COUNT(*) > 0 THEN COUNT(*) FILTER (WHERE game_won = TRUE)::numeric / COUNT(*)
    ELSE 0
  END AS win_rate
FROM public.game_sessions
WHERE puzzle_id IS NOT NULL AND client_id IS NOT NULL
GROUP BY puzzle_id, client_id;
