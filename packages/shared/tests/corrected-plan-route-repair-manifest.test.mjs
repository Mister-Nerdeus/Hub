import assert from "node:assert/strict";
import test from "node:test";
import {
  validateCorrectedPlanRouteRepairManifest
} from "../dist/index.js";

const sha = "a".repeat(64);
const baseAudit = {
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

function baseManifest(overrides = {}) {
  return {
    manifestVersion: "1.0.0",
    batch: "311-320",
    lastUpdatedIssue: "312",
    correctedPlanReviewManifestPath: "docs/verification/corrected-plan-review-manifest.json",
    correctedPlanReviewManifestHash: sha,
    repairedPlans: [],
    verifyWiringStatus: "passed",
    routeRepairProtocolStatus: "passed",
    routeAuditExecutionStatus: "missing",
    routeReadinessStatus: "missing",
    simulationReadyExportExecutionStatus: "missing",
    simulationReadyExportReadinessStatus: "missing",
    renderedEvidenceTruthStatus: "not_run",
    privateSourceBoundaryStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    promotionStatus: "blocked",
    goNoGoStatus: "NO-GO pending repair",
    ...overrides
  };
}

function entry(overrides = {}) {
  return {
    planId: "plan-2",
    sourceDefaultPlanId: "default-er-layout-plan-2",
    correctedSavedCopyPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-corrected-saved-copy.json",
    correctedSavedCopyHashBefore: sha,
    repairedSavedCopyPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json",
    repairedSavedCopyHash: sha,
    routeRepairReportPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repair-report.json",
    routeRepairReportHash: sha,
    simulationReadyExportPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-simulation-ready-export.json",
    simulationReadyExportHash: sha,
    routeRepairStatus: "repaired",
    pathSyncStatus: "fresh",
    routeAudit: baseAudit,
    simulationReadyExportStatus: "simulation_ready",
    privateSourcePayloadStored: false,
    exactParityClaimMade: false,
    sourceFixtureUnchanged: true,
    manualVisualReviewClaimed: false,
    promotionCandidateStatus: "manual_review_candidate",
    blockingIssues: [],
    warningIssues: [],
    limitations: ["Graph connectivity only."],
    goNoGo: "GO for manual visual review batch",
    ...overrides
  };
}

test("route repair manifest validates required batch shape", () => {
  const manifest = validateCorrectedPlanRouteRepairManifest(baseManifest({
    repairedPlans: [entry()]
  }));
  assert.equal(manifest.batch, "311-320");
  assert.equal(manifest.repairedPlans[0].privateSourcePayloadStored, false);
});

test("route repair manifest rejects forbidden boundary states", () => {
  assert.throws(
    () => validateCorrectedPlanRouteRepairManifest(baseManifest({ repairedPlans: [entry({ manualVisualReviewClaimed: true })] })),
    /manualVisualReviewClaimed/u
  );
  assert.throws(
    () => validateCorrectedPlanRouteRepairManifest(baseManifest({ repairedPlans: [entry({ exactParityClaimMade: true })] })),
    /exactParityClaimMade/u
  );
  assert.throws(
    () => validateCorrectedPlanRouteRepairManifest(baseManifest({ repairedPlans: [entry({ privateSourcePayloadStored: true })] })),
    /privateSourcePayloadStored/u
  );
});
