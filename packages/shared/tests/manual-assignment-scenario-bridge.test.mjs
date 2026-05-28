import assert from "node:assert/strict";
import test from "node:test";

import {
  bridgeManualAssignmentsToScenarioInput,
  buildScenarioCapacityIntegration,
  fourToOneRatioPreset
} from "../dist/index.js";

test("manual assignment bridge computes coverage readiness from eligible selectors", () => {
  const capacity = buildScenarioCapacityIntegration();
  const summary = bridgeManualAssignmentsToScenarioInput({
    schemaVersion: "1.0.0",
    bridgeId: "manual-assignment-scenario-bridge-canonical-plan-1",
    assignmentGroups: [
      {
        assignmentGroupId: "synthetic-group-blue",
        syntheticNurseLabel: "Synthetic Nurse Blue",
        assignedBedPositionIds: ["room-level-1-trauma", "room-02", "room-03", "room-14", "station-left"],
        syntheticDataOnly: true
      },
      {
        assignmentGroupId: "synthetic-group-green",
        syntheticNurseLabel: "Synthetic Nurse Green",
        assignedBedPositionIds: ["room-04", "room-05", "room-06", "room-07"],
        syntheticDataOnly: true
      }
    ],
    ratioPreset: fourToOneRatioPreset,
    capacity,
    recommendationStatus: "not_started",
    optimizerStatus: "not_started",
    fullShiftSimulationStatus: "not_started",
    syntheticDataOnly: true
  });
  assert.deepEqual(summary.ignoredExcludedObjectIds, ["room-14", "station-left"]);
  assert.ok(summary.coveredEligibleBedPositionIds.includes("room-02"));
  assert.equal(summary.ratioReadiness.patientsPerNurse, 4);
  assert.equal(summary.recommendationStatus, "not_started");
  assert.equal(summary.optimizerStatus, "not_started");
});

test("manual assignment bridge rejects unsupported references and active behavior", () => {
  const capacity = buildScenarioCapacityIntegration();
  const input = {
    schemaVersion: "1.0.0",
    bridgeId: "manual-assignment-scenario-bridge-canonical-plan-1",
    assignmentGroups: [
      {
        assignmentGroupId: "synthetic-group-blue",
        syntheticNurseLabel: "Synthetic Nurse Blue",
        assignedBedPositionIds: ["unknown-room"],
        syntheticDataOnly: true
      }
    ],
    ratioPreset: fourToOneRatioPreset,
    capacity,
    recommendationStatus: "not_started",
    optimizerStatus: "not_started",
    fullShiftSimulationStatus: "not_started",
    syntheticDataOnly: true
  };
  assert.throws(() => bridgeManualAssignmentsToScenarioInput(input), /unsupported/);
  assert.throws(
    () => bridgeManualAssignmentsToScenarioInput({ ...input, assignmentGroups: [], optimizerStatus: "started" }),
    /recommend/
  );
});

