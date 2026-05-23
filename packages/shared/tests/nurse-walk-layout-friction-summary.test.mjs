import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildNurseWalkLayoutFrictionSummary,
  validateOperationalMetricContracts
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function buildGeneratedTaskSetFixture() {
  const fixture = readFixture("tasks/generated-task-set-basic.json");
  return {
    ...fixture,
    generatedTasks: fixture.generatedTasks.slice(0, 2),
    taskCount: 2,
    generatedTaskSetId: "generated-task-set-issue-118-basic"
  };
}

test("buildNurseWalkLayoutFrictionSummary derives deterministic walk metrics from travel events", () => {
  const generatedTaskSet = buildGeneratedTaskSetFixture();
  const simulationRun = {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-run-issue-118",
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
        eventId: "travel-task-basic-room-01-medication-001-alpha-1",
        eventType: "travel",
        action: "travel_calculated",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-01-medication-001",
        minute: 1,
        originNodeId: "room-01",
        destinationNodeId: "room-02",
        routeNodeIds: ["room-01", "hall-01", "room-02"],
        routeEdgeIds: ["edge-01", "edge-02"],
        travelDistanceFeet: 40,
        travelSeconds: 225,
        travelMinutes: 4,
        warnings: []
      },
      {
        eventId: "travel-task-basic-room-01-medication-001-alpha-2",
        eventType: "travel",
        action: "travel_calculated",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-01-medication-001",
        minute: 2,
        originNodeId: "room-02",
        destinationNodeId: "room-01",
        routeNodeIds: ["room-02", "hall-01", "room-01"],
        routeEdgeIds: ["edge-03", "edge-04"],
        travelDistanceFeet: 20,
        travelSeconds: 120,
        travelMinutes: 2,
        warnings: []
      },
      {
        eventId: "travel-task-basic-room-02-monitoring-001-bravo-unreachable",
        eventType: "travel",
        action: "travel_unreachable",
        nurseId: "nurse-bravo",
        taskId: "task-basic-room-02-monitoring-001",
        minute: 3,
        originNodeId: "room-02",
        destinationNodeId: "room-03",
        routeNodeIds: ["room-02", "hall-01"],
        routeEdgeIds: ["edge-05"],
        travelDistanceFeet: 0,
        travelSeconds: 60,
        travelMinutes: 1,
        warnings: ["No direct route available"]
      }
    ],
    summary: {
      totalTasks: 2,
      completedTaskCount: 0,
      delayedTaskCount: 0,
      missedTaskCount: 0,
      unassignedTaskCount: 0
    },
    limitations: ["Operational-only deterministic walk-summary fixture."]
  };

  const output = buildNurseWalkLayoutFrictionSummary({
    simulationRun,
    generatedTaskSet
  });
  const fixture = readFixture("outcomes/nurse-walk-layout-friction-summary-basic.json");

  assert.deepEqual(output, fixture);
  assert.equal(validateOperationalMetricContracts(output.metrics).length, output.metrics.length);
});

test("buildNurseWalkLayoutFrictionSummary returns deterministic zero walk metrics when no travel events", () => {
  const generatedTaskSet = buildGeneratedTaskSetFixture();
  const simulationRun = {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-run-issue-118-zero-travel",
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
        minute: 30,
        scheduledMinute: 30
      },
      {
        eventId: "nurse-nurse-alpha-task-basic-room-01-medication-001-started",
        eventType: "nurse",
        action: "started_task",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-01-medication-001",
        minute: 0,
        durationMinutes: 10,
        busyUntilMinute: 10
      }
    ],
    summary: {
      totalTasks: 2,
      completedTaskCount: 0,
      delayedTaskCount: 0,
      missedTaskCount: 0,
      unassignedTaskCount: 0
    },
    limitations: ["Operational-only deterministic walk-summary zero-travel fixture."]
  };

  const output = buildNurseWalkLayoutFrictionSummary({
    simulationRun,
    generatedTaskSet
  });

  assert.equal(output.metrics.some((metric) => metric.metricId === "total_walk_minutes" && metric.value === 0), true);
  assert.equal(output.metrics.some((metric) => metric.metricId === "total_walk_distance_feet" && metric.value === 0), true);
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "walk_minutes_by_nurse_nurse-alpha" && metric.value === 0),
    true
  );
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "walk_distance_feet_by_nurse_nurse-alpha" && metric.value === 0),
    true
  );
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "walk_events_by_nurse_nurse-alpha" && metric.value === 0),
    true
  );
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "walk_minutes_by_task_task-basic-room-01-medication-001" && metric.value === 0),
    true
  );
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "walk_minutes_by_room_room-01" && metric.value === 0),
    true
  );
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "layout_friction_score" && metric.value === 0),
    true
  );
  assert.equal(output.metrics.every((metric) => metric.value >= 0), true);
});
