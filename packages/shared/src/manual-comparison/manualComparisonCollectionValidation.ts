import {
  validateManualComparisonSets,
  type ManualComparisonSetContract
} from "./manualComparisonSetContract.js";

export type ManualComparisonCollectionValidationInput = {
  comparisonSets: readonly unknown[];
  scenarioIds?: readonly string[];
  selectedComparisonSetId?: string | null;
};

export type ManualComparisonCollectionValidationResult = {
  comparisonSets: ManualComparisonSetContract[];
  selectedComparisonSetId: string | null;
};

export function validateManualComparisonCollection(
  input: ManualComparisonCollectionValidationInput
): ManualComparisonCollectionValidationResult {
  if (!Array.isArray(input.comparisonSets)) {
    throw new Error("manualComparisonCollection.comparisonSets must be an array");
  }
  const comparisonSets = validateManualComparisonSets({
    comparisonSets: input.comparisonSets,
    scenarioIds: input.scenarioIds
  });
  const selectedComparisonSetId = input.selectedComparisonSetId == null
    ? null
    : requireString(input.selectedComparisonSetId, "manualComparisonCollection.selectedComparisonSetId");
  if (
    selectedComparisonSetId != null &&
    !comparisonSets.some((set) => set.comparisonSetId === selectedComparisonSetId)
  ) {
    throw new Error("manualComparisonCollection.selectedComparisonSetId must reference a comparison set");
  }
  return { comparisonSets, selectedComparisonSetId };
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}
