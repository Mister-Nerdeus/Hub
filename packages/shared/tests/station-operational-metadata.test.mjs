import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validatePlanContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-203");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function stationPathNodeSnapshot(plan) {
  return plan.nurseStations.map((station) => {
    const pathNode = plan.pathNodes.find((node) => node.id === station.pathNodeId);
    return {
      stationId: station.id,
      pathNodeId: station.pathNodeId,
      linkedObjectId: pathNode?.linkedObjectId ?? null,
      nodeType: pathNode?.nodeType ?? null
    };
  });
}

test("station operational metadata validates in representative fixture stations", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const station = plan.nurseStations[0];

  assert.equal(station.stationOperationalMetadata.stationClass, "primary");
  assert.equal(station.stationOperationalMetadata.supportsChargeNurse, true);
  assert.equal(station.stationOperationalMetadata.supportsPrimaryNurse, true);
  assert.equal(station.stationOperationalMetadata.supportsProvider, true);
  assert.equal(station.stationOperationalMetadata.supportsTriage, false);
  assert.equal(station.stationOperationalMetadata.visibilityLevel, "high");
  assert.equal(station.stationOperationalMetadata.defaultWalkingOrigin, true);

  writeEvidence("station-metadata-contract-output.json", {
    issue: "203",
    status: "passed",
    stationCount: plan.nurseStations.length,
    stationClasses: plan.nurseStations.map(
      (candidate) => candidate.stationOperationalMetadata?.stationClass
    ),
    defaultWalkingOriginStationIds: plan.nurseStations
      .filter((candidate) => candidate.stationOperationalMetadata?.defaultWalkingOrigin)
      .map((candidate) => candidate.id)
  });
});

test("station operational metadata rejects invalid enum, narrative, staff, and schedule fields", () => {
  const invalidClass = readFixture("plan-er-pod-phase2.json");
  invalidClass.nurseStations[0].stationOperationalMetadata.stationClass = "desk";
  assert.throws(
    () => validatePlanContract(invalidClass),
    /nurseStations\[0\]\.stationOperationalMetadata\.stationClass must be one of/
  );

  const rejectedValue = "Narrative station metadata";
  const freeText = readFixture("plan-er-pod-phase2.json");
  freeText.nurseStations[0].stationOperationalMetadata.freeText = rejectedValue;
  assert.throws(
    () => validatePlanContract(freeText),
    (error) => {
      assert.match(error.message, /stationOperationalMetadata\.freeText is not allowed/);
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );

  const staffIdentity = readFixture("plan-er-pod-phase2.json");
  staffIdentity.nurseStations[0].stationOperationalMetadata.staffName = "Synthetic Staff";
  assert.throws(
    () => validatePlanContract(staffIdentity),
    /stationOperationalMetadata\.staffName is not allowed/
  );

  const schedule = readFixture("plan-er-pod-phase2.json");
  schedule.nurseStations[0].stationOperationalMetadata.shiftSchedule = "Synthetic schedule";
  assert.throws(
    () => validatePlanContract(schedule),
    /stationOperationalMetadata\.shiftSchedule is not allowed/
  );
});

test("station metadata preserves station path-node linkage and geometry", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const planWithoutMetadata = validatePlanContract({
    ...plan,
    nurseStations: plan.nurseStations.map(({ stationOperationalMetadata, ...station }) => station)
  });

  assert.deepEqual(stationPathNodeSnapshot(plan), stationPathNodeSnapshot(planWithoutMetadata));
  assert.deepEqual(
    plan.nurseStations.map(({ id, x, y, widthFeet, lengthFeet, pathNodeId }) => ({
      id,
      x,
      y,
      widthFeet,
      lengthFeet,
      pathNodeId
    })),
    planWithoutMetadata.nurseStations.map(({ id, x, y, widthFeet, lengthFeet, pathNodeId }) => ({
      id,
      x,
      y,
      widthFeet,
      lengthFeet,
      pathNodeId
    }))
  );
});
