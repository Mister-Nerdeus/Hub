import { createManualScenarioSequenceClock } from "@nerdeus/shared";
import {
  createManualScenario,
  createManualScenarioState,
  duplicateManualScenario,
  renameManualScenario,
  selectManualScenario,
  selectedManualScenario
} from "../manualScenarioState";

const createdAtIso = "2026-06-01T00:00:00.000Z";
const duplicatedAtIso = "2026-06-01T00:05:00.000Z";
const renamedAtIso = "2026-06-01T00:10:00.000Z";
const clock = createManualScenarioSequenceClock([createdAtIso, duplicatedAtIso, renamedAtIso]);

const references = {
  floorplanId: "manual-scenario-state-floorplan",
  assignmentSetId: "manual-scenario-state-assignment-set",
  staffRosterId: "manual-scenario-state-roster"
};

let state = createManualScenarioState();
state = createManualScenario({ state, references, clock });

const created = selectedManualScenario(state);
if (created == null) {
  throw new Error("created manual scenario must be selected");
}
if (created.label !== "Manual Scenario") {
  throw new Error("created manual scenario must use the visible manual scenario label");
}
if (created.createdAtIso !== createdAtIso || created.updatedAtIso !== createdAtIso) {
  throw new Error("manual scenario creation must use the injected clock");
}
if (created.mode !== "manual") {
  throw new Error("manual scenario state must stay manual mode only");
}
if (created.scenarioId !== "manual-scenario:created-1") {
  throw new Error("created manual scenario must use a stable label-independent id");
}

state = duplicateManualScenario({ state, scenarioId: created.scenarioId, clock });
const duplicate = selectedManualScenario(state);
if (duplicate == null || duplicate.scenarioId === created.scenarioId) {
  throw new Error("duplicated manual scenario must be selected with a distinct id");
}
if (duplicate.label !== "Manual Scenario Copy") {
  throw new Error("duplicated manual scenario must use a clear copy label");
}
if (duplicate.scenarioId !== "manual-scenario:created-2") {
  throw new Error("duplicated manual scenario must use a new stable id");
}
if (duplicate.createdAtIso !== duplicatedAtIso || duplicate.updatedAtIso !== duplicatedAtIso) {
  throw new Error("duplicated manual scenario must use a new injected clock timestamp");
}

state = renameManualScenario({
  state,
  scenarioId: duplicate.scenarioId,
  label: "Manual Scenario Renamed",
  clock
});
const renamed = selectedManualScenario(state);
if (renamed == null || renamed.label !== "Manual Scenario Renamed") {
  throw new Error("renamed manual scenario must stay selected with the new label");
}
if (renamed.scenarioId !== duplicate.scenarioId) {
  throw new Error("renamed manual scenario id must remain stable");
}
if (renamed.createdAtIso !== duplicate.createdAtIso || renamed.updatedAtIso !== renamedAtIso) {
  throw new Error("renamed manual scenario must preserve createdAtIso and update updatedAtIso from the injected clock");
}

state = selectManualScenario({ state, scenarioId: created.scenarioId });
if (selectedManualScenario(state)?.scenarioId !== created.scenarioId) {
  throw new Error("selecting a manual scenario must update the selected scenario id");
}
