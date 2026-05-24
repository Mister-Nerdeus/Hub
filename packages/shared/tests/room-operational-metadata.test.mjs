import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  NO_PHI_RUNTIME_REJECTION_CODE,
  validatePlanContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-199");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function assertRuntimeRejection(action, rejectedValue) {
  assert.throws(
    action,
    (error) => {
      assert.match(error.message, new RegExp(NO_PHI_RUNTIME_REJECTION_CODE));
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );
}

test("room operational metadata validates in the ER pod fixture", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const roomClasses = plan.rooms.map((room) => room.roomOperationalMetadata?.roomClass);

  assert.deepEqual(roomClasses, [
    "standard",
    "trauma",
    "isolation",
    "behavioral",
    "procedure",
    "overflow",
    "hall_bed"
  ]);
  assert.equal(plan.rooms[1].roomOperationalMetadata.traumaAdjacent, true);
  assert.equal(plan.rooms[2].roomOperationalMetadata.isolationReady, true);
  assert.equal(plan.rooms[3].roomOperationalMetadata.behavioralReady, true);

  writeEvidence("room-operational-metadata-output.json", {
    issue: "199",
    status: "passed",
    roomCount: plan.rooms.length,
    roomClasses,
    capacityCategories: plan.rooms.map((room) => room.roomOperationalMetadata?.capacityCategory)
  });
});

test("room operational metadata rejects invalid enum and free-text fields", () => {
  const invalidEnum = readFixture("plan-er-pod-phase2.json");
  invalidEnum.rooms[0].roomOperationalMetadata.roomClass = "resuscitation";
  assert.throws(
    () => validatePlanContract(invalidEnum),
    /rooms\[0\]\.roomOperationalMetadata\.roomClass must be one of/
  );

  const rejectedValue = "Narrative room metadata";
  const freeText = readFixture("plan-er-pod-phase2.json");
  freeText.rooms[0].roomOperationalMetadata.freeText = rejectedValue;
  assert.throws(
    () => validatePlanContract(freeText),
    (error) => {
      assert.match(error.message, /roomOperationalMetadata\.freeText is not allowed/);
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );
});

test("room operational metadata and labels remain no-PHI guarded", () => {
  const rejectedRoomNumber = ["D", "OB 01/02/1980"].join("");
  const badRoomNumber = readFixture("plan-er-pod-phase2.json");
  badRoomNumber.rooms[0].roomOperationalMetadata.roomNumber = rejectedRoomNumber;
  assertRuntimeRejection(() => validatePlanContract(badRoomNumber), rejectedRoomNumber);

  const rejectedLabel = ["John", "Smith"].join(" ");
  const badLabel = readFixture("plan-er-pod-phase2.json");
  badLabel.rooms[0].label = rejectedLabel;
  assertRuntimeRejection(() => validatePlanContract(badLabel), rejectedLabel);

  writeEvidence("no-phi-room-metadata-output.json", {
    issue: "199",
    status: "passed",
    roomNumberGuarded: true,
    roomLabelGuarded: true,
    rejectionCode: NO_PHI_RUNTIME_REJECTION_CODE,
    rejectedValuesEchoed: false
  });
});

test("metadata-rich room fixture migration is deterministic", () => {
  const sharedPlan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  assert.equal(
    sharedPlan.rooms.every((room) => room.roomOperationalMetadata != null),
    true
  );

  writeEvidence("fixture-migration-output.json", {
    issue: "199",
    status: "passed",
    fixture: "plan-er-pod-phase2.json",
    metadataRichRoomCount: sharedPlan.rooms.length,
    allRoomsHaveRoomOperationalMetadata: true
  });
});
