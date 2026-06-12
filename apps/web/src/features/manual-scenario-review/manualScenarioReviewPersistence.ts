import {
  createManualScenarioReview,
  validateManualScenarioReviewCollection,
  validateManualScenarioReviewNotes,
  type ManualScenarioContract,
  type ManualScenarioReviewContract
} from "@nerdeus/shared";
import type { ManualScenarioReviewNote } from "./manualScenarioReviewNotesContract";

const STORAGE_KEY = "nerdeus.manualScenarioReviewFoundation.reviews.v1";
const LEGACY_NOTES_STORAGE_KEY = "nerdeus.manualScenarioReview.notes.v1";

export type ManualScenarioReviewPersistencePayload = {
  schemaVersion: "1.0.0";
  reviews: ManualScenarioReviewContract[];
  notes: ManualScenarioReviewNote[];
  retiredNoteIds: string[];
  selectedReviewId: string | null;
};

export function readManualScenarioReviewNotes(
  storage: Storage | null,
  scenarios: readonly ManualScenarioContract[] = []
): ManualScenarioReviewNote[] {
  return readManualScenarioReviewPersistence(storage, scenarios).notes;
}

export function readManualScenarioReviewPersistence(
  storage: Storage | null,
  scenarios: readonly ManualScenarioContract[] = []
): ManualScenarioReviewPersistencePayload {
  const fallback = createManualScenarioReviewPersistencePayload({
    scenarios,
    notes: [],
    retiredNoteIds: [],
    selectedReviewId: null
  });
  if (storage == null) return fallback;
  const raw = storage.getItem(STORAGE_KEY);
  if (raw == null) {
    return readLegacyManualScenarioReviewNotes(storage, scenarios) ?? fallback;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return validateManualScenarioReviewPersistencePayload(parsed, scenarios);
  } catch {
    storage.removeItem(STORAGE_KEY);
    return fallback;
  }
}

export function writeManualScenarioReviewNotes(
  storage: Storage | null,
  notes: readonly ManualScenarioReviewNote[],
  scenarios: readonly ManualScenarioContract[] = [],
  retiredNoteIds: readonly string[] = []
): ManualScenarioReviewNote[] {
  const payload = createManualScenarioReviewPersistencePayload({
    scenarios,
    notes,
    retiredNoteIds,
    selectedReviewId: null
  });
  writeManualScenarioReviewPersistence(storage, payload);
  return payload.notes;
}

export function writeManualScenarioReviewPersistence(
  storage: Storage | null,
  payload: ManualScenarioReviewPersistencePayload
): ManualScenarioReviewPersistencePayload {
  const validated = validateManualScenarioReviewPersistencePayload(payload);
  if (storage != null) storage.setItem(STORAGE_KEY, JSON.stringify(validated));
  return validated;
}

export function createManualScenarioReviewPersistencePayload(input: {
  scenarios: readonly ManualScenarioContract[];
  notes: readonly ManualScenarioReviewNote[];
  retiredNoteIds?: readonly string[];
  selectedReviewId: string | null;
}): ManualScenarioReviewPersistencePayload {
  const scenarioIds = input.scenarios.map((scenario) => scenario.scenarioId);
  const reviews = validateManualScenarioReviewCollection({
    reviews: input.scenarios.map((scenario) => createManualScenarioReview({
      scenarioId: scenario.scenarioId,
      floorplanId: scenario.floorplanId,
      assignmentSetId: scenario.assignmentSetId,
      staffRosterId: scenario.staffRosterId,
      createdAtIso: scenario.createdAtIso,
      updatedAtIso: scenario.updatedAtIso,
      status: "draft"
    })),
    scenarioIds
  });
  const notes = validateManualScenarioReviewNotes({ notes: input.notes, scenarioIds });
  const retiredNoteIds = validateRetiredNoteIds(input.retiredNoteIds ?? [], notes);
  if (input.selectedReviewId != null && !reviews.some((review) => review.reviewId === input.selectedReviewId)) {
    throw new Error("manualScenarioReviewPersistence.selectedReviewId must reference a review");
  }
  return {
    schemaVersion: "1.0.0",
    reviews,
    notes,
    retiredNoteIds,
    selectedReviewId: input.selectedReviewId
  };
}

export function validateManualScenarioReviewPersistencePayload(
  value: unknown,
  scenarios: readonly ManualScenarioContract[] = []
): ManualScenarioReviewPersistencePayload {
  const payload = requireRecord(value, "manualScenarioReviewPersistence");
  requireAllowedKeys(payload, "manualScenarioReviewPersistence", [
    "schemaVersion",
    "reviews",
    "notes",
    "retiredNoteIds",
    "selectedReviewId"
  ]);
  if (payload.schemaVersion !== "1.0.0") {
    throw new Error("manualScenarioReviewPersistence.schemaVersion must be 1.0.0");
  }
  if (!Array.isArray(payload.reviews)) {
    throw new Error("manualScenarioReviewPersistence.reviews must be an array");
  }
  if (!Array.isArray(payload.notes)) {
    throw new Error("manualScenarioReviewPersistence.notes must be an array");
  }
  const scenarioIds = scenarios.length === 0 ? undefined : scenarios.map((scenario) => scenario.scenarioId);
  const reviews = validateManualScenarioReviewCollection({
    reviews: payload.reviews,
    scenarioIds
  });
  const notes = validateManualScenarioReviewNotes({
    notes: payload.notes,
    scenarioIds
  });
  const retiredNoteIds = validateRetiredNoteIds(payload.retiredNoteIds ?? [], notes);
  const selectedReviewId = payload.selectedReviewId == null
    ? null
    : requireString(payload.selectedReviewId, "manualScenarioReviewPersistence.selectedReviewId");
  if (selectedReviewId != null && !reviews.some((review) => review.reviewId === selectedReviewId)) {
    throw new Error("manualScenarioReviewPersistence.selectedReviewId must reference a review");
  }
  return {
    schemaVersion: "1.0.0",
    reviews,
    notes,
    retiredNoteIds,
    selectedReviewId
  };
}

function readLegacyManualScenarioReviewNotes(
  storage: Storage,
  scenarios: readonly ManualScenarioContract[]
): ManualScenarioReviewPersistencePayload | null {
  const raw = storage.getItem(LEGACY_NOTES_STORAGE_KEY);
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const notes = Array.isArray(parsed)
      ? validateManualScenarioReviewNotes({ notes: parsed, scenarioIds: scenarios.map((scenario) => scenario.scenarioId) })
      : [];
    return createManualScenarioReviewPersistencePayload({ scenarios, notes, retiredNoteIds: [], selectedReviewId: null });
  } catch {
    storage.removeItem(LEGACY_NOTES_STORAGE_KEY);
    return null;
  }
}

function validateRetiredNoteIds(
  value: unknown,
  notes: readonly ManualScenarioReviewNote[]
): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error("manualScenarioReviewPersistence.retiredNoteIds must be an array");
  }
  const activeNoteIds = new Set(notes.map((note) => note.noteId));
  const retiredNoteIds = new Set<string>();
  value.forEach((candidate, index) => {
    const noteId = requireString(candidate, `manualScenarioReviewPersistence.retiredNoteIds[${index}]`);
    if (activeNoteIds.has(noteId)) {
      throw new Error("manualScenarioReviewPersistence.retiredNoteIds must not overlap active notes");
    }
    if (retiredNoteIds.has(noteId)) {
      throw new Error(`manualScenarioReviewPersistence.retiredNoteIds[${index}] must be unique`);
    }
    retiredNoteIds.add(noteId);
  });
  return Array.from(retiredNoteIds);
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
