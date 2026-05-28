import assert from "node:assert/strict";
import test from "node:test";

import {
  assertScenarioCapacityIntegration,
  buildCanonicalCapacityCountReport,
  buildScenarioCapacityIntegration
} from "../dist/index.js";

test("scenario capacity integration mirrors canonical capacity report", () => {
  const report = buildCanonicalCapacityCountReport();
  const integration = assertScenarioCapacityIntegration(buildScenarioCapacityIntegration(report));
  assert.equal(integration.source, "semantic_selectors");
  assert.equal(integration.physicalRoomCount, report.physicalRoomCount);
  assert.equal(integration.bedPositionCount, report.bedPositionCount);
  assert.equal(integration.splitBayCount, report.splitBayCount);
  assert.equal(integration.assignmentEligibleCount, report.assignmentEligibleCount);
  assert.equal(integration.ratioEligibleCount, report.ratioEligibleCount);
  assert.equal(integration.rawFixtureRoomIterationUsed, false);
});

test("scenario capacity integration excludes storage, support, hallways, and walls", () => {
  const integration = buildScenarioCapacityIntegration();
  assert.ok(integration.excludedObjectIds.includes("room-14"));
  assert.ok(integration.excludedObjectIds.includes("station-left"));
  assert.ok(integration.excludedObjectIds.includes("hallway-main"));
  assert.equal(integration.assignmentEligibleBedPositionIds.includes("room-14"), false);
  assert.equal(integration.ratioEligibleBedPositionIds.includes("station-left"), false);
});

test("scenario capacity integration rejects raw room count usage", () => {
  assert.throws(
    () => assertScenarioCapacityIntegration({
      ...buildScenarioCapacityIntegration(),
      rawFixtureRoomIterationUsed: true
    }),
    /raw room iteration/
  );
});

