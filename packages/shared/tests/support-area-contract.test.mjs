import assert from "node:assert/strict";
import test from "node:test";

import { CANONICAL_SUPPORT_AREAS, canonicalSupportArea } from "../dist/index.js";

test("nurse stations and provider/pharmacy are non-patient support areas", () => {
  for (const objectId of ["station-left", "station-right", "zone-provider-pharmacy"]) {
    const area = canonicalSupportArea(objectId);
    assert.ok(area, objectId);
    assert.equal(area.patientCareEligible, false, objectId);
    assert.equal(area.ratioEligible, false, objectId);
    assert.equal(area.assignmentEligible, false, objectId);
    assert.equal(area.routeReadinessEligible, true, objectId);
  }
});

test("storage is support-area metadata but excluded from route-readiness math", () => {
  const storage = canonicalSupportArea("room-14");
  assert.ok(storage);
  assert.equal(storage.supportAreaType, "storage");
  assert.equal(storage.routeReadinessEligible, false);
  assert.ok(CANONICAL_SUPPORT_AREAS.some((area) => area.objectId === "zone-ems-entry"));
});
