import type { ManualScenarioReviewNote } from "./manualScenarioReviewNotesContract";

const STORAGE_KEY = "nerdeus.manualScenarioReview.notes.v1";

export function readManualScenarioReviewNotes(storage: Storage | null): ManualScenarioReviewNote[] {
  if (storage == null) return [];
  const raw = storage.getItem(STORAGE_KEY);
  if (raw == null) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(isManualScenarioReviewNote)
      : [];
  } catch {
    return [];
  }
}

export function writeManualScenarioReviewNotes(
  storage: Storage | null,
  notes: readonly ManualScenarioReviewNote[]
): ManualScenarioReviewNote[] {
  const next = [...notes];
  if (storage != null) storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function isManualScenarioReviewNote(value: unknown): value is ManualScenarioReviewNote {
  if (value == null || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.mode === "manual_review_note" &&
    typeof record.noteId === "string" &&
    typeof record.scenarioId === "string" &&
    typeof record.text === "string" &&
    typeof record.createdAtIso === "string" &&
    typeof record.updatedAtIso === "string";
}
