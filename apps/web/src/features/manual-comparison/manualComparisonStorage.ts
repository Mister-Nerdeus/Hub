import {
  validateManualComparisonCollection
} from "@nerdeus/shared";
import { createManualComparisonState, type ManualComparisonState } from "./manualComparisonState";

const STORAGE_KEY = "nerdeus.manualComparison.state.v1";

export function readManualComparisonState(storage: Storage | null): ManualComparisonState {
  if (storage == null) return createManualComparisonState();
  const raw = storage.getItem(STORAGE_KEY);
  if (raw == null) return createManualComparisonState();
  try {
    return validateManualComparisonState(JSON.parse(raw) as unknown);
  } catch {
    storage.removeItem(STORAGE_KEY);
    return createManualComparisonState();
  }
}

export function writeManualComparisonState(
  storage: Storage | null,
  state: ManualComparisonState
): ManualComparisonState {
  const validated = validateManualComparisonState(state);
  if (storage != null) storage.setItem(STORAGE_KEY, JSON.stringify(validated));
  return validated;
}

export function validateManualComparisonState(value: unknown): ManualComparisonState {
  const state = requireRecord(value, "manualComparisonState");
  requireAllowedKeys(state, "manualComparisonState", ["comparisonSets", "selectedComparisonSetId"]);
  if (!Array.isArray(state.comparisonSets)) {
    throw new Error("manualComparisonState.comparisonSets must be an array");
  }
  const comparisonSets = validateManualComparisonCollection({ comparisonSets: state.comparisonSets });
  const selectedComparisonSetId = state.selectedComparisonSetId == null
    ? null
    : requireString(state.selectedComparisonSetId, "manualComparisonState.selectedComparisonSetId");
  if (
    selectedComparisonSetId != null &&
    !comparisonSets.some((set) => set.comparisonSetId === selectedComparisonSetId)
  ) {
    throw new Error("manualComparisonState.selectedComparisonSetId must reference a comparison set");
  }
  return { comparisonSets, selectedComparisonSetId };
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
