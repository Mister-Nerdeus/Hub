import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract
} from "@nerdeus/shared";

import type { LayoutEditAuditEntry } from "./layoutEditAuditTrail";
import {
  isLayoutEditorSnapMode,
  normalizeLayoutEditorViewport,
  type LayoutEditorSnapMode,
  type LayoutEditorViewport
} from "./layoutEditorState";

export const LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION = "2.0.0";
export const LAYOUT_LOCAL_DRAFT_LEGACY_STORAGE_KEY = "nerdeus.layoutEditor.localDraft.v1";

export type LayoutLocalDraftStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type LayoutLocalDraftDirtyState = {
  isDirty: boolean;
};

export type LayoutLocalDraftRecord = {
  schemaVersion: typeof LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION;
  recordId: string;
  planId: string;
  sourceKind: "default-json" | "saved-json" | "review-candidate-json";
  parentDefaultPlanId: string | null;
  displayName: string;
  updatedAt: string;
  editableLayout: EditableLayoutGeometryContract;
  snapMode: LayoutEditorSnapMode;
  viewport: LayoutEditorViewport;
  auditTrail: readonly LayoutEditAuditEntry[];
  dirtyState: LayoutLocalDraftDirtyState;
};

export type LoadLayoutLocalDraftResult =
  | { status: "loaded"; draft: LayoutLocalDraftRecord }
  | { status: "empty" | "invalid" | "schema_mismatch" | "wrong_copy"; draft: null };

export type LegacyLayoutLocalDraftResult =
  | { status: "legacy_available"; storageKey: typeof LAYOUT_LOCAL_DRAFT_LEGACY_STORAGE_KEY }
  | { status: "empty" | "invalid" };

export function buildLayoutLocalDraftRecord(input: {
  recordId: string;
  planId: string;
  sourceKind: "default-json" | "saved-json" | "review-candidate-json";
  parentDefaultPlanId: string | null;
  displayName: string;
  updatedAt: string;
  editableLayout: EditableLayoutGeometryContract;
  snapMode: LayoutEditorSnapMode;
  viewport: LayoutEditorViewport;
  auditTrail: readonly LayoutEditAuditEntry[];
  isDirty: boolean;
}): LayoutLocalDraftRecord {
  return {
    schemaVersion: LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION,
    recordId: requireString(input.recordId, "recordId"),
    planId: requireString(input.planId, "planId"),
    sourceKind: requireSourceKind(input.sourceKind),
    parentDefaultPlanId: input.parentDefaultPlanId == null ? null : requireString(input.parentDefaultPlanId, "parentDefaultPlanId"),
    displayName: requireString(input.displayName, "displayName"),
    updatedAt: requireIsoTimestamp(input.updatedAt, "updatedAt"),
    editableLayout: validateEditableLayoutGeometryContract(input.editableLayout),
    snapMode: requireSnapMode(input.snapMode),
    viewport: normalizeLayoutEditorViewport(input.viewport),
    auditTrail: input.auditTrail.map((entry) => ({ ...entry })),
    dirtyState: { isDirty: requireBoolean(input.isDirty, "isDirty") }
  };
}

export function saveLayoutLocalDraft(
  storage: LayoutLocalDraftStorage,
  draft: LayoutLocalDraftRecord
): void {
  const validated = validateLayoutLocalDraftRecord(draft);
  storage.setItem(layoutLocalDraftStorageKey(validated.recordId), JSON.stringify(validated));
}

