import test from "node:test";
import assert from "node:assert/strict";

import {
  createManualScenarioSnapshot,
  manualScenarioSnapshotIdFor,
  orderManualScenarioSnapshots,
  validateManualScenarioSnapshotContract
} from "../dist/index.js";

const snapshotInput = {
  scenarioId: "manual-scenario-alpha",
  floorplanId: "floorplan-alpha",
  assignmentSetId: "assignment-set-alpha",
  staffRosterId: "staff-roster-alpha",
  floorplanRevisionId: "floorplan-revision-001",
  assignmentSetRevisionId: "assignment-revision-001",
  createdAtIso: "2026-06-01T00:00:00.000Z"
};

test("manual scenario snapshot contract accepts reference-only snapshots", () => {
  const snapshot = createManualScenarioSnapshot(snapshotInput);
  assert.equal(snapshot.mode, "manual_snapshot");
  assert.equal(snapshot.scenarioId, snapshotInput.scenarioId);
  assert.equal(snapshot.floorplanId, snapshotInput.floorplanId);
  assert.equal(snapshot.assignmentSetId, snapshotInput.assignmentSetId);
  assert.equal(snapshot.floorplanRevisionId, snapshotInput.floorplanRevisionId);
  assert.equal(snapshot.assignmentSetRevisionId, snapshotInput.assignmentSetRevisionId);
});

test("manual scenario snapshot id helper is deterministic", () => {
  assert.equal(
    manualScenarioSnapshotIdFor(snapshotInput),
    "manual-scenario-snapshot:manual-scenario-alpha:floorplan-alpha:assignment-set-alpha:floorplan-revision-001:assignment-revision-001"
  );
});

test("manual scenario snapshot ordering is deterministic", () => {
  const second = createManualScenarioSnapshot({
    ...snapshotInput,
    assignmentSetRevisionId: "assignment-revision-002",
    createdAtIso: "2026-06-02T00:00:00.000Z"
  });
  const first = createManualScenarioSnapshot(snapshotInput);
  assert.deepEqual(orderManualScenarioSnapshots([second, first]).map((snapshot) => snapshot.assignmentSetRevisionId), [
    "assignment-revision-001",
    "assignment-revision-002"
  ]);
});

test("manual scenario snapshot contract rejects forbidden output fields", () => {
  const snapshot = createManualScenarioSnapshot(snapshotInput);
  for (const field of [
    "score",
    "recommendation",
    "simulationResult",
    "optimizerOutput",
    "safetyStatus",
    "complianceStatus",
    "patientOutcome"
  ]) {
    assert.throws(
      () => validateManualScenarioSnapshotContract({ ...snapshot, [field]: "blocked" }),
      new RegExp(`manualScenarioSnapshot\\.${field} is not allowed`)
    );
  }
});
