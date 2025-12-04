# Tracking Research & Implementation Plan

## Current State (as built)
- **Local (browser-only) tracker — `src/lib/tracker.ts`**
  - Identity: `clientId` (UUID) stored in `localStorage` key `unmap.tracker.v1`; never sent to backend.
  - Data stored: overall counters (`firstSeenAt`, `lastSeenAt`, `totalPlays`, `wins`, `losses`, `lastPuzzleId`) and `perPuzzle` buckets keyed by `fingerprintPuzzle` (`pz-<base36>`). Each play stores `sessionId`, `startedAt`, optional `completedAt`, `won`, `livesLost`, `categoriesSolved`.
  - Flow: `getClientId()` initializes state; `startPlay(sessionId, puzzleId)` appends a play and bumps totals; `completePlay(sessionId, puzzleId, won, livesLost, categoriesSolved)` closes the last matching play and bumps wins/losses. No network involved; survives until storage is cleared.
- **Server tracking (Supabase) — `public.game_sessions`**
  - Table (migration `20251019070139...`): `id` (uuid PK), `session_id` (text), `started_at`, `completed_at`, `game_won`, `lives_lost`, `categories_solved`. RLS: public insert/select; updates allowed only while `completed_at IS NULL` (policies adjusted in `20251101190011...` + `20251101190215...`).
  - Flow in `src/components/ConnectionsGame.tsx`: on init, create `session_id` (UUID) and insert row. On win/loss, update the row with outcome fields. No retries; errors are silent. No user/device identifier is sent.
- **Admin analytics UI — `src/pages/Statistics.tsx`**
  - Auth: must be signed in and have `user_roles.role = 'admin'`.
  - Query: `select * from game_sessions` (loads ALL rows - scalability concern).
  - Metrics derived client-side: total rows, wins, losses, incomplete, completion/win rates. No per-user/device aggregation; no time slicing; no charts.

**Gap:** Local `clientId` is never sent to the server; server only stores per-session UUIDs. Cannot link sessions to the same browser/user on the server.

**Note:** Migration `20251205010500_game_sessions_client_metrics.sql` already exists and adds `client_id`, `puzzle_id`, `app_version` columns, indexes, and views. Client code in `ConnectionsGame.tsx` already sends these fields. This plan should focus on completing the implementation (admin UI updates) and addressing gaps.

## Goals
- Link the anonymous browser `clientId` to server `game_sessions` rows.
- Enable admin to see repeat usage, per-client win/loss rates, and time-based engagement.
- Keep data anonymous (no PII).

## Proposed Changes

### 1) Schema (Supabase)
- New migration in `supabase/migrations/`:
  - Add columns to `public.game_sessions`: `client_id text`, `puzzle_id text`, `app_version text`.
  - Indexes: `CREATE INDEX idx_game_sessions_client ON public.game_sessions(client_id);` and optionally `CREATE INDEX idx_game_sessions_puzzle ON public.game_sessions(puzzle_id);`.
  - RLS: keep INSERT/SELECT as-is; update policy still “only while completed_at IS NULL” but allow setting/updating the new columns during that window.
  - Optional view for aggregation:
    - `game_metrics_by_client` with: `client_id`, `sessions`, `wins`, `losses`, `incomplete`, `avg_lives_lost`, `avg_categories_solved`, `first_seen`, `last_seen`, `win_rate` (wins/sessions).
    - Optional `game_metrics_daily` grouping by `date(started_at)` for time series.

### 2) Client wiring (connect local ID to server rows)
- File: `src/components/ConnectionsGame.tsx`
  - In `initializeGame()`:
    - `const clientId = getClientId();` (already imported).
    - Include in insert: `{ session_id: newSessionId, client_id: clientId, puzzle_id: computedPuzzleId, app_version: import.meta.env.VITE_APP_VERSION ?? 'unknown' }`.
  - In win/loss updates:
    - Include `client_id`, `puzzle_id`, `app_version` in the `.update({...})` payload (within the allowed update window).
  - Keep local tracker calls (`startPlay`, `completePlay`) to maintain client-side history.
- File: `src/lib/tracker.ts`
  - No structural change required; ensure exports cover `getClientId`, `fingerprintPuzzle`, `startPlay`, `completePlay`.

### 3) Admin analytics enhancements
- Backend (view/RPC):
  - Use `game_metrics_by_client` view to serve per-client aggregates; ensure `SELECT` is allowed for admins (or public if keeping current open-access model).
- Frontend (`src/pages/Statistics.tsx`):
  - Fetch aggregated totals (can remain simple) and per-client metrics from the new view.
  - New derived metrics/UI:
    - Returning users: count of clients with `sessions > 1`.
    - Sessions per client: mean/median, show distribution buckets.
    - Win rate per client; top/bottom performers (table).
    - Recency: active in last 7d / 30d (based on `last_seen`).
    - (If `puzzle_id` present) win rate per puzzle, avg lives lost per puzzle.
  - UI additions: a “Per-Client Metrics” table (Client ID truncated, Sessions, Wins, Losses, Incomplete, Win Rate, Last Seen) and an “Engagement” summary (returning users, avg sessions/user, active 7d/30d).

### 4) Metrics to expose (initial set)
- Global: total sessions, wins, losses, incomplete, completion rate, win rate.
- Per-client: sessions, wins, losses, incomplete, win rate, first_seen, last_seen, avg lives lost, avg categories solved.
- Engagement/retention: returning users, sessions/user distribution, active last 7/30 days.
- Difficulty (needs `puzzle_id`): win rate per puzzle, avg lives lost per puzzle.
- Quality: failed insert/update counts (optional logging/telemetry later).

### 5) Testing & rollout (verifiable checklist)
- [ ] Apply migration locally.
  - [x] Confirm columns exist: `client_id`, `puzzle_id`, `app_version` on `game_sessions`.
  - [x] Confirm indexes exist: `idx_game_sessions_client` (and `idx_game_sessions_puzzle` if added).
  - [x] Confirm view(s) exist: `game_metrics_by_client` (and `game_metrics_daily` if added).
  - [x] Confirm RLS still allows insert/update while `completed_at IS NULL` and select works.
- [ ] Run the app locally and play through:
  - [ ] Start a session; confirm an inserted row has `client_id`/`puzzle_id`/`app_version`.
  - [ ] Complete a win; confirm row updates outcome fields and retains `client_id`.
  - [ ] Complete a loss; confirm outcome fields and `client_id` present.
- [ ] Validate admin UI with sample/real data:
  - [ ] `Statistics` page loads without errors.
  - [ ] Global totals render correctly.
  - [ ] Per-client table renders and includes `client_id`, sessions, wins, losses, incomplete, win rate, last seen.
  - [ ] Engagement stats (returning users, sessions/user, active 7d/30d) compute and render.
  - [ ] (If `puzzle_id` used) puzzle metrics display.
- [ ] Deploy migration to production.
  - [ ] Confirm production table has new columns and indexes.
  - [ ] Confirm view(s) are present and selectable.
- [ ] Deploy client changes.
  - [ ] Confirm new production rows populate `client_id`/`puzzle_id`/`app_version`.
  - [ ] Spot-check admin page in production for new metrics.

### 6) Privacy notes
- `client_id` remains an anonymous UUID; no PII collected.
- Tracking links sessions to a browser/device only; clearing storage breaks continuity.
- Keep write-once-after-completion to protect integrity of recorded outcomes.
