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
  createdAtIso?: string;
}): ManualComparisonState {
  if (input.scenarioIds.length < 2) return input.state;
  const nowIso = input.createdAtIso ?? new Date().toISOString();
  const comparisonSetId = nextManualComparisonSetId(input.state);
  const comparisonSet = validateManualComparisonSetContract({
    comparisonSetId,
    label: `Manual Comparison ${input.state.comparisonSets.length + 1}`,
    scenarioIds: Array.from(new Set(input.scenarioIds)),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    mode: "manual_comparison"
  });
  return {
    comparisonSets: [...input.state.comparisonSets, comparisonSet],
    selectedComparisonSetId: comparisonSet.comparisonSetId
  };
}

export function renameManualComparisonSet(input: {
  state: ManualComparisonState;
  comparisonSetId: string;
  label: string;
  updatedAtIso?: string;
}): ManualComparisonState {
  const updatedAtIso = input.updatedAtIso ?? new Date().toISOString();
  return {
    ...input.state,
    comparisonSets: input.state.comparisonSets.map((set) => set.comparisonSetId === input.comparisonSetId
      ? validateManualComparisonSetContract({ ...set, label: input.label, updatedAtIso })
      : set)
  };
}

export function selectManualComparisonSet(input: {
  state: ManualComparisonState;
  comparisonSetId: string | null;
}): ManualComparisonState {
  if (input.comparisonSetId == null) return { ...input.state, selectedComparisonSetId: null };
  const exists = input.state.comparisonSets.some((set) => set.comparisonSetId === input.comparisonSetId);
  return exists ? { ...input.state, selectedComparisonSetId: input.comparisonSetId } : input.state;
}

export function addManualComparisonScenario(input: {
  state: ManualComparisonState;
  comparisonSetId: string | null;
  scenarioId: string;
  updatedAtIso?: string;
}): ManualComparisonState {
  if (input.comparisonSetId == null) return input.state;
  const updatedAtIso = input.updatedAtIso ?? new Date().toISOString();
  return {
    ...input.state,
    comparisonSets: input.state.comparisonSets.map((set) => {
      if (set.comparisonSetId !== input.comparisonSetId || set.scenarioIds.includes(input.scenarioId)) return set;
      return validateManualComparisonSetContract({
        ...set,
        scenarioIds: [...set.scenarioIds, input.scenarioId],
        updatedAtIso
      });
    })
  };
}

export function removeManualComparisonScenario(input: {
  state: ManualComparisonState;
  comparisonSetId: string | null;
  scenarioId: string;
  updatedAtIso?: string;
}): ManualComparisonState {
  if (input.comparisonSetId == null) return input.state;
  const updatedAtIso = input.updatedAtIso ?? new Date().toISOString();
  return {
    ...input.state,
    comparisonSets: input.state.comparisonSets.map((set) => {
      if (set.comparisonSetId !== input.comparisonSetId) return set;
      const scenarioIds = set.scenarioIds.filter((scenarioId) => scenarioId !== input.scenarioId);
      if (scenarioIds.length < 2) return set;
      return validateManualComparisonSetContract({
        ...set,
        scenarioIds,
        updatedAtIso
      });
    })
  };
}

export function toggleManualComparisonScenario(input: {
  state: ManualComparisonState;
  comparisonSetId: string | null;
  scenarioId: string;
}): ManualComparisonState {
  const selectedSet = input.state.comparisonSets.find((set) => set.comparisonSetId === input.comparisonSetId);
  if (selectedSet == null) return input.state;
  return selectedSet.scenarioIds.includes(input.scenarioId)
    ? removeManualComparisonScenario(input)
    : addManualComparisonScenario(input);
}

function nextManualComparisonSetId(state: ManualComparisonState): string {
  const existing = new Set(state.comparisonSets.map((set) => set.comparisonSetId));
  for (let index = 1; index <= existing.size + 2; index += 1) {
    const candidate = manualComparisonSetIdFor({ stableSeed: `created-${index}` });
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error("manualComparisonSetId collision could not be resolved");
}
