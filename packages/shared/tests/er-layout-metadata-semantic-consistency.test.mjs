import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validatePlanContract } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-207");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function entryNode(plan) {
  return plan.pathNodes.find((node) => node.nodeType === "entry");
}

test("canonical metadata fixture keeps special room and door semantics coherent", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const checks = [
    {
      roomId: "room-02",
      doorId: "door-room-02",
      roomClass: "trauma",
      doorClass: "trauma",
      traumaAccess: true
    },
    {
      roomId: "room-03",
      doorId: "door-room-03",
      roomClass: "isolation",
      doorClass: "isolation",
      isolationBoundary: true
    },
    {
      roomId: "room-04",
      doorId: "door-room-04",
      roomClass: "behavioral",
      doorClass: "behavioral",
      behavioralBoundary: true
    }
  ];

  for (const check of checks) {
    const room = plan.rooms.find((candidate) => candidate.id === check.roomId);
    const door = plan.doors.find((candidate) => candidate.id === check.doorId);
    assert.equal(room.roomOperationalMetadata.roomClass, check.roomClass);
    assert.equal(door.doorOperationalMetadata.doorClass, check.doorClass);
    if (check.traumaAccess != null) {
      assert.equal(door.doorOperationalMetadata.traumaAccess, check.traumaAccess);
    }
    if (check.isolationBoundary != null) {
      assert.equal(door.doorOperationalMetadata.isolationBoundary, check.isolationBoundary);
    }
    if (check.behavioralBoundary != null) {
      assert.equal(door.doorOperationalMetadata.behavioralBoundary, check.behavioralBoundary);
    }
  }

  writeEvidence("canonical-fixture-repair-output.json", {
    issue: "207",
    status: "passed",
    fixture: "plan-er-pod-phase2.json",
    specialRoomDoorChecks: checks,
    defaultImportReadiness: "GO"
  });
});

test("plan contract rejects special room door semantic mismatches", () => {
  const wrongDoorClass = readFixture("plan-er-pod-phase2.json");
  wrongDoorClass.doors.find((door) => door.id === "door-room-02").doorOperationalMetadata.doorClass =
    "isolation";
  assert.throws(
    () => validatePlanContract(wrongDoorClass),
    /doorOperationalMetadata\.doorClass must match room metadata/
  );

  const wrongBoundary = readFixture("plan-er-pod-phase2.json");
  wrongBoundary.doors.find((door) => door.id === "door-room-03").doorOperationalMetadata.isolationBoundary =
    false;
  assert.throws(
    () => validatePlanContract(wrongBoundary),
    /doorOperationalMetadata must match isolation room metadata/
  );

  writeEvidence("metadata-semantic-consistency-output.json", {
    issue: "207",
    status: "passed",
    rejectedDoorClassMismatch: true,
    rejectedBoundaryMismatch: true,
    typeScriptSemanticValidation: "aligned-with-python"
  });
});

test("entry linkedPathNodeId references another node and rejects self-reference", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const entry = entryNode(plan);
  assert.equal(entry.entryOperationalMetadata.linkedPathNodeId, "node-hall-west");
  assert.notEqual(entry.entryOperationalMetadata.linkedPathNodeId, entry.id);

  const selfReference = readFixture("plan-er-pod-phase2.json");
  entryNode(selfReference).entryOperationalMetadata.linkedPathNodeId = "node-ems-entry";
  assert.throws(
    () => validatePlanContract(selfReference),
    /entryOperationalMetadata\.linkedPathNodeId must not self-reference/
  );

  writeEvidence("entry-link-semantics-output.json", {
    issue: "207",
    status: "passed",
    entryNodeId: entry.id,
    linkedPathNodeId: entry.entryOperationalMetadata.linkedPathNodeId,
    selfReferenceRejected: true
  });
});
