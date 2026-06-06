export type Difficulty = "easy" | "medium" | "hard" | "expert";

const EMPTY_SLOT = "\u26AA";
const FALLBACK_PLAY_URL = "https://game.un-mapped.com/game/";

const difficultyEmoji: Record<Difficulty, string> = {
  easy: "\u{1F7E1}", // yellow circle
  medium: "\u{1F534}", // red circle (closest to salmon/pink)
  hard: "\u{1F7E2}", // green circle
  expert: "\u{1F7E3}", // purple circle
};

const difficultyOrder: Difficulty[] = ["easy", "medium", "hard", "expert"];

function getPlayUrl() {
  if (typeof window === "undefined" || !window.location?.origin) {
    return FALLBACK_PLAY_URL;
  }

  const overrideBaseUrl = import.meta.env.VITE_SHARE_BASE_URL?.trim();
  if (overrideBaseUrl) {
    try {
      return new URL("/game/", overrideBaseUrl).toString();
    } catch {
      // Ignore invalid override and fall back to browser-derived URL.
    }
  }

  const url = new URL(window.location.origin);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    // WhatsApp opens links outside the local browser context, so localhost links
    // are usually not usable. Default to production unless explicitly overridden.
    return FALLBACK_PLAY_URL;
  }

  return new URL("/game/", url).toString();
}

export function buildSolvedDifficultiesParam(difficulties: Difficulty[]) {
  return difficultyOrder.filter((difficulty) => difficulties.includes(difficulty)).join(",");
}

export function parseSolvedDifficultiesParam(value: string | null): Difficulty[] {
  if (!value) return [];

  const valid = new Set<Difficulty>(difficultyOrder);
  const parsed = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is Difficulty => valid.has(entry as Difficulty));

  return difficultyOrder.filter((difficulty) => parsed.includes(difficulty));
}

export function buildAchievementMessage(score: number, solvedDifficulties: Difficulty[]) {
  const normalizedScore = Math.max(0, Math.min(4, Math.floor(score)));
  const solvedSet = new Set(solvedDifficulties);
  const playUrl = getPlayUrl();
  const emojiRow = difficultyOrder
    .map((difficulty) => (solvedSet.has(difficulty) ? difficultyEmoji[difficulty] : EMPTY_SLOT))
    .join("");

  return `I got ${normalizedScore}/4!
${emojiRow}

How many can you get?
${playUrl}`;
}

export function buildWhatsAppShareUrl(message: string) {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppWebShareUrl(message: string) {
  return `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
