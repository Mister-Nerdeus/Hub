import {
  manualComparisonSetIdFor,
  validateManualComparisonSetContract,
  type ManualComparisonSetContract
} from "@nerdeus/shared";

export type ManualComparisonState = {
  comparisonSets: ManualComparisonSetContract[];
  selectedComparisonSetId: string | null;
};

export function createManualComparisonState(): ManualComparisonState {
  return { comparisonSets: [], selectedComparisonSetId: null };
}

export function createManualComparisonSet(input: {
  state: ManualComparisonState;
  scenarioIds: readonly string[];
}): ManualComparisonState {
  const nowIso = new Date().toISOString();
  const comparisonSet = validateManualComparisonSetContract({
    comparisonSetId: manualComparisonSetIdFor({ stableSeed: `created-${input.state.comparisonSets.length + 1}` }),
    label: `Manual Comparison ${input.state.comparisonSets.length + 1}`,
    scenarioIds: [...input.scenarioIds],
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    mode: "manual_comparison"
  });
  return {
    comparisonSets: [...input.state.comparisonSets, comparisonSet],
    selectedComparisonSetId: comparisonSet.comparisonSetId
  };
}

export function toggleManualComparisonScenario(input: {
  state: ManualComparisonState;
  comparisonSetId: string | null;
  scenarioId: string;
}): ManualComparisonState {
  if (input.comparisonSetId == null) return input.state;
  return {
    ...input.state,
    comparisonSets: input.state.comparisonSets.map((set) => {
      if (set.comparisonSetId !== input.comparisonSetId) return set;
      const hasScenario = set.scenarioIds.includes(input.scenarioId);
      return validateManualComparisonSetContract({
        ...set,
        scenarioIds: hasScenario
          ? set.scenarioIds.filter((scenarioId) => scenarioId !== input.scenarioId)
          : [...set.scenarioIds, input.scenarioId],
        updatedAtIso: new Date().toISOString()
      });
    })
  };
}
