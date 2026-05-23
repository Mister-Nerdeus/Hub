import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildSimulationRun,
  calculatePathTravelTime,
  validatePathTravelResponseContract
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

test("simple route calculates expected travel time", () => {
  const output = calculatePathTravelTime({
    plan: plan(),
    originNodeId: "node-station-primary",
    destinationNodeId: "node-door-room-04",
    walkingSpeedFeetPerMinute: 240
  });

  assert.deepEqual(output.routeEdgeIds, ["edge-hall-east-station", "edge-room-04-hall"]);
  assert.equal(output.travelMinutes, Math.ceil(output.travelSeconds / 60));
  assert.doesNotThrow(() => validatePathTravelResponseContract(output));
});

test("blocked edge is excluded", () => {
  const blockedPlan = plan();
  blockedPlan.pathEdges = blockedPlan.pathEdges.map((edge) =>
    edge.id === "edge-room-04-hall" ? { ...edge, blocked: true } : edge
  );
  const output = calculatePathTravelTime({
    plan: blockedPlan,
    originNodeId: "node-station-primary",
    destinationNodeId: "node-door-room-04",
    walkingSpeedFeetPerMinute: 240
  });

  assert.equal(output.routeEdgeIds.includes("edge-room-04-hall"), false);
  assert.ok(output.warnings.length > 0);
});

test("unreachable route warns", () => {
  const blockedPlan = plan();
  blockedPlan.pathEdges = blockedPlan.pathEdges.map((edge) => ({ ...edge, blocked: true }));

  const output = calculatePathTravelTime({
    plan: blockedPlan,
    originNodeId: "node-station-primary",
    destinationNodeId: "node-door-room-01",
    walkingSpeedFeetPerMinute: 240
  });

  assert.ok(output.warnings.length > 0);
  assert.deepEqual(output.routeNodeIds, []);
});

test("missing node fails validation", () => {
  assert.throws(
    () =>
      calculatePathTravelTime({
        plan: plan(),
        originNodeId: "node-missing",
        destinationNodeId: "node-door-room-01",
        walkingSpeedFeetPerMinute: 240
      }),
    /missing path node/
  );
});

test("simulation travel option adds travel minutes", () => {
  const run = buildSimulationRun({
    simulationRunId: "simulation-run-travel",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    nurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json"),
    travel: {
      enabled: true,
      plan: plan()
    }
  });

  assert.ok(run.events.some((event) => event.eventType === "travel" && event.travelMinutes > 0));
});

test("simulation can still run with travel disabled", () => {
  const run = buildSimulationRun({
    simulationRunId: "simulation-run-no-travel",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    nurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json"),
    travel: {
      enabled: false,
      plan: plan()
    }
  });

  assert.equal(run.events.some((event) => event.eventType === "travel"), false);
});
