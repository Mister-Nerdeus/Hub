import assert from "node:assert/strict";
import test from "node:test";

import {
  NURSE_RATIO_NON_CLAIM_COPY,
  fourToOneNurseRatio,
  threeToOneNurseRatio,
  validateNurseRatioContract
} from "../dist/index.js";

test("4:1 and 3:1 ratio contracts validate as operational models", () => {
  assert.equal(validateNurseRatioContract(fourToOneNurseRatio).maxOccupiedRoomsPerNurse, 4);
  assert.equal(validateNurseRatioContract(threeToOneNurseRatio).maxOccupiedRoomsPerNurse, 3);
  assert.equal(fourToOneNurseRatio.nonClaimCopy, NURSE_RATIO_NON_CLAIM_COPY);
  assert.match(threeToOneNurseRatio.nonClaimCopy, /Operational modeling only/);
});

test("unsupported ratio values fail", () => {
  assert.throws(
    () => validateNurseRatioContract({ ...fourToOneNurseRatio, ratioId: "two_to_one" }),
    /ratioId/
  );
  assert.throws(
    () => validateNurseRatioContract({ ...fourToOneNurseRatio, maxOccupiedRoomsPerNurse: 5 }),
    /declared ratioId/
  );
});
