import assert from "node:assert/strict";
import test from "node:test";

import {
  buildManualAssignmentScenarioBridgeInput,
  buildNurseRuntimeStatesFromManualBridge,
  buildRoomLoadStarterContractFromOccupancySelection,
  buildScenarioCapacityIntegration,
  dryRunTaskTemplates,
  fourToOneRatioPreset,
  generateDryRunTaskInstances,
  neutralWorkloadSeedContract,
  processNurseTaskPlaceholders,
  selectOccupiedBedPositionsForActivityProfile,
  typicalActivityProfile,
  validateNurseTaskProcessingResult
} from "../dist/index.js";

function fixture() {
  const capacity = buildScenarioCapacityIntegration();
  const bridge = buildManualAssignmentScenarioBridgeInput(capacity, fourToOneRatioPreset);
  const runtimeStates = buildNurseRuntimeStatesFromManualBridge(bridge, {
    ratioPreset: fourToOneRatioPreset
  });
  const selection = selectOccupiedBedPositionsForActivityProfile({
    capacity,
    activityProfile: typicalActivityProfile,
    neutralWorkloadSeed: neutralWorkloadSeedContract
  });
  const roomLoad = buildRoomLoadStarterContractFromOccupancySelection(capacity, selection);
  const taskSet = generateDryRunTaskInstances({
    roomLoad,
    activityProfile: typicalActivityProfile,
    seedContract: neutralWorkloadSeedContract,
    templates: dryRunTaskTemplates,
    capacity
  });
  return { capacity, runtimeStates, taskSet };
}

test("assigned synthetic nurse receives placeholder task", () => {
  const { capacity, runtimeStates, taskSet } = fixture();
  const result = validateNurseTaskProcessingResult(
    processNurseTaskPlaceholders({ capacity, runtimeStates, taskSet })
  );

  assert.ok(result.timeline.some((event) => event.eventLabel === "task_placeholder_started"));
  assert.ok(result.timeline.some((event) => event.syntheticNurseId != null));
  assert.equal(result.assignmentSource, "manual_assignment_bridge_only");
});

test("busy synthetic nurse produces queue and delayed placeholders", () => {
  const { capacity, runtimeStates, taskSet } = fixture();
  const result = processNurseTaskPlaceholders({ capacity, runtimeStates, taskSet });

  assert.ok(result.busyNurseQueuedTaskIds.length > 0);
  assert.ok(result.timeline.some((event) => event.eventLabel === "task_placeholder_queued"));
  assert.ok(result.timeline.some((event) => event.eventLabel === "task_placeholder_delayed"));
});

test("uncovered bed produces unassigned placeholder", () => {
  const { capacity, runtimeStates, taskSet } = fixture();
  const targetBed = taskSet.instances[0].loadableBedPositionId;
  const uncoveredStates = {
    ...runtimeStates,
    states: runtimeStates.states.map((state) => ({
      ...state,
      assignedBedPositionIds: state.assignedBedPositionIds.filter((id) => id !== targetBed)
    }))
  };
  const result = processNurseTaskPlaceholders({
    capacity,
    runtimeStates: uncoveredStates,
    taskSet: {
      ...taskSet,
      instances: [taskSet.instances[0]]
    }
  });

  assert.deepEqual(result.unassignedPlaceholderTaskIds, [taskSet.instances[0].taskInstanceId]);
  assert.ok(result.timeline.some((event) => event.eventLabel === "task_placeholder_unassigned"));
});

test("excluded spaces are rejected", () => {
  const { capacity, runtimeStates, taskSet } = fixture();
  const invalidTaskSet = {
    ...taskSet,
    instances: [
      {
        ...taskSet.instances[0],
        loadableBedPositionId: capacity.excludedObjectIds[0]
      }
    ]
  };

  assert.throws(
    () => processNurseTaskPlaceholders({ capacity, runtimeStates, taskSet: invalidTaskSet }),
    /selector-eligible/
  );
});

test("processing loop emits no recommendations or optimizer status", () => {
  const { capacity, runtimeStates, taskSet } = fixture();
  const result = processNurseTaskPlaceholders({ capacity, runtimeStates, taskSet });

  assert.equal(result.reassignmentSearchStatus, "not_started");
  assert.equal(result.recommendationStatus, "not_started");
  assert.equal(result.optimizerStatus, "not_started");
  assert.equal(result.staffingComplianceClaim, false);
  assert.equal(result.clinicalSafetyClaim, false);
});
