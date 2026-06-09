import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";

export type ManualScenarioReviewNoteContract = {
  noteId: string;
  scenarioId: string;
  text: string;
  createdAtIso: string;
  updatedAtIso: string;
  mode: "manual_review_note";
};

const FORBIDDEN_NOTE_PATTERNS: readonly RegExp[] = [
  /\bscore\b/i,
  /\brank(?:ed|ing)?\b/i,
  /\brecommend(?:ed|ation|ations)?\b/i,
  /\bsimulation\b/i,
  /\bclinically?\b/i,
  /\bsafety certification\b/i,
  /\bstaffing compliance\b/i,
  /\bpatient outcome\b/i
];

export function manualScenarioReviewNoteIdFor(input: { scenarioId: string; stableSeed: string }): string {
  return ["manual-review-note", stableIdPart(input.scenarioId), stableIdPart(input.stableSeed)].join(":");
}

export function createManualScenarioReviewNote(input: {
  scenarioId: string;
  text: string;
  createdAtIso: string;
  stableSeed: string;
}): ManualScenarioReviewNoteContract {
  return validateManualScenarioReviewNoteContract({
    noteId: manualScenarioReviewNoteIdFor({ scenarioId: input.scenarioId, stableSeed: input.stableSeed }),
    scenarioId: input.scenarioId,
    text: input.text,
    createdAtIso: input.createdAtIso,
    updatedAtIso: input.createdAtIso,
    mode: "manual_review_note"
  });
}

export function validateManualScenarioReviewNoteContract(value: unknown): ManualScenarioReviewNoteContract {
  const note = requireRecord(value, "manualScenarioReviewNote");
  requireAllowedKeys(note, "manualScenarioReviewNote", [
    "noteId",
    "scenarioId",
    "text",
    "createdAtIso",
    "updatedAtIso",
    "mode"
  ]);
  if (note.mode !== "manual_review_note") {
    throw new Error("manualScenarioReviewNote.mode must be manual_review_note");
  }
  const scenarioId = requireString(note.scenarioId, "manualScenarioReviewNote.scenarioId");
  const text = validateReviewNoteText(requireString(note.text, "manualScenarioReviewNote.text"));
  return {
    noteId: requireString(note.noteId, "manualScenarioReviewNote.noteId"),
    scenarioId,
    text,
    createdAtIso: requireIso(note.createdAtIso, "manualScenarioReviewNote.createdAtIso"),
    updatedAtIso: requireIso(note.updatedAtIso, "manualScenarioReviewNote.updatedAtIso"),
    mode: "manual_review_note"
  };
}

export function validateManualScenarioReviewNotes(input: {
  notes: readonly unknown[];
  scenarioIds?: readonly string[];
}): ManualScenarioReviewNoteContract[] {
  const scenarioIds = input.scenarioIds == null ? null : new Set(input.scenarioIds);
  const noteIds = new Set<string>();
  return input.notes.map((candidate, index) => {
    const note = validateManualScenarioReviewNoteContract(candidate);
    if (noteIds.has(note.noteId)) {
      throw new Error(`manualScenarioReviewNotes[${index}].noteId must be unique`);
    }
    noteIds.add(note.noteId);
    if (scenarioIds != null && !scenarioIds.has(note.scenarioId)) {
      throw new Error(`manualScenarioReviewNotes[${index}].scenarioId must reference an existing scenario`);
    }
    return note;
  });
}

function validateReviewNoteText(text: string): string {
  const trimmed = text.trim();
  validateOperationalRuntimeText(trimmed, "manualScenarioReviewNote.text");
  for (const pattern of FORBIDDEN_NOTE_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new Error("manualScenarioReviewNote.text contains blocked review language");
    }
  }
  return trimmed;
}

function stableIdPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return normalized.length === 0 ? "unnamed" : normalized;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireAllowedKeys(value: Record<string, unknown>, label: string, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireIso(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO date string`);
  }
  return text;
}
