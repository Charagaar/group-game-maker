export const FACT_STORAGE_KEY = "unmap:puzzle-fact";
export const DEFAULT_PUZZLE_FACT =
  "The Rain tree is originally from South America. It was first introduced to Sri Lanka by the British and then travelled to India.";

const normalizeValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const readFactFromStorage = (): string => {
  try {
    return normalizeValue(localStorage.getItem(FACT_STORAGE_KEY));
  } catch {
    return "";
  }
};

export const writeFactToStorage = (fact: string) => {
  try {
    localStorage.setItem(FACT_STORAGE_KEY, normalizeValue(fact));
  } catch {
    // Ignore storage write failures.
  }
};

export const extractFactFromRows = (
  rows: Array<Record<string, unknown>> | null | undefined
): string => {
  if (!rows || rows.length === 0) return "";

  const firstWithFact = rows.find((row) => {
    const fact = normalizeValue(
      (row as { puzzle_fact?: unknown; fact?: unknown }).puzzle_fact ??
        (row as { fact?: unknown }).fact
    );
    return fact.length > 0;
  });

  if (!firstWithFact) return "";

  return normalizeValue(
    (firstWithFact as { puzzle_fact?: unknown; fact?: unknown }).puzzle_fact ??
      (firstWithFact as { fact?: unknown }).fact
  );
};

export const resolveFact = (...candidates: Array<string | null | undefined>): string => {
  for (const candidate of candidates) {
    const fact = normalizeValue(candidate);
    if (fact.length > 0) return fact;
  }

  return DEFAULT_PUZZLE_FACT;
};
