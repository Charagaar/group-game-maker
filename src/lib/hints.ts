export interface PuzzleHints {
  hint1: string;
  hint2: string;
}

export const DEFAULT_HINTS: PuzzleHints = {
  hint1: "They signify the boundary of KempeGowda's Bengaluru.",
  hint2: "Land Reclaimed.",
};

export const HINTS_STORAGE_KEY = "unmap:puzzle-hints";

const normalizeValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const normalizeHints = (hints: Partial<PuzzleHints> | null | undefined): PuzzleHints => ({
  hint1: normalizeValue(hints?.hint1),
  hint2: normalizeValue(hints?.hint2),
});

export const readHintsFromStorage = (): PuzzleHints => {
  try {
    const raw = localStorage.getItem(HINTS_STORAGE_KEY);
    if (!raw) return { hint1: "", hint2: "" };
    const parsed = JSON.parse(raw) as Partial<PuzzleHints>;
    return normalizeHints(parsed);
  } catch {
    return { hint1: "", hint2: "" };
  }
};

export const writeHintsToStorage = (hints: Partial<PuzzleHints>) => {
  try {
    localStorage.setItem(HINTS_STORAGE_KEY, JSON.stringify(normalizeHints(hints)));
  } catch {
    // Ignore storage write failures.
  }
};

export const extractHintsFromRows = (
  rows: Array<Record<string, unknown>> | null | undefined
): PuzzleHints => {
  if (!rows || rows.length === 0) return { hint1: "", hint2: "" };

  const firstWithHint = rows.find((row) => {
    const hint1 = normalizeValue((row as { hint1?: unknown; hint_1?: unknown }).hint1 ?? (row as { hint_1?: unknown }).hint_1);
    const hint2 = normalizeValue((row as { hint2?: unknown; hint_2?: unknown }).hint2 ?? (row as { hint_2?: unknown }).hint_2);
    return hint1.length > 0 || hint2.length > 0;
  });

  if (!firstWithHint) return { hint1: "", hint2: "" };

  return {
    hint1: normalizeValue(
      (firstWithHint as { hint1?: unknown; hint_1?: unknown }).hint1 ??
        (firstWithHint as { hint_1?: unknown }).hint_1
    ),
    hint2: normalizeValue(
      (firstWithHint as { hint2?: unknown; hint_2?: unknown }).hint2 ??
        (firstWithHint as { hint_2?: unknown }).hint_2
    ),
  };
};

export const resolveHints = (...candidates: Array<Partial<PuzzleHints> | null | undefined>): PuzzleHints => {
  const merged = candidates.reduce(
    (acc, candidate) => {
      const normalized = normalizeHints(candidate);
      return {
        hint1: acc.hint1 || normalized.hint1,
        hint2: acc.hint2 || normalized.hint2,
      };
    },
    { hint1: "", hint2: "" }
  );

  return {
    hint1: merged.hint1 || DEFAULT_HINTS.hint1,
    hint2: merged.hint2 || DEFAULT_HINTS.hint2,
  };
};
