import {
  manualScenarioIdFor,
  validateManualScenarioContract,
  validateManualScenarioSnapshotContract,
  type ManualScenarioSnapshotContract,
  type ManualScenarioContract
} from "@nerdeus/shared";

export const MANUAL_SCENARIO_TIMESTAMP = "2026-06-01T00:00:00.000Z";

export type ManualScenarioState = {
  scenarios: ManualScenarioContract[];
  snapshots: ManualScenarioSnapshotContract[];
  selectedScenarioId: string | null;
};

export type ManualScenarioReferences = {
  floorplanId: string;
  assignmentSetId: string;
  staffRosterId: string;
};

export function createManualScenarioState(): ManualScenarioState {
  return {
    scenarios: [],
    snapshots: [],
    selectedScenarioId: null
  };
}

export function createManualScenarioStateFromRecords(input: {
  scenarios: readonly ManualScenarioContract[];
  snapshots?: readonly ManualScenarioSnapshotContract[];
  selectedScenarioId?: string | null;
}): ManualScenarioState {
  const scenarios = input.scenarios.map(validateManualScenarioContract);
  const snapshots = [...(input.snapshots ?? [])].map(validateManualScenarioSnapshotContract);
  const requestedSelection = input.selectedScenarioId ?? null;
  const selectedScenarioId = scenarios.some((scenario) => scenario.scenarioId === requestedSelection)
    ? requestedSelection
    : scenarios[0]?.scenarioId ?? null;
  return {
    scenarios,
    snapshots,
    selectedScenarioId
  };
}

export function createManualScenarioFromReferences(input: {
  references: ManualScenarioReferences;
  label: string;
  stableSeed?: string;
  description?: string;
}): ManualScenarioContract {
  return validateManualScenarioContract({
    scenarioId: manualScenarioIdFor({ stableSeed: input.stableSeed ?? fallbackStableSeed(input.references) }),
    label: input.label,
    ...(input.description == null || input.description.trim().length === 0 ? {} : { description: input.description }),
    floorplanId: input.references.floorplanId,
    assignmentSetId: input.references.assignmentSetId,
    staffRosterId: input.references.staffRosterId,
    createdAtIso: MANUAL_SCENARIO_TIMESTAMP,
    updatedAtIso: MANUAL_SCENARIO_TIMESTAMP,
    mode: "manual"
  });
}

export function createManualScenario(input: {
  state: ManualScenarioState;
  references: ManualScenarioReferences;
}): ManualScenarioState {
  const label = nextScenarioLabel("Manual Scenario", input.state.scenarios);
  const scenario = createManualScenarioFromReferences({
    references: input.references,
    label,
    stableSeed: nextScenarioStableSeed(input.state.scenarios)
  });
  return {
    scenarios: [...input.state.scenarios, scenario],
    snapshots: input.state.snapshots,
    selectedScenarioId: scenario.scenarioId
  };
}

export function duplicateManualScenario(input: {
  state: ManualScenarioState;
  scenarioId: string | null;
}): ManualScenarioState {
  const source = input.state.scenarios.find((scenario) => scenario.scenarioId === input.scenarioId);
  if (source == null) return input.state;
  const label = nextScenarioLabel(`${source.label} Copy`, input.state.scenarios);
  const scenario = createManualScenarioFromReferences({
    references: {
      floorplanId: source.floorplanId,
      assignmentSetId: source.assignmentSetId,
      staffRosterId: source.staffRosterId
    },
    label,
    stableSeed: nextScenarioStableSeed(input.state.scenarios),
    description: source.description
  });
  return {
    scenarios: [...input.state.scenarios, scenario],
    snapshots: input.state.snapshots,
    selectedScenarioId: scenario.scenarioId
  };
}

export function renameManualScenario(input: {
  state: ManualScenarioState;
  scenarioId: string | null;
  label: string;
}): ManualScenarioState {
  const trimmedLabel = input.label.trim();
  if (input.scenarioId == null || trimmedLabel.length === 0) return input.state;
  const scenarios = input.state.scenarios.map((scenario) => {
    if (scenario.scenarioId !== input.scenarioId) return scenario;
    return validateManualScenarioContract({
      ...scenario,
      label: trimmedLabel,
      updatedAtIso: MANUAL_SCENARIO_TIMESTAMP
    });
  });
  return {
    scenarios,
    snapshots: input.state.snapshots,
    selectedScenarioId: input.state.selectedScenarioId
  };
}

export function selectManualScenario(input: {
  state: ManualScenarioState;
  scenarioId: string;
}): ManualScenarioState {
  return input.state.scenarios.some((scenario) => scenario.scenarioId === input.scenarioId)
    ? { ...input.state, selectedScenarioId: input.scenarioId }
    : input.state;
}

export function selectedManualScenario(state: ManualScenarioState): ManualScenarioContract | null {
  return state.scenarios.find((scenario) => scenario.scenarioId === state.selectedScenarioId) ?? null;
}

export function addManualScenarioSnapshot(input: {
  state: ManualScenarioState;
  snapshot: ManualScenarioSnapshotContract;
}): ManualScenarioState {
  const snapshots = input.state.snapshots.some((snapshot) =>
    snapshot.scenarioSnapshotId === input.snapshot.scenarioSnapshotId
  )
    ? input.state.snapshots.map((snapshot) =>
        snapshot.scenarioSnapshotId === input.snapshot.scenarioSnapshotId ? input.snapshot : snapshot
      )
    : [...input.state.snapshots, input.snapshot];
  return {
    ...input.state,
    snapshots
  };
}

function nextScenarioLabel(baseLabel: string, scenarios: readonly ManualScenarioContract[]): string {
  const labels = new Set(scenarios.map((scenario) => scenario.label));
  if (!labels.has(baseLabel)) return baseLabel;
  let index = 2;
  while (labels.has(`${baseLabel} ${index}`)) index += 1;
  return `${baseLabel} ${index}`;
}

function nextScenarioStableSeed(scenarios: readonly ManualScenarioContract[]): string {
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.scenarioId));
  let index = scenarios.length + 1;
  while (scenarioIds.has(manualScenarioIdFor({ stableSeed: `created-${index}` }))) index += 1;
  return `created-${index}`;
}

function fallbackStableSeed(references: ManualScenarioReferences): string {
  return [
    references.floorplanId,
    references.assignmentSetId,
    references.staffRosterId,
    "manual-scenario"
  ].join(":");
}