export function loadLayoutLocalDraft(
  storage: LayoutLocalDraftStorage,
  recordId: string
): LoadLayoutLocalDraftResult {
  const normalizedRecordId = requireString(recordId, "recordId");
  const serialized = storage.getItem(layoutLocalDraftStorageKey(normalizedRecordId));
  if (serialized == null) {
    return { status: "empty", draft: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch (_error) {
    return { status: "invalid", draft: null };
  }

  if (
    parsed == null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    (parsed as { schemaVersion?: unknown }).schemaVersion !== LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION
  ) {
    return { status: "schema_mismatch", draft: null };
  }

  try {
    const draft = validateLayoutLocalDraftRecord(parsed);
    if (draft.recordId !== normalizedRecordId) {
      return { status: "wrong_copy", draft: null };
    }
    return { status: "loaded", draft };
  } catch (_error) {
    return { status: "invalid", draft: null };
  }
}

export function resetLayoutLocalDraft(storage: LayoutLocalDraftStorage, recordId: string): void {
  storage.removeItem(layoutLocalDraftStorageKey(requireString(recordId, "recordId")));
}

export function layoutLocalDraftStorageKey(recordId: string): string {
  return `nerdeus.layoutEditor.localDraft.v2.${requireString(recordId, "recordId")}`;
}

export function inspectLegacyLayoutLocalDraft(storage: LayoutLocalDraftStorage): LegacyLayoutLocalDraftResult {
  const serialized = storage.getItem(LAYOUT_LOCAL_DRAFT_LEGACY_STORAGE_KEY);
  if (serialized == null) {
    return { status: "empty" };
  }
  try {
    JSON.parse(serialized);
    return { status: "legacy_available", storageKey: LAYOUT_LOCAL_DRAFT_LEGACY_STORAGE_KEY };
  } catch {
    return { status: "invalid" };
  }
}

export function validateLayoutLocalDraftRecord(value: unknown): LayoutLocalDraftRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("layout local draft must be an object");
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.schemaVersion !== LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION) {
    throw new Error("layout local draft schema version mismatch");
  }
  if ("history" in candidate) {
    throw new Error("layout local draft must not persist undo redo history");
  }
  if (!Array.isArray(candidate.auditTrail)) {
    throw new Error("layout local draft auditTrail must be an array");
  }
  const dirtyState = requireDirtyState(candidate.dirtyState);

  return {
    schemaVersion: LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION,
    recordId: requireString(candidate.recordId, "recordId"),
    planId: requireString(candidate.planId, "planId"),
    sourceKind: requireSourceKind(candidate.sourceKind),
    parentDefaultPlanId: candidate.parentDefaultPlanId == null ? null : requireString(candidate.parentDefaultPlanId, "parentDefaultPlanId"),
    displayName: requireString(candidate.displayName, "displayName"),
    updatedAt: requireIsoTimestamp(candidate.updatedAt, "updatedAt"),
    editableLayout: validateEditableLayoutGeometryContract(candidate.editableLayout),
    snapMode: requireSnapMode(candidate.snapMode),
    viewport: normalizeLayoutEditorViewport(candidate.viewport as LayoutEditorViewport),
    auditTrail: candidate.auditTrail.map(requireAuditEntry),
    dirtyState
  };
}

function requireDirtyState(value: unknown): LayoutLocalDraftDirtyState {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("layout local draft dirtyState must be an object");
  }
  return {
    isDirty: requireBoolean((value as Record<string, unknown>).isDirty, "dirtyState.isDirty")
  };
}

function requireAuditEntry(value: unknown): LayoutEditAuditEntry {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("layout local draft audit entry must be an object");
  }
  const entry = value as LayoutEditAuditEntry;
  if (typeof entry.editId !== "string" || typeof entry.editType !== "string") {
    throw new Error("layout local draft audit entry is invalid");
  }
  return { ...entry };
}

function requireSnapMode(value: unknown): LayoutEditorSnapMode {
  if (!isLayoutEditorSnapMode(value)) {
    throw new Error("layout local draft snapMode must be default or fine");
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be boolean`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireIsoTimestamp(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO-compatible timestamp`);
  }
  return text;
}

function requireSourceKind(value: unknown): LayoutLocalDraftRecord["sourceKind"] {
  if (value !== "default-json" && value !== "saved-json" && value !== "review-candidate-json") {
    throw new Error("sourceKind must be default-json, saved-json, or review-candidate-json");
  }
  return value;
}
