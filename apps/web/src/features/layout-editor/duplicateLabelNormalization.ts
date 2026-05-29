export function normalizeDuplicateLabel(input: {
  originalLabel: string;
  existingLabels: readonly string[];
}): string {
  const baseLabel = input.originalLabel
    .trim()
    .replace(/(?:\s+Copy(?:\s+\d+)?)+$/u, "")
    .trim() || "Copy";
  const existing = new Set(input.existingLabels.map((label) => label.trim()));
  const firstCandidate = `${baseLabel} Copy`;
  if (!existing.has(firstCandidate)) {
    return firstCandidate;
  }
  let index = 2;
  let candidate = `${firstCandidate} ${index}`;
  while (existing.has(candidate)) {
    index += 1;
    candidate = `${firstCandidate} ${index}`;
  }
  return candidate;
}
