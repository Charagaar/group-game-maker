// Minimal client-side tracking for return usage and outcomes

export type PlayRecord = {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  won?: boolean;
  livesLost?: number;
  categoriesSolved?: number;
};

export type PuzzleStats = {
  firstSeenAt: string;
  lastSeenAt: string;
  plays: PlayRecord[];
  wins: number;
  losses: number;
};

export type TrackerState = {
  version: 1;
  clientId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  totalPlays: number;
  wins: number;
  losses: number;
  lastPuzzleId?: string;
  perPuzzle: Record<string, PuzzleStats>;
};

const STORAGE_KEY = "unmap.tracker.v1";

function nowISO() {
  return new Date().toISOString();
}

function load(): TrackerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackerState) : null;
  } catch {
    return null;
  }
}

function save(state: TrackerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore write errors
  }
}

export function getClientId(): string {
  const existing = load();
  if (existing?.clientId) return existing.clientId;
  const fresh: TrackerState = {
    version: 1,
    clientId: crypto.randomUUID(),
    firstSeenAt: nowISO(),
    lastSeenAt: nowISO(),
    totalPlays: 0,
    wins: 0,
    losses: 0,
    perPuzzle: {},
  };
  save(fresh);
  return fresh.clientId;
}

function ensureState(): TrackerState {
  const existing = load();
  if (existing) return existing;
  // initialize with clientId
  const state: TrackerState = {
    version: 1,
    clientId: crypto.randomUUID(),
    firstSeenAt: nowISO(),
    lastSeenAt: nowISO(),
    totalPlays: 0,
    wins: 0,
    losses: 0,
    perPuzzle: {},
  };
  save(state);
  return state;
}

// Tiny deterministic hash for current puzzle definition (no crypto APIs needed)
export function fingerprintPuzzle(categories: { name: string; words: string[] }[]): string {
  // Normalize and build a string; order of categories is preserved as received from DB
  const normalized = categories
    .map((c) => `${c.name}|${c.words.join(',')}`)
    .join('||');
  // djb2 hash
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  // Return as base36 for brevity
  return `pz-${(hash >>> 0).toString(36)}`;
}

export function startPlay(sessionId: string, puzzleId: string) {
  const state = ensureState();
  state.lastSeenAt = nowISO();
  state.lastPuzzleId = puzzleId;
  if (!state.perPuzzle[puzzleId]) {
    state.perPuzzle[puzzleId] = {
      firstSeenAt: state.lastSeenAt,
      lastSeenAt: state.lastSeenAt,
      plays: [],
      wins: 0,
      losses: 0,
    };
  }
  const bucket = state.perPuzzle[puzzleId];
  bucket.lastSeenAt = state.lastSeenAt;
  bucket.plays.push({ sessionId, startedAt: state.lastSeenAt });
  state.totalPlays += 1;
  save(state);
}

export function completePlay(
  sessionId: string,
  puzzleId: string,
  won: boolean,
  livesLost: number,
  categoriesSolved: number
) {
  const state = ensureState();
  const bucket = state.perPuzzle[puzzleId];
  if (!bucket) return; // not started or cleared
  // Find last matching session record (most recent)
  for (let i = bucket.plays.length - 1; i >= 0; i--) {
    const p = bucket.plays[i];
    if (p.sessionId === sessionId && !p.completedAt) {
      p.completedAt = nowISO();
      p.won = won;
      p.livesLost = livesLost;
      p.categoriesSolved = categoriesSolved;
      break;
    }
  }
  if (won) state.wins += 1; else state.losses += 1;
  if (won) bucket.wins += 1; else bucket.losses += 1;
  save(state);
}

export function getTrackerSummary() {
  return load();
}

