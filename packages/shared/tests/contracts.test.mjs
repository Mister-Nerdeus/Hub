import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  NURSE_BURDEN_PENALTIES,
  ROOM_WORKLOAD_WEIGHTS,
  validateAssumptionsRegisterContract,
  validateDayProfileContract,
  validateGeneratedOperationalTaskSet,
  validateManualAssignmentContract,
  validateNurseTaskAssignmentContract,
  validatePlanContract,
  validateRoomLoads,
  validateScenarioContract,
  validateShiftScenarioContract,
  validateTaskTemplateContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const invalidFixturesDir = join(fixturesDir, "invalid");
const taskFixturesDir = join(fixturesDir, "tasks");
const invalidTaskFixturesDir = join(taskFixturesDir, "invalid");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readInvalidFixture(name) {
  return JSON.parse(readFileSync(join(invalidFixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function readInvalidTaskFixture(name) {
  return JSON.parse(readFileSync(join(invalidTaskFixturesDir, name), "utf8"));
}

test("plan fixture validates against TypeScript contract", () => {
  const plan = validatePlanContract(readFixture("plan-basic.json"));

  assert.equal(plan.schemaVersion, "1.0.0");
  assert.equal(plan.scale.origin, "top-left");
  assert.equal(plan.scale.unit, "feet");
  assert.equal(Object.hasOwn(plan, "selectionState"), false);
});

test("Phase 2 ER pod fixture validates against TypeScript contract", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));

  assert.equal(plan.rooms.length, 7);
  assert.equal(plan.nurseStations.length, 1);
  assert.equal(plan.scale.snapToGrid, true);
  assert.equal(plan.createdAt, "2026-05-22T00:00:00Z");
  assert.equal(plan.rooms[0].roomType, "standard");
  assert.equal(plan.rooms[0].maxPatients, 1);
  assert.equal(plan.rooms[0].traumaCapable, false);
  assert.equal(plan.rooms[0].isolationCapable, false);
  assert.equal(plan.nurseStations[0].stationType, "primary");
  assert.equal(plan.zones[0].travelBlocked, false);
  assert.equal(plan.pathEdges.some((edge) => edge.blocked), false);
});

test("scenario fixture validates against TypeScript contract", () => {
  const scenario = validateScenarioContract(readFixture("scenario-basic.json"));

  assert.equal(scenario.schemaVersion, "1.0.0");
  assert.equal(scenario.shiftLengthMinutes, 720);
  assert.equal(scenario.timestepMinutes, 15);
  assert.equal(scenario.seed, 20260522);
  assert.equal(scenario.assumptionsId, "assumptions-basic");
  assert.equal(scenario.roomLoads[0].acuity, 3);
  assert.equal(scenario.roomLoads[0].monitoringFrequency, "high");
});

test("room-load fixture validates against TypeScript contract and plan rooms", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const roomLoads = validateRoomLoads(readFixture("room-loads-basic.json"), plan);

  assert.equal(roomLoads.length, 7);
  assert.equal(roomLoads[1].acuity, 5);
  assert.equal(roomLoads[1].expectedTurnover, "high");
});

test("manual assignment fixture validates against TypeScript contract and plan rooms", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const assignmentSet = validateManualAssignmentContract(
    readFixture("manual-assignment-basic.json"),
    plan
  );

  assert.equal(assignmentSet.schemaVersion, "1.0.0");
  assert.equal(assignmentSet.nurses.length, 3);
  assert.equal(assignmentSet.assignments[0].assignmentType, "manual");
});

test("assumptions register fixture validates and represents current scoring constants", () => {
  const assumptions = validateAssumptionsRegisterContract(readFixture("assumptions-basic.json"));

  assert.equal(assumptions.schemaVersion, "1.0.0");
  assert.deepEqual(assumptions.roomWorkloadWeights.acuity, {
    "1": ROOM_WORKLOAD_WEIGHTS.acuity[1],
    "2": ROOM_WORKLOAD_WEIGHTS.acuity[2],
    "3": ROOM_WORKLOAD_WEIGHTS.acuity[3],
    "4": ROOM_WORKLOAD_WEIGHTS.acuity[4],
    "5": ROOM_WORKLOAD_WEIGHTS.acuity[5]
  });
  assert.equal(
    assumptions.nurseBurdenWeights.roomSpreadPerAdditionalOccupiedRoom,
    NURSE_BURDEN_PENALTIES.roomSpreadPerAdditionalOccupiedRoom
  );
  assert.equal(
    assumptions.nurseBurdenWeights.breakCoveragePenaltyPlaceholder,
    NURSE_BURDEN_PENALTIES.breakCoveragePenaltyPlaceholder
  );
});

