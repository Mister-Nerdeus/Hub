import {
  addManualComparisonScenario,
  createManualComparisonSet,
  createManualComparisonState,
  removeManualComparisonScenario,
  renameManualComparisonSet,
  selectManualComparisonSet
} from "../manualComparisonState";

let state = createManualComparisonState();
state = createManualComparisonSet({
  state,
  scenarioIds: ["manual-scenario:a", "manual-scenario:b"],
  createdAtIso: "2026-06-01T00:00:00.000Z"
});

const created = state.comparisonSets[0];
if (created == null) {
  throw new Error("manual comparison set must be created when at least two scenarios exist");
}
if (created.comparisonSetId !== "manual-comparison-set:created-1") {
  throw new Error("manual comparison set must use a stable collision-safe id");
}
if (state.selectedComparisonSetId !== created.comparisonSetId) {
  throw new Error("created manual comparison set must be selected");
}

state = renameManualComparisonSet({
  state,
  comparisonSetId: created.comparisonSetId,
  label: "Reference review set",
  updatedAtIso: "2026-06-01T00:05:00.000Z"
});
if (state.comparisonSets[0]?.label !== "Reference review set") {
  throw new Error("manual comparison set rename must update the set label");
}

let duplicateRejected = false;
state = addManualComparisonScenario({
  state,
  comparisonSetId: created.comparisonSetId,
  scenarioId: "manual-scenario:a",
  updatedAtIso: "2026-06-01T00:10:00.000Z"
});
duplicateRejected = state.comparisonSets[0]?.scenarioIds.length === 2;
if (!duplicateRejected) {
  throw new Error("manual comparison state must not add a duplicate scenario id");
}

state = addManualComparisonScenario({
  state,
  comparisonSetId: created.comparisonSetId,
  scenarioId: "manual-scenario:c",
  updatedAtIso: "2026-06-01T00:15:00.000Z"
});
if (state.comparisonSets[0]?.scenarioIds.length !== 3) {
  throw new Error("manual comparison state must add a new scenario id");
}

state = removeManualComparisonScenario({
  state,
  comparisonSetId: created.comparisonSetId,
  scenarioId: "manual-scenario:c",
  updatedAtIso: "2026-06-01T00:20:00.000Z"
});
if (state.comparisonSets[0]?.scenarioIds.includes("manual-scenario:c")) {
  throw new Error("manual comparison state must remove an existing scenario id");
}

state = selectManualComparisonSet({ state, comparisonSetId: "manual-comparison-set:missing" });
if (state.selectedComparisonSetId !== created.comparisonSetId) {
  throw new Error("manual comparison state must preserve valid selection when an unresolved id is requested");
}

let overclaimRejected = false;
try {
  renameManualComparisonSet({
    state,
    comparisonSetId: created.comparisonSetId,
    label: ["Safe", "assignment comparison"].join(" ")
  });
} catch {
  overclaimRejected = true;
}
if (!overclaimRejected) {
  throw new Error("manual comparison state must reject overclaiming labels");
}

state = createManualComparisonSet({
  state,
  scenarioIds: ["manual-scenario:a", "manual-scenario:b"],
  createdAtIso: "2026-06-01T00:25:00.000Z"
});
if (state.comparisonSets[1]?.comparisonSetId !== "manual-comparison-set:created-2") {
  throw new Error("manual comparison set ids must avoid imported/current collisions");
}
