export type Difficulty = "easy" | "medium" | "hard" | "expert";

const PLAY_URL = "https://game.un-mapped.com/game/";
const EMPTY_SLOT = "\u2B1C";

const difficultyEmoji: Record<Difficulty, string> = {
  easy: "\u{1F7E8}", // yellow square (NYT-style)
  medium: "\u{1F7E5}", // red square (closest to salmon/pink)
  hard: "\u{1F7E9}", // green square
  expert: "\u{1F7EA}", // purple square
};

const difficultyOrder: Difficulty[] = ["easy", "medium", "hard", "expert"];

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
  const emojiRow = difficultyOrder
    .map((difficulty) => (solvedSet.has(difficulty) ? difficultyEmoji[difficulty] : EMPTY_SLOT))
    .join("");

  return `You Got ${normalizedScore}/4!
${emojiRow}

How many can you get?
${PLAY_URL}`;
}

export function buildWhatsAppShareUrl(message: string) {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppWebShareUrl(message: string) {
  return `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