test("task template fixture validates against TypeScript contract", () => {
  const taskTemplates = validateTaskTemplateContract(readFixture("task-templates-basic.json"));

  assert.equal(taskTemplates.schemaVersion, "1.0.0");
  assert.equal(taskTemplates.taskTemplates.length, 7);
  assert.equal(taskTemplates.taskTemplates[0].trigger, "medicationFrequency");
});

test("task template boolean trigger source mismatch is rejected", () => {
  const taskTemplates = readFixture("task-templates-basic.json");
  taskTemplates.taskTemplates[4].frequencySource = "room_load_frequency";

  assert.throws(() => validateTaskTemplateContract(taskTemplates));
});

test("typical day profile validates against TypeScript contract", () => {
  const dayProfile = validateDayProfileContract(readFixture("day-profile-typical.json"));

  assert.equal(dayProfile.schemaVersion, "1.0.0");
  assert.equal(dayProfile.shiftLengthMinutes, 720);
  assert.equal(dayProfile.segments.at(-1).endMinute, 720);
});

test("slammed day profile validates against TypeScript contract", () => {
  const dayProfile = validateDayProfileContract(readFixture("day-profile-slammed.json"));

  assert.equal(dayProfile.schemaVersion, "1.0.0");
  assert.equal(dayProfile.segments[1].taskVolumeMultiplier, 1.7);
});

test("shift scenario fixture validates against TypeScript contract with references", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const assignmentSet = validateManualAssignmentContract(
    readFixture("manual-assignment-basic.json"),
    plan
  );
  const assumptions = validateAssumptionsRegisterContract(readFixture("assumptions-basic.json"));
  const taskTemplates = validateTaskTemplateContract(readFixture("task-templates-basic.json"));
  const dayProfile = validateDayProfileContract(readFixture("day-profile-typical.json"));
  const scenario = validateShiftScenarioContract(readFixture("shift-scenario-basic.json"), {
    plan,
    assignmentSet,
    assumptions,
    taskTemplates,
    dayProfile
  });

  assert.equal(scenario.scenarioId, "shift-scenario-basic");
  assert.equal(scenario.roomLoads.length, plan.rooms.length);
});

test("generated operational task set fixture validates against TypeScript contract", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const taskTemplates = validateTaskTemplateContract(readFixture("task-templates-basic.json"));
  const scenario = validateShiftScenarioContract(readFixture("shift-scenario-basic.json"), {
    plan,
    taskTemplates
  });
  const taskSet = validateGeneratedOperationalTaskSet(
    readTaskFixture("generated-task-set-basic.json"),
    scenario,
    taskTemplates,
    plan
  );

  assert.equal(taskSet.schemaVersion, "1.0.0");
  assert.equal(taskSet.generatedTaskSetId, "generated-task-set-basic");
  assert.equal(taskSet.taskCount, taskSet.generatedTasks.length);
});

test("nurse task assignment fixture validates against TypeScript contract", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const assignmentSet = validateManualAssignmentContract(
    readFixture("manual-assignment-basic.json"),
    plan
  );
  const taskSet = validateGeneratedOperationalTaskSet(readTaskFixture("generated-task-set-basic.json"));
  const nurseTaskAssignment = validateNurseTaskAssignmentContract(
    readFixture("nurse-task-assignment-basic.json"),
    undefined,
    assignmentSet,
    taskSet
  );

  assert.equal(nurseTaskAssignment.schemaVersion, "1.0.0");
  assert.equal(nurseTaskAssignment.taskAssignments.length, taskSet.generatedTasks.length);
});

const invalidPlanFixtures = [
  "plan-duplicate-door-id.json",
  "plan-duplicate-path-edge-id.json",
  "plan-bad-room-type.json",
  "plan-path-edge-missing-node.json",
  "plan-extra-unknown-field.json",
  "plan-missing-hallways.json",
  "plan-missing-room-capability.json",
  "plan-bad-station-type.json",
  "plan-bad-zone-travel-penalty.json",
  "plan-id-too-long.json",
  "plan-name-too-long.json",
  "plan-door-path-node-wrong-type.json",
  "plan-station-path-node-wrong-type.json",
  "plan-room-path-node-unrelated-door.json",
  "plan-path-node-linked-object-mismatch.json"
];

for (const fixtureName of invalidPlanFixtures) {
  test(`${fixtureName} is rejected by TypeScript contract`, () => {
    assert.throws(() => validatePlanContract(readInvalidFixture(fixtureName)));
  });
}

const invalidRoomLoadFixtures = [
  "room-load-bad-frequency.json",
  "room-load-bad-burden.json",
  "room-load-unknown-room.json"
];

for (const fixtureName of invalidRoomLoadFixtures) {
  test(`${fixtureName} is rejected by TypeScript room-load contract`, () => {
    const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
    assert.throws(() => validateRoomLoads(readInvalidFixture(fixtureName), plan));
  });
}

