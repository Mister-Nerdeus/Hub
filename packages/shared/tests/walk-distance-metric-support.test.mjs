import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildNurseWalkLayoutFrictionSummary,
  buildSimulationRun,
  calculatePathTravelTime,
  validateOperationalMetricContracts,
  validatePathTravelResponseContract,
  validateSimulationRunContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function plan() {
  return readFixture("plan-er-pod-phase2.json");
}

function buildGeneratedTaskSetFixture() {
  const fixture = readTaskFixture("generated-task-set-basic.json");
  return {
    ...fixture,
    generatedTasks: fixture.generatedTasks.slice(0, 2),
    taskCount: 2,
    generatedTaskSetId: "generated-task-set-issue-132-basic"
  };
}

test("path travel and simulation travel events preserve feet-based distance", () => {
  const output = calculatePathTravelTime({
    plan: plan(),
    originNodeId: "node-station-primary",
    destinationNodeId: "node-door-room-04",
    walkingSpeedFeetPerMinute: 240
  });

  assert.equal(output.travelDistanceFeet, 14);
  assert.throws(
    () => validatePathTravelResponseContract({ ...output, travelDistanceFeet: 15 }, plan()),
    /travelDistanceFeet/
  );

  const run = buildSimulationRun({
    simulationRunId: "simulation-run-issue-132-distance",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    nurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json"),
    travel: {
      enabled: true,
      plan: plan()
    }
  });
  const travelEvents = run.events.filter((event) => event.eventType === "travel");

  assert.equal(travelEvents.length > 0, true);
  assert.equal(travelEvents.every((event) => typeof event.travelDistanceFeet === "number"), true);
  assert.equal(travelEvents.some((event) => event.travelDistanceFeet > 0), true);
  assert.equal(validateSimulationRunContract(run).events.length, run.events.length);
});

test("walk summary includes total and nurse-level walk distance feet", () => {
  const generatedTaskSet = buildGeneratedTaskSetFixture();
  const simulationRun = {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-run-issue-132-walk-distance",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: generatedTaskSet.generatedTaskSetId,
    assignmentSetId: "nurse-task-assignment-basic",
    events: [
      {
        eventId: "task-task-basic-room-01-medication-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-basic-room-01-medication-001",
        minute: 0,
        scheduledMinute: 0
      },
      {
        eventId: "task-task-basic-room-02-monitoring-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-basic-room-02-monitoring-001",
        minute: 0,
        scheduledMinute: 0
      },
      {
        eventId: "travel-task-basic-room-01-medication-001-alpha",
        eventType: "travel",
        action: "travel_calculated",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-01-medication-001",
        minute: 1,
        originNodeId: "node-station-primary",
        destinationNodeId: "node-door-room-04",
        routeNodeIds: ["node-station-primary", "node-hall-east", "node-door-room-04"],
        routeEdgeIds: ["edge-hall-east-station", "edge-room-04-hall"],
        travelSeconds: 11.5,
        travelMinutes: 1,
        travelDistanceFeet: 14,
        warnings: []
      },
      {
        eventId: "travel-task-basic-room-02-monitoring-001-alpha",
        eventType: "travel",
        action: "travel_calculated",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-02-monitoring-001",
        minute: 2,
        originNodeId: "node-door-room-04",
        destinationNodeId: "node-door-room-02",
        routeNodeIds: ["node-door-room-04", "node-hall-east", "node-hall-mid", "node-door-room-02"],
        routeEdgeIds: ["edge-room-04-hall", "edge-hall-mid-east", "edge-room-02-hall"],
        travelSeconds: 24,
        travelMinutes: 1,
        travelDistanceFeet: 46,
        warnings: []
      }
    ],
    summary: {
      totalTasks: 2,
      completedTaskCount: 0,
      delayedTaskCount: 0,
      missedTaskCount: 0,
      unassignedTaskCount: 0
    },
    limitations: ["Operational-only deterministic walk-distance fixture."]
  };

  const output = buildNurseWalkLayoutFrictionSummary({
    simulationRun,
    generatedTaskSet
  });
  const metricById = Object.fromEntries(
    output.metrics.map((metric) => [metric.metricId, metric.value])
  );

  assert.equal(metricById.total_walk_distance_feet, 60);
  assert.equal(metricById["walk_distance_feet_by_nurse_nurse-alpha"], 60);
  assert.equal(validateOperationalMetricContracts(output.metrics).length, output.metrics.length);
});
