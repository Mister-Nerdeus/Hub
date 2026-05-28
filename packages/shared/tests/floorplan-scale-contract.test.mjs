import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_BASE_ROOM_MODULE_FEET,
  CANONICAL_FLOORPLAN_ID,
  canonicalScaleExceptionForObject,
  isBaseTenByTenModule,
  isCanonicalFeetScale,
  requiresBaseTenByTenModule
} from "../dist/index.js";

test("canonical scale contract uses feet and a 10 ft x 10 ft base module", () => {
  assert.equal(CANONICAL_FLOORPLAN_ID, "default-er-layout-plan-1");
  assert.deepEqual(CANONICAL_BASE_ROOM_MODULE_FEET, { width: 10, height: 10 });
  assert.equal(
    isCanonicalFeetScale({ unit: "feet", pixelsPerUnit: 6, gridSizeFeet: 1, snapToGrid: true, origin: "top-left" }),
    true
  );
});

test("base module checks distinguish standard rooms from documented exceptions", () => {
  assert.equal(isBaseTenByTenModule({ id: "room-19", widthFeet: 10, lengthFeet: 10 }), true);
  assert.equal(requiresBaseTenByTenModule({ id: "room-19", widthFeet: 10, lengthFeet: 10 }), true);
  assert.equal(canonicalScaleExceptionForObject("room-level-1-trauma")?.kind, "trauma");
  assert.equal(requiresBaseTenByTenModule({ id: "room-level-1-trauma", widthFeet: 20, lengthFeet: 20 }), false);
});
