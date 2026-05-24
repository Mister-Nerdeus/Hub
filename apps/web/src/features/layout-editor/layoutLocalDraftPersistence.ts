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

export const LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION = "1.0.0";
export const LAYOUT_LOCAL_DRAFT_STORAGE_KEY = "nerdeus.layoutEditor.localDraft.v1";

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
  editableLayout: EditableLayoutGeometryContract;
  snapMode: LayoutEditorSnapMode;
  viewport: LayoutEditorViewport;
  auditTrail: readonly LayoutEditAuditEntry[];
  dirtyState: LayoutLocalDraftDirtyState;
};

export type LoadLayoutLocalDraftResult =
  | { status: "loaded"; draft: LayoutLocalDraftRecord }
  | { status: "empty" | "invalid" | "schema_mismatch"; draft: null };

export function buildLayoutLocalDraftRecord(input: {
  editableLayout: EditableLayoutGeometryContract;
  snapMode: LayoutEditorSnapMode;
  viewport: LayoutEditorViewport;
  auditTrail: readonly LayoutEditAuditEntry[];
  isDirty: boolean;
}): LayoutLocalDraftRecord {
  return {
    schemaVersion: LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION,
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
  storage.setItem(LAYOUT_LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(validateLayoutLocalDraftRecord(draft)));
}

export function loadLayoutLocalDraft(storage: LayoutLocalDraftStorage): LoadLayoutLocalDraftResult {
  const serialized = storage.getItem(LAYOUT_LOCAL_DRAFT_STORAGE_KEY);
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
    return { status: "loaded", draft: validateLayoutLocalDraftRecord(parsed) };
  } catch (_error) {
    return { status: "invalid", draft: null };
  }
}

export function resetLayoutLocalDraft(storage: LayoutLocalDraftStorage): void {
  storage.removeItem(LAYOUT_LOCAL_DRAFT_STORAGE_KEY);
}

export function validateLayoutLocalDraftRecord(value: unknown): LayoutLocalDraftRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("layout local draft must be an object");
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.schemaVersion !== LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION) {
    throw new Error("layout local draft schema version mismatch");
  }
  if (!Array.isArray(candidate.auditTrail)) {
    throw new Error("layout local draft auditTrail must be an array");
  }
  const dirtyState = requireDirtyState(candidate.dirtyState);

  return {
    schemaVersion: LAYOUT_LOCAL_DRAFT_SCHEMA_VERSION,
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
