-- Separate in-progress games (< 1 hour old) from abandoned games (>= 1 hour old)
-- This provides more accurate metrics by distinguishing active games from abandoned ones

-- Update game_metrics_by_client view
CREATE OR REPLACE VIEW public.game_metrics_by_client AS
SELECT
  client_id,
  COUNT(*) AS sessions,
  -- In-progress: started less than 1 hour ago and not completed
  COUNT(*) FILTER (
    WHERE completed_at IS NULL 
    AND started_at > NOW() - INTERVAL '1 hour'
  ) AS in_progress,
  -- Abandoned: started 1 hour or more ago and not completed
  COUNT(*) FILTER (
    WHERE completed_at IS NULL 
    AND started_at <= NOW() - INTERVAL '1 hour'
  ) AS abandoned,
  -- Keep incomplete for backward compatibility (in_progress + abandoned)
  COUNT(*) FILTER (WHERE completed_at IS NULL) AS incomplete,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = TRUE) AS wins,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) AS losses,
  -- Total failures: completed losses + abandoned (in-progress games are not yet failures)
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) + 
    COUNT(*) FILTER (
      WHERE completed_at IS NULL 
      AND started_at <= NOW() - INTERVAL '1 hour'
    ) AS total_failures,
  AVG(lives_lost) AS avg_lives_lost,
  AVG(categories_solved) AS avg_categories_solved,
  MIN(started_at) AS first_seen,
  COALESCE(MAX(completed_at), MAX(started_at)) AS last_seen,
  -- Win rate: wins / total sessions (abandoned games count as failures, in-progress don't)
  CASE WHEN COUNT(*) > 0
    THEN COUNT(*) FILTER (WHERE game_won = TRUE)::numeric / COUNT(*)
    ELSE 0 END AS win_rate
FROM public.game_sessions
WHERE client_id IS NOT NULL
GROUP BY client_id;

-- Update game_metrics_daily view
CREATE OR REPLACE VIEW public.game_metrics_daily AS
SELECT
  DATE(started_at) AS day,
  COUNT(*) AS sessions,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = TRUE) AS wins,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) AS losses,
  -- In-progress: started less than 1 hour ago and not completed
  COUNT(*) FILTER (
    WHERE completed_at IS NULL 
    AND started_at > NOW() - INTERVAL '1 hour'
  ) AS in_progress,
  -- Abandoned: started 1 hour or more ago and not completed
  COUNT(*) FILTER (
    WHERE completed_at IS NULL 
    AND started_at <= NOW() - INTERVAL '1 hour'
  ) AS abandoned,
  -- Keep incomplete for backward compatibility
  COUNT(*) FILTER (WHERE completed_at IS NULL) AS incomplete,
  -- Total failures: completed losses + abandoned
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) + 
    COUNT(*) FILTER (
      WHERE completed_at IS NULL 
      AND started_at <= NOW() - INTERVAL '1 hour'
    ) AS total_failures,
  COUNT(DISTINCT client_id) AS unique_clients,
  AVG(lives_lost) AS avg_lives_lost,
  AVG(categories_solved) AS avg_categories_solved
FROM public.game_sessions
GROUP BY DATE(started_at)
ORDER BY day DESC;

-- Update game_metrics_daily_by_puzzle view
CREATE OR REPLACE VIEW public.game_metrics_daily_by_puzzle AS
SELECT
  DATE(started_at) AS day,
  puzzle_id,
  COUNT(*) AS sessions,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = TRUE) AS wins,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) AS losses,
  -- In-progress: started less than 1 hour ago and not completed
  COUNT(*) FILTER (
    WHERE completed_at IS NULL 
    AND started_at > NOW() - INTERVAL '1 hour'
  ) AS in_progress,
  -- Abandoned: started 1 hour or more ago and not completed
  COUNT(*) FILTER (
    WHERE completed_at IS NULL 
    AND started_at <= NOW() - INTERVAL '1 hour'
  ) AS abandoned,
  -- Keep incomplete for backward compatibility
  COUNT(*) FILTER (WHERE completed_at IS NULL) AS incomplete,
  -- Total failures: completed losses + abandoned
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) + 
    COUNT(*) FILTER (
      WHERE completed_at IS NULL 
      AND started_at <= NOW() - INTERVAL '1 hour'
    ) AS total_failures,
  COUNT(DISTINCT client_id) AS unique_clients,
  AVG(lives_lost) AS avg_lives_lost,
  AVG(categories_solved) AS avg_categories_solved
FROM public.game_sessions
WHERE puzzle_id IS NOT NULL
GROUP BY DATE(started_at), puzzle_id
ORDER BY day DESC;

-- Update game_metrics_by_client_puzzle view
CREATE OR REPLACE VIEW public.game_metrics_by_client_puzzle AS
SELECT
  puzzle_id,
  client_id,
  COUNT(*) AS sessions,
  -- In-progress: started less than 1 hour ago and not completed
  COUNT(*) FILTER (
    WHERE completed_at IS NULL 
    AND started_at > NOW() - INTERVAL '1 hour'
  ) AS in_progress,
  -- Abandoned: started 1 hour or more ago and not completed
  COUNT(*) FILTER (
    WHERE completed_at IS NULL 
    AND started_at <= NOW() - INTERVAL '1 hour'
  ) AS abandoned,
  -- Keep incomplete for backward compatibility
  COUNT(*) FILTER (WHERE completed_at IS NULL) AS incomplete,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = TRUE) AS wins,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) AS losses,
  -- Total failures: completed losses + abandoned
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND game_won = FALSE) + 
    COUNT(*) FILTER (
      WHERE completed_at IS NULL 
      AND started_at <= NOW() - INTERVAL '1 hour'
    ) AS total_failures,
  AVG(lives_lost) AS avg_lives_lost,
  AVG(categories_solved) AS avg_categories_solved,
  MIN(started_at) AS first_seen,
  COALESCE(MAX(completed_at), MAX(started_at)) AS last_seen,
  -- Win rate: wins / total sessions (abandoned games count as failures)
  CASE
    WHEN COUNT(*) > 0 THEN COUNT(*) FILTER (WHERE game_won = TRUE)::numeric / COUNT(*)
    ELSE 0
  END AS win_rate
FROM public.game_sessions
WHERE puzzle_id IS NOT NULL AND client_id IS NOT NULL
GROUP BY puzzle_id, client_id;