test("old numeric room-load fields are rejected by TypeScript contract", () => {
  assert.throws(() =>
    validateRoomLoads([
      {
        roomId: "room-01",
        occupied: true,
        acuityScore: 3,
        traumaActive: false,
        isolationActive: false,
        behavioralRisk: false,
        fallRisk: false,
        sitterRequired: false,
        medicationFrequency: 2,
        monitoringFrequency: 2,
        procedureBurden: 1,
        turnoverBurden: 1
      }
    ])
  );
});

const invalidManualAssignmentFixtures = [
  "manual-assignment-duplicate-nurse-id.json",
  "manual-assignment-room-assigned-twice.json",
  "manual-assignment-unknown-room.json",
  "manual-assignment-unknown-nurse.json",
  "manual-assignment-break-window-invalid.json"
];

for (const fixtureName of invalidManualAssignmentFixtures) {
  test(`${fixtureName} is rejected by TypeScript manual assignment contract`, () => {
    const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
    assert.throws(() => validateManualAssignmentContract(readInvalidFixture(fixtureName), plan));
  });
}

const invalidAssumptionsFixtures = [
  "assumptions-missing-room-workload-weight.json",
  "assumptions-bad-duration.json",
  "assumptions-bad-frequency-mapping.json",
  "assumptions-negative-placeholder.json"
];

for (const fixtureName of invalidAssumptionsFixtures) {
  test(`${fixtureName} is rejected by TypeScript assumptions contract`, () => {
    assert.throws(() => validateAssumptionsRegisterContract(readInvalidFixture(fixtureName)));
  });
}

const invalidTaskTemplateFixtures = [
  "task-template-bad-type.json",
  "task-template-bad-trigger.json",
  "task-template-bad-duration.json",
  "task-template-duplicate-id.json"
];

for (const fixtureName of invalidTaskTemplateFixtures) {
  test(`${fixtureName} is rejected by TypeScript task template contract`, () => {
    assert.throws(() => validateTaskTemplateContract(readInvalidFixture(fixtureName)));
  });
}

const invalidDayProfileFixtures = [
  "day-profile-bad-multiplier.json",
  "day-profile-overlapping-segments.json",
  "day-profile-bad-minute-range.json",
  "day-profile-gap-in-coverage.json"
];

for (const fixtureName of invalidDayProfileFixtures) {
  test(`${fixtureName} is rejected by TypeScript day profile contract`, () => {
    assert.throws(() => validateDayProfileContract(readInvalidFixture(fixtureName)));
  });
}

const invalidShiftScenarioFixtures = [
  "shift-scenario-missing-assumptions.json",
  "shift-scenario-bad-seed.json",
  "shift-scenario-bad-timestep.json"
];

for (const fixtureName of invalidShiftScenarioFixtures) {
  test(`${fixtureName} is rejected by TypeScript shift scenario contract`, () => {
    assert.throws(() => validateShiftScenarioContract(readInvalidFixture(fixtureName)));
  });
}

test("shift-scenario-mismatched-plan-id.json is rejected when a plan reference is supplied", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));

  assert.throws(() =>
    validateShiftScenarioContract(readInvalidFixture("shift-scenario-mismatched-plan-id.json"), {
      plan
    })
  );
});

const invalidGeneratedTaskFixtures = [
  "generated-task-bad-minute.json",
  "generated-task-bad-duration.json",
  "generated-task-unknown-room.json",
  "generated-task-duplicate-id.json",
  "generated-task-set-mismatched-scenario.json"
];

for (const fixtureName of invalidGeneratedTaskFixtures) {
  test(`${fixtureName} is rejected by TypeScript generated task set contract`, () => {
    const scenario = validateShiftScenarioContract(readFixture("shift-scenario-basic.json"));
    assert.throws(() =>
      validateGeneratedOperationalTaskSet(readInvalidTaskFixture(fixtureName), scenario)
    );
  });
}

const invalidNurseTaskAssignmentFixtures = [
  "nurse-task-assignment-unknown-nurse.json",
  "nurse-task-assignment-unknown-task.json",
  "nurse-task-assignment-task-assigned-twice.json",
  "nurse-task-assignment-minute-mismatch.json"
];

for (const fixtureName of invalidNurseTaskAssignmentFixtures) {
  test(`${fixtureName} is rejected by TypeScript nurse task assignment contract`, () => {
    const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
    const assignmentSet = validateManualAssignmentContract(
      readFixture("manual-assignment-basic.json"),
      plan
    );
    const taskSet = validateGeneratedOperationalTaskSet(readTaskFixture("generated-task-set-basic.json"));
    assert.throws(() =>
      validateNurseTaskAssignmentContract(
        readInvalidFixture(fixtureName),
        undefined,
        assignmentSet,
        taskSet
      )
    );
  });
}
