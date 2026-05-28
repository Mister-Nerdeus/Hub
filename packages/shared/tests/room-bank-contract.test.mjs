import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { CANONICAL_ROOM_BANKS, roomBankForPatientCareRoom } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const plan = JSON.parse(readFileSync(join(repoRoot, "packages/shared/fixtures/default-plans/default-er-layout-plan-1.json"), "utf8")).plan;

test("canonical room banks account for all patient-care Plan 1 rooms", () => {
  const patientRoomIds = plan.rooms
    .filter((room) => !["storage", "solid_wall"].includes(room.roomType))
    .map((room) => room.id);
  for (const roomId of patientRoomIds) {
    assert.ok(roomBankForPatientCareRoom(roomId), roomId);
  }
});

test("support objects are not modeled as patient-care room-bank members", () => {
  const supportIds = CANONICAL_ROOM_BANKS.flatMap((bank) => bank.supportObjectIds);
  assert.ok(supportIds.includes("room-14"));
  assert.ok(supportIds.includes("zone-provider-pharmacy"));
  assert.equal(roomBankForPatientCareRoom("room-14"), null);
});
