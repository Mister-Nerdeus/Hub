import assert from "node:assert/strict";
import test from "node:test";

import { CANONICAL_HALLWAY_CORRIDORS } from "../dist/index.js";

test("canonical hallways are pannable route-readiness spaces, not patient rooms", () => {
  assert.equal(CANONICAL_HALLWAY_CORRIDORS.length >= 7, true);
  for (const corridor of CANONICAL_HALLWAY_CORRIDORS) {
    assert.equal(corridor.patientCareEligible, false, corridor.hallwayId);
    assert.equal(corridor.assignmentEligible, false, corridor.hallwayId);
    assert.equal(corridor.pannableBackgroundEligible, true, corridor.hallwayId);
    assert.equal(corridor.routeReadinessOnly, true, corridor.hallwayId);
  }
});
