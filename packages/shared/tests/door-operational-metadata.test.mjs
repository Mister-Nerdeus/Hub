import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validatePlanContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-202");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function doorSyncSnapshot(plan) {
  return plan.doors.map((door) => {
    const pathNode = plan.pathNodes.find((node) => node.id === door.pathNodeId);
    return {
      doorId: door.id,
      roomId: door.roomId,
      pathNodeId: door.pathNodeId,
      linkedObjectId: pathNode?.linkedObjectId ?? null,
      nodeType: pathNode?.nodeType ?? null
    };
  });
}

test("door operational metadata validates in representative fixture doors", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const doorClasses = plan.doors.map((door) => door.doorOperationalMetadata?.doorClass);

  assert.deepEqual(doorClasses, [
    "standard",
    "isolation",
    "behavioral",
    "trauma",
    "standard",
    "standard",
    "standard"
  ]);
  assert.equal(plan.doors[1].doorOperationalMetadata.isolationBoundary, true);
  assert.equal(plan.doors[2].doorOperationalMetadata.behavioralBoundary, true);
  assert.equal(plan.doors[3].doorOperationalMetadata.traumaAccess, true);

  writeEvidence("door-metadata-contract-output.json", {
    issue: "202",
    status: "passed",
    doorCount: plan.doors.length,
    doorClasses,
    delayCategories: plan.doors.map((door) => door.doorOperationalMetadata?.delayCategory)
  });
});

test("door operational metadata rejects invalid enum and narrative fields", () => {
  const invalidClass = readFixture("plan-er-pod-phase2.json");
  invalidClass.doors[0].doorOperationalMetadata.doorClass = "public";
  assert.throws(
    () => validatePlanContract(invalidClass),
    /doors\[0\]\.doorOperationalMetadata\.doorClass must be one of/
  );

  const rejectedValue = "Narrative door metadata";
  const freeText = readFixture("plan-er-pod-phase2.json");
  freeText.doors[0].doorOperationalMetadata.freeText = rejectedValue;
  assert.throws(
    () => validatePlanContract(freeText),
    (error) => {
      assert.match(error.message, /doorOperationalMetadata\.freeText is not allowed/);
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );
});

test("door metadata preserves path-node sync references and room geometry", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const planWithoutMetadata = validatePlanContract({
    ...plan,
    doors: plan.doors.map(({ doorOperationalMetadata, ...door }) => door)
  });

  const syncSnapshot = doorSyncSnapshot(plan);
  assert.deepEqual(syncSnapshot, doorSyncSnapshot(planWithoutMetadata));
  assert.deepEqual(
    plan.rooms.map(({ id, x, y, widthFeet, lengthFeet, doorPoint, pathNodeId }) => ({
      id,
      x,
      y,
      widthFeet,
      lengthFeet,
      doorPoint,
      pathNodeId
    })),
    planWithoutMetadata.rooms.map(({ id, x, y, widthFeet, lengthFeet, doorPoint, pathNodeId }) => ({
      id,
      x,
      y,
      widthFeet,
      lengthFeet,
      doorPoint,
      pathNodeId
    }))
  );

  writeEvidence("door-sync-stability-output.json", {
    issue: "202",
    status: "passed",
    syncedDoorCount: syncSnapshot.length,
    doorPathNodeLinks: syncSnapshot,
    metadataMutatesRoomGeometry: false
  });
});
