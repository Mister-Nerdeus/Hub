import assert from "node:assert/strict";
import test from "node:test";

import {
  activityProfileContracts,
  busyActivityProfile,
  slammedActivityProfile,
  typicalActivityProfile,
  validateActivityProfileContract
} from "../dist/index.js";

test("Typical, Busy, and Slammed activity profiles validate", () => {
  assert.deepEqual(activityProfileContracts.map((profile) => profile.label), ["Typical", "Busy", "Slammed"]);
  assert.equal(validateActivityProfileContract(typicalActivityProfile).profileId, "typical");
  assert.equal(validateActivityProfileContract(busyActivityProfile).profileId, "busy");
  assert.equal(validateActivityProfileContract(slammedActivityProfile).profileId, "slammed");
});

test("activity profiles are bounded deterministic planning inputs", () => {
  for (const profile of activityProfileContracts) {
    const validated = validateActivityProfileContract(profile);
    assert.equal(validated.assumptionsNote, "synthetic planning input");
    assert.equal(validated.deterministic, true);
    assert.equal(validated.outcomeClaim, false);
    assert.equal(validated.staffingComplianceClaim, false);
  }
});

test("activity profile validation rejects unbounded values and outcome claims", () => {
  assert.throws(
    () => validateActivityProfileContract({ ...typicalActivityProfile, occupancyPercent: 101 }),
    /bounded/
  );
  assert.throws(
    () => validateActivityProfileContract({ ...typicalActivityProfile, outcomeClaim: true }),
    /claim/
  );
});

