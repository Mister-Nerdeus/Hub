import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { calculatePathTravelTime, validatePlanContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-201");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

test("hallway operational metadata validates in representative fixture hallways", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const hallwayClasses = plan.hallways.map((hallway) => hallway.hallwayOperationalMetadata?.hallwayClass);

  assert.deepEqual(hallwayClasses, ["main", "ems"]);
  assert.equal(plan.hallways[0].hallwayOperationalMetadata.allowsBedMovement, true);
  assert.equal(plan.hallways[1].hallwayOperationalMetadata.allowsPublicTraffic, false);

  writeEvidence("hallway-metadata-contract-output.json", {
    issue: "201",
    status: "passed",
    hallwayCount: plan.hallways.length,
    hallwayClasses,
    congestionLevels: plan.hallways.map((hallway) => hallway.hallwayOperationalMetadata?.congestionLevel)
  });
});

test("hallway operational metadata rejects invalid enum and narrative fields", () => {
  const invalidClass = readFixture("plan-er-pod-phase2.json");
  invalidClass.hallways[0].hallwayOperationalMetadata.hallwayClass = "public";
  assert.throws(
    () => validatePlanContract(invalidClass),
    /hallways\[0\]\.hallwayOperationalMetadata\.hallwayClass must be one of/
  );

  const rejectedValue = "Narrative hallway metadata";
  const freeText = readFixture("plan-er-pod-phase2.json");
  freeText.hallways[0].hallwayOperationalMetadata.freeText = rejectedValue;
  assert.throws(
    () => validatePlanContract(freeText),
    (error) => {
      assert.match(error.message, /hallwayOperationalMetadata\.freeText is not allowed/);
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );
});

test("hallway metadata does not change path travel output", () => {
  const plan = readFixture("plan-er-pod-phase2.json");
  const outputWithMetadata = calculatePathTravelTime({
    plan,
    originNodeId: "node-station-primary",
    destinationNodeId: "node-door-room-04",
    walkingSpeedFeetPerMinute: 240
  });

  const planWithoutMetadata = {
    ...plan,
    hallways: plan.hallways.map(({ hallwayOperationalMetadata, ...hallway }) => hallway)
  };
  const outputWithoutMetadata = calculatePathTravelTime({
    plan: planWithoutMetadata,
    originNodeId: "node-station-primary",
    destinationNodeId: "node-door-room-04",
    walkingSpeedFeetPerMinute: 240
  });

  assert.deepEqual(outputWithMetadata.routeNodeIds, outputWithoutMetadata.routeNodeIds);
  assert.deepEqual(outputWithMetadata.routeEdgeIds, outputWithoutMetadata.routeEdgeIds);
  assert.equal(outputWithMetadata.travelDistanceFeet, outputWithoutMetadata.travelDistanceFeet);
  assert.equal(outputWithMetadata.travelSeconds, outputWithoutMetadata.travelSeconds);

  writeEvidence("hallway-path-stability-output.json", {
    issue: "201",
    status: "passed",
    routeNodeIds: outputWithMetadata.routeNodeIds,
    routeEdgeIds: outputWithMetadata.routeEdgeIds,
    travelDistanceFeet: outputWithMetadata.travelDistanceFeet,
    travelSeconds: outputWithMetadata.travelSeconds,
    metadataAffectsPathTravel: false
  });
});
