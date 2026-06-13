import {
  validateManualComparisonCollection
} from "@nerdeus/shared";
import {
  createManualComparisonState,
  type ManualComparisonState
} from "./manualComparisonState";

export const MANUAL_COMPARISON_STORAGE_KEY = "nerdeus.manualComparisonFoundation.comparisonSets.v1";

export type ManualComparisonPersistencePayload = {
  schemaVersion: "1.0.0";
  comparisonSets: ManualComparisonState["comparisonSets"];
  selectedComparisonSetId: string | null;
};

export function readManualComparisonState(storage: Storage | null): ManualComparisonState {
  if (storage == null) return createManualComparisonState();
  const raw = storage.getItem(MANUAL_COMPARISON_STORAGE_KEY);
  if (raw == null) return createManualComparisonState();
  try {
    return stateFromPersistencePayload(validateManualComparisonPersistencePayload(JSON.parse(raw) as unknown));
  } catch {
    storage.removeItem(MANUAL_COMPARISON_STORAGE_KEY);
    return createManualComparisonState();
  }
}

export function writeManualComparisonState(
  storage: Storage | null,
  state: ManualComparisonState
): ManualComparisonState {
  const validated = validateManualComparisonState(state);
  if (storage != null) storage.setItem(
    MANUAL_COMPARISON_STORAGE_KEY,
    JSON.stringify(createManualComparisonPersistencePayload(validated))
  );
  return validated;
}

export function validateManualComparisonState(value: unknown): ManualComparisonState {
  const state = requireRecord(value, "manualComparisonState");
  requireAllowedKeys(state, "manualComparisonState", ["comparisonSets", "selectedComparisonSetId"]);
  if (!Array.isArray(state.comparisonSets)) {
    throw new Error("manualComparisonState.comparisonSets must be an array");
  }
  const { comparisonSets, selectedComparisonSetId } = validateManualComparisonCollection({
    comparisonSets: state.comparisonSets,
    selectedComparisonSetId: state.selectedComparisonSetId == null
      ? null
      : requireString(state.selectedComparisonSetId, "manualComparisonState.selectedComparisonSetId")
  });
  return { comparisonSets, selectedComparisonSetId };
}

export function createManualComparisonPersistencePayload(
  state: ManualComparisonState
): ManualComparisonPersistencePayload {
  const validated = validateManualComparisonState(state);
  return {
    schemaVersion: "1.0.0",
    comparisonSets: validated.comparisonSets,
    selectedComparisonSetId: validated.selectedComparisonSetId
  };
}

export function validateManualComparisonPersistencePayload(value: unknown): ManualComparisonPersistencePayload {
  const payload = requireRecord(value, "manualComparisonPersistence");
  requireAllowedKeys(payload, "manualComparisonPersistence", [
    "schemaVersion",
    "comparisonSets",
    "selectedComparisonSetId"
  ]);
  if (payload.schemaVersion !== "1.0.0") {
    throw new Error("manualComparisonPersistence.schemaVersion must be 1.0.0");
  }
  if (!Array.isArray(payload.comparisonSets)) {
    throw new Error("manualComparisonPersistence.comparisonSets must be an array");
  }
  const { comparisonSets, selectedComparisonSetId } = validateManualComparisonCollection({
    comparisonSets: payload.comparisonSets,
    selectedComparisonSetId: payload.selectedComparisonSetId == null
      ? null
      : requireString(payload.selectedComparisonSetId, "manualComparisonPersistence.selectedComparisonSetId")
  });
  return {
    schemaVersion: "1.0.0",
    comparisonSets,
    selectedComparisonSetId
  };
}

function stateFromPersistencePayload(payload: ManualComparisonPersistencePayload): ManualComparisonState {
  return {
    comparisonSets: payload.comparisonSets,
    selectedComparisonSetId: payload.selectedComparisonSetId
  };
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
