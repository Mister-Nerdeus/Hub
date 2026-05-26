import assert from "node:assert/strict";
import {
  buildPlanCorrection,
  writeCorrectionArtifacts
} from "./source-correction-test-helpers.mjs";

const result = buildPlanCorrection(2, 292);
writeCorrectionArtifacts(result);

assert.equal(result.correctedCopy.sourceDefaultPlanId, "default-er-layout-plan-2");
assert.equal(result.sourceFixtureUnchanged, true);
assert.equal(result.correctedCopy.correctionMetadata.privateSourcePayloadStored, undefined);
assert.equal(result.correctedCopy.correctionMetadata.exactParityClaimMade, false);
assert.equal(result.exportAttempt.status === "blocked_path_sync" || result.exportAttempt.status === "simulation_ready" || result.exportAttempt.status === "draft_has_warnings", true);
