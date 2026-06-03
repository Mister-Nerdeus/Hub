import {
  createManualScenario,
  createManualScenarioState,
  duplicateManualScenario,
  MANUAL_SCENARIO_TIMESTAMP,
  renameManualScenario,
  selectManualScenario,
  selectedManualScenario
} from "../manualScenarioState";

const references = {
  floorplanId: "manual-scenario-state-floorplan",
  assignmentSetId: "manual-scenario-state-assignment-set",
  staffRosterId: "manual-scenario-state-roster"
};

let state = createManualScenarioState();
state = createManualScenario({ state, references });

const created = selectedManualScenario(state);
if (created == null) {
  throw new Error("created manual scenario must be selected");
}
if (created.label !== "Manual Scenario") {
  throw new Error("created manual scenario must use the visible manual scenario label");
}
if (created.createdAtIso !== MANUAL_SCENARIO_TIMESTAMP || created.updatedAtIso !== MANUAL_SCENARIO_TIMESTAMP) {
  throw new Error("manual scenario state must use deterministic timestamps");
}
if (created.mode !== "manual") {
  throw new Error("manual scenario state must stay manual mode only");
}

state = duplicateManualScenario({ state, scenarioId: created.scenarioId });
const duplicate = selectedManualScenario(state);
if (duplicate == null || duplicate.scenarioId === created.scenarioId) {
  throw new Error("duplicated manual scenario must be selected with a distinct id");
}
if (duplicate.label !== "Manual Scenario Copy") {
  throw new Error("duplicated manual scenario must use a clear copy label");
}

state = renameManualScenario({
  state,
  scenarioId: duplicate.scenarioId,
  label: "Manual Scenario Renamed"
});
const renamed = selectedManualScenario(state);
if (renamed == null || renamed.label !== "Manual Scenario Renamed") {
  throw new Error("renamed manual scenario must stay selected with the new label");
}
if (renamed.scenarioId === duplicate.scenarioId) {
  throw new Error("renamed manual scenario id must follow the deterministic label-derived contract");
}

state = selectManualScenario({ state, scenarioId: created.scenarioId });
if (selectedManualScenario(state)?.scenarioId !== created.scenarioId) {
  throw new Error("selecting a manual scenario must update the selected scenario id");
}
