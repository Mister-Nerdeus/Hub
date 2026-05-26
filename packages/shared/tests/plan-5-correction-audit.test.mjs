import assert from "node:assert/strict";
import {
  buildPlanCorrection,
  writeAuditArtifacts,
  writeCorrectionArtifacts
} from "./source-correction-test-helpers.mjs";

const result = buildPlanCorrection(5, 298);
writeCorrectionArtifacts(result);
const audit = writeAuditArtifacts(result, 299);

assert.equal(audit.planId, "plan-5");
assert.equal(audit.sourceFixtureUnchanged, true);
assert.equal(audit.privateSourcePayloadStored, false);
assert.equal(audit.exactParityClaimMade, false);
assert.ok(audit.routeAuditStatus.length > 0);
assert.ok(audit.simulationReadyExportStatus.length > 0);
