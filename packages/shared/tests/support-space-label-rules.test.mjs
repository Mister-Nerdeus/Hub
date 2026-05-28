import assert from "node:assert/strict";
import test from "node:test";

import { supportSpaceInternalReference, supportSpaceVisibleLabel } from "../dist/index.js";

test("storage and solid wall visible labels do not look like patient-room numbers", () => {
  assert.equal(supportSpaceVisibleLabel({ roomType: "storage", label: "14" }), "Storage");
  assert.equal(supportSpaceVisibleLabel({ roomType: "solid_wall", label: "99" }), "Wall");
  assert.equal(supportSpaceInternalReference({ roomType: "storage", label: "14" }), "14");
});

test("patient room labels pass through unchanged", () => {
  assert.equal(supportSpaceVisibleLabel({ roomType: "standard", label: "19" }), "19");
  assert.equal(supportSpaceInternalReference({ roomType: "standard", label: "19" }), null);
});
