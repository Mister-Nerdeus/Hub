import assert from "node:assert/strict";
import {
  buildPlanCorrection,
  writeAuditArtifacts,
  writeCorrectionArtifacts
} from "./source-correction-test-helpers.mjs";

const result = buildPlanCorrection(3, 294);
writeCorrectionArtifacts(result);
const audit = writeAuditArtifacts(result, 295);

assert.equal(audit.planId, "plan-3");
assert.equal(audit.sourceFixtureUnchanged, true);
assert.equal(audit.privateSourcePayloadStored, false);
assert.equal(audit.exactParityClaimMade, false);
assert.ok(audit.routeAuditStatus.length > 0);
assert.ok(audit.simulationReadyExportStatus.length > 0);
