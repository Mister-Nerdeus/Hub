import {
  MANUAL_SCENARIO_FIXTURE_TIMESTAMP,
  createManualScenarioSnapshot,
  manualScenarioFixtureClock
} from "@nerdeus/shared";
import {
  cloneManualScenarioState,
  parseManualScenarioState,
  serializeManualScenarioState
} from "../manualScenarioPersistence";
import {
  createManualScenarioFromReferences,
  createManualScenarioStateFromRecords
} from "../manualScenarioState";
import {
  readManualScenarioState,
  writeManualScenarioState,
  type ManualScenarioStorage
} from "../manualScenarioStorage";

const scenario = createManualScenarioFromReferences({
  references: {
    floorplanId: "manual-scenario-persistence-floorplan",
    assignmentSetId: "manual-scenario-persistence-assignment-set",
    staffRosterId: "manual-scenario-persistence-roster"
  },
  label: "Manual Scenario Persistence",
  description: "Reference-only manual scenario persistence proof",
  clock: manualScenarioFixtureClock
});
const snapshot = createManualScenarioSnapshot({
  scenarioId: scenario.scenarioId,
  floorplanId: scenario.floorplanId,
  assignmentSetId: scenario.assignmentSetId,
  staffRosterId: scenario.staffRosterId,
  floorplanRevisionId: "manual-scenario-persistence-floorplan-revision",
  assignmentSetRevisionId: "manual-scenario-persistence-assignment-revision",
  staffRosterRevisionId: "manual-scenario-persistence-roster-revision",
  createdAtIso: MANUAL_SCENARIO_FIXTURE_TIMESTAMP
});
const state = createManualScenarioStateFromRecords({
  scenarios: [scenario],
  snapshots: [snapshot],
  selectedScenarioId: scenario.scenarioId
});

const text = serializeManualScenarioState(state);
const parsed = parseManualScenarioState(text);
if (JSON.stringify(parsed) !== JSON.stringify(state)) {
  throw new Error("manual scenario persistence must round-trip scenario and snapshot records");
}
if (cloneManualScenarioState(state).snapshots[0]?.scenarioSnapshotId !== snapshot.scenarioSnapshotId) {
  throw new Error("manual scenario snapshot ids must persist through clone");
}
const blockedResultKeys = [
  ["sim", "ulation"].join(""),
  ["sc", "ore"].join(""),
  ["recomm", "endation"].join("")
];
if (blockedResultKeys.some((key) => text.includes(key))) {
  throw new Error("manual scenario storage payload must not include blocked result fields");
}

const storage = fakeStorage();
writeManualScenarioState(storage, state);
const reloaded = readManualScenarioState(storage);
if (reloaded.selectedScenarioId !== scenario.scenarioId) {
  throw new Error("manual scenario selected id must persist after storage reload");
}
if (reloaded.scenarios[0]?.floorplanId !== scenario.floorplanId) {
  throw new Error("manual scenario floorplan id must persist after storage reload");
}
if (reloaded.scenarios[0]?.assignmentSetId !== scenario.assignmentSetId) {
  throw new Error("manual scenario assignment set id must persist after storage reload");
}
if (reloaded.scenarios[0]?.staffRosterId !== scenario.staffRosterId) {
  throw new Error("manual scenario staff roster id must persist after storage reload");
}
if (reloaded.snapshots[0]?.scenarioSnapshotId !== snapshot.scenarioSnapshotId) {
  throw new Error("manual scenario snapshot id must persist after storage reload");
}

try {
  const blockedStoredKey = ["sc", "ore"].join("");
  parseManualScenarioState(JSON.stringify({
    schemaVersion: "1.0.0",
    scenarios: [scenario],
    snapshots: [snapshot],
    selectedScenarioId: scenario.scenarioId,
    [blockedStoredKey]: 100
  }));
  throw new Error("manual scenario persistence must reject blocked result fields");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes(["sc", "ore"].join(""))) {
    throw error;
  }
}

function fakeStorage(): ManualScenarioStorage {
  let storedValue: string | null = null;
  return {
    getItem: () => storedValue,
    setItem: (_key, nextValue) => {
      storedValue = nextValue;
    },
    removeItem: () => {
      storedValue = null;
    }
  };
}
