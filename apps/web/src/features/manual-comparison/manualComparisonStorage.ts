import { createManualComparisonState, type ManualComparisonState } from "./manualComparisonState";

const STORAGE_KEY = "nerdeus.manualComparison.state.v1";

export function readManualComparisonState(storage: Storage | null): ManualComparisonState {
  if (storage == null) return createManualComparisonState();
  const raw = storage.getItem(STORAGE_KEY);
  if (raw == null) return createManualComparisonState();
  try {
    const parsed = JSON.parse(raw) as Partial<ManualComparisonState>;
    return {
      comparisonSets: Array.isArray(parsed.comparisonSets) ? parsed.comparisonSets : [],
      selectedComparisonSetId: typeof parsed.selectedComparisonSetId === "string"
        ? parsed.selectedComparisonSetId
        : null
    };
  } catch {
    return createManualComparisonState();
  }
}

export function writeManualComparisonState(
  storage: Storage | null,
  state: ManualComparisonState
): ManualComparisonState {
  if (storage != null) storage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}
