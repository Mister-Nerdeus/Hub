import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEMO_PIN_CODE,
  DEMO_PROTECTED_ACTION_IDS,
  assertDemoPinContractHasNoClaims,
  demoPinContract,
  isDemoProtectedActionId,
  validateDemoPin
} from "../dist/index.js";

test("demo PIN contract stays demo-only", () => {
  assert.equal(DEMO_PIN_CODE, "2026");
  assert.equal(demoPinContract.demoOnly, true);
  assert.match(demoPinContract.copy, /Demo proceed gate only/u);
  assert.doesNotThrow(() => assertDemoPinContractHasNoClaims());
});

test("PIN 2026 unlocks and wrong or empty PIN fails", () => {
  assert.deepEqual(validateDemoPin("2026"), { ok: true, state: "unlocked" });
  assert.deepEqual(validateDemoPin("0000"), { ok: false, state: "wrong_pin", reason: "wrong_pin" });
  assert.deepEqual(validateDemoPin(""), { ok: false, state: "cleared", reason: "empty_pin" });
});

test("protected demo action IDs are explicit", () => {
  for (const actionId of [
    "edit_working_copy",
    "proceed_to_assignments",
    "proceed_to_ratio_comparison",
    "export_report_placeholder"
  ]) {
    assert.equal(isDemoProtectedActionId(actionId), true);
  }
  assert.equal(DEMO_PROTECTED_ACTION_IDS.length, 4);
  assert.equal(isDemoProtectedActionId("view_floorplan"), false);
});
