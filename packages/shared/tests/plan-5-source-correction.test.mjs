import assert from "node:assert/strict";
import {
  buildPlanCorrection,
  writeCorrectionArtifacts
} from "./source-correction-test-helpers.mjs";

const result = buildPlanCorrection(5, 298);
writeCorrectionArtifacts(result);

assert.equal(result.correctedCopy.sourceDefaultPlanId, "default-er-layout-plan-5");
assert.equal(result.sourceFixtureUnchanged, true);
assert.equal(result.correctedCopy.correctionMetadata.exactParityClaimMade, false);
assert.ok(result.correctedCopy.correctionMetadata.renderedVisualEvidencePath.endsWith("plan-5-corrected-copy-pass-1.png"));
assert.ok(result.exportAttempt.status.length > 0);
