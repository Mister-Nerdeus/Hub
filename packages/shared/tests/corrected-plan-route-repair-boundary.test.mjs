import assert from "node:assert/strict";
import test from "node:test";
import { validateCorrectedPlanRouteRepairManifest } from "../dist/index.js";

const sha = "c".repeat(64);
const audit = {
  roomsChecked: 1,
  roomsMissingDoor: [],
  roomsMissingPathNode: [],
  unreachableRoomIds: [],
  orphanPathNodeIds: [],
  danglingPathEdgeIds: [],
  invalidPathEdgeIds: [],
  nonFinitePathEdgeIds: [],
  nonPositivePathEdgeIds: [],
  blockedRequiredEdgeIds: [],
  stationToRoomRoutesChecked: 1,
  stationToRoomRoutesPassed: 1
};

function manifest(entryOverride) {
  return {
    manifestVersion: "1.0.0",
    batch: "311-320",
    lastUpdatedIssue: "319",
    correctedPlanReviewManifestPath: "docs/verification/corrected-plan-review-manifest.json",
    correctedPlanReviewManifestHash: sha,
    repairedPlans: [{
      planId: "plan-2",
      sourceDefaultPlanId: "default-er-layout-plan-2",
      correctedSavedCopyPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-corrected-saved-copy.json",
      correctedSavedCopyHashBefore: sha,
      repairedSavedCopyPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json",
      repairedSavedCopyHash: sha,
      routeRepairReportPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repair-report.json",
      routeRepairReportHash: sha,
      routeRepairStatus: "repaired",
      pathSyncStatus: "fresh",
      routeAudit: audit,
      simulationReadyExportStatus: "simulation_ready",
      privateSourcePayloadStored: false,
      exactParityClaimMade: false,
      sourceFixtureUnchanged: true,
      manualVisualReviewClaimed: false,
      promotionCandidateStatus: "manual_review_candidate",
      blockingIssues: [],
      warningIssues: [],
      limitations: ["No promotion."],
      goNoGo: "GO for manual visual review batch",
      ...entryOverride
    }],
    verifyWiringStatus: "passed",
    routeRepairProtocolStatus: "passed",
    routeAuditExecutionStatus: "partial",
    routeReadinessStatus: "partial",
    simulationReadyExportExecutionStatus: "partial",
    simulationReadyExportReadinessStatus: "partial",
    renderedEvidenceTruthStatus: "passed",
    privateSourceBoundaryStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    promotionStatus: "blocked",
    goNoGoStatus: "Boundary proof"
  };
}

test("boundary validator rejects promotion and private-source drift states", () => {
  assert.throws(() => validateCorrectedPlanRouteRepairManifest({
    ...manifest({}),
    promotionStatus: "promoted"
  }), /promotionStatus/u);
  assert.throws(() => validateCorrectedPlanRouteRepairManifest(manifest({ manualVisualReviewClaimed: true })), /manualVisualReviewClaimed/u);
  assert.throws(() => validateCorrectedPlanRouteRepairManifest(manifest({ exactParityClaimMade: true })), /exactParityClaimMade/u);
  assert.throws(() => validateCorrectedPlanRouteRepairManifest(manifest({ privateSourcePayloadStored: true })), /privateSourcePayloadStored/u);
});
