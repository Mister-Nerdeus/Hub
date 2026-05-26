import assert from "node:assert/strict";
import {
  buildPlanCorrection,
  writeAuditArtifacts,
  writeCorrectionArtifacts
} from "./source-correction-test-helpers.mjs";

const result = buildPlanCorrection(2, 292);
writeCorrectionArtifacts(result);
const audit = writeAuditArtifacts(result, 293);

assert.equal(audit.planId, "plan-2");
assert.equal(audit.correctedSavedCopyPath, result.correctedSavedCopyPath);
assert.equal(audit.sourceFixtureUnchanged, true);
assert.equal(audit.privateSourcePayloadStored, false);
assert.equal(audit.exactParityClaimMade, false);
assert.ok(audit.simulationReadyExportStatus.length > 0);
assert.notEqual(audit.promotionRecommendation, "ready_for_future_promotion_review");
