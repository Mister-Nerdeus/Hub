import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import type { LayoutEditAuditEntry } from "./layoutEditAuditTrail";
import type { LayoutEditorValidationWarning } from "./layoutEditorState";

export const DEFAULT_LAYOUT_UNDO_REDO_MAX_DEPTH = 20;

export type LayoutUndoRedoSnapshot = {
  editableLayout: EditableLayoutGeometryContract | null;
  validationWarnings: readonly LayoutEditorValidationWarning[];
  editAuditTrail: readonly LayoutEditAuditEntry[];
  isDirty: boolean;
};

export type LayoutUndoRedoHistory = {
  past: readonly LayoutUndoRedoSnapshot[];
  future: readonly LayoutUndoRedoSnapshot[];
  maxDepth: number;
};

export type LayoutUndoRedoTransition =
  | {
      status: "applied";
      snapshot: LayoutUndoRedoSnapshot;
      history: LayoutUndoRedoHistory;
    }
  | {
      status: "empty";
      snapshot: null;
      history: LayoutUndoRedoHistory;
    };

export function createLayoutUndoRedoHistory(
  maxDepth = DEFAULT_LAYOUT_UNDO_REDO_MAX_DEPTH
): LayoutUndoRedoHistory {
  return {
    past: [],
    future: [],
    maxDepth: requirePositiveInteger(maxDepth, "maxDepth")
  };
}

export function createLayoutUndoRedoSnapshot(input: LayoutUndoRedoSnapshot): LayoutUndoRedoSnapshot {
  return {
    editableLayout: input.editableLayout,
    validationWarnings: input.validationWarnings.map((warning) => ({ ...warning })),
    editAuditTrail: input.editAuditTrail.map((entry) => ({ ...entry })),
    isDirty: input.isDirty
  };
}

export function pushLayoutUndoRedoSnapshot(
  history: LayoutUndoRedoHistory,
  snapshot: LayoutUndoRedoSnapshot
): LayoutUndoRedoHistory {
  const normalized = normalizeHistory(history);
  return {
    ...normalized,
    past: [...normalized.past, createLayoutUndoRedoSnapshot(snapshot)].slice(-normalized.maxDepth),
    future: []
  };
}

export function undoLayoutEditHistory(
  history: LayoutUndoRedoHistory,
  currentSnapshot: LayoutUndoRedoSnapshot
): LayoutUndoRedoTransition {
  const normalized = normalizeHistory(history);
  const previous = normalized.past[normalized.past.length - 1];
  if (previous == null) {
    return { status: "empty", snapshot: null, history: normalized };
  }
  return {
    status: "applied",
    snapshot: createLayoutUndoRedoSnapshot(previous),
    history: {
      ...normalized,
      past: normalized.past.slice(0, -1),
      future: [createLayoutUndoRedoSnapshot(currentSnapshot), ...normalized.future]
    }
  };
}

export function redoLayoutEditHistory(
  history: LayoutUndoRedoHistory,
  currentSnapshot: LayoutUndoRedoSnapshot
): LayoutUndoRedoTransition {
  const normalized = normalizeHistory(history);
  const next = normalized.future[0];
  if (next == null) {
    return { status: "empty", snapshot: null, history: normalized };
  }
  return {
    status: "applied",
    snapshot: createLayoutUndoRedoSnapshot(next),
    history: {
      ...normalized,
      past: [...normalized.past, createLayoutUndoRedoSnapshot(currentSnapshot)].slice(-normalized.maxDepth),
      future: normalized.future.slice(1)
    }
  };
}

function normalizeHistory(history: LayoutUndoRedoHistory): LayoutUndoRedoHistory {
  const maxDepth = requirePositiveInteger(history.maxDepth, "maxDepth");
  return {
    past: history.past.slice(-maxDepth).map(createLayoutUndoRedoSnapshot),
    future: history.future.map(createLayoutUndoRedoSnapshot),
    maxDepth
  };
}

function requirePositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}
