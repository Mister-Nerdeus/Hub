import assert from "node:assert/strict";
import test from "node:test";
import { buildCorrectedPlanRouteExportMatrix } from "../dist/index.js";

const sha = "b".repeat(64);
const cleanAudit = {
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

function entry(planId, overrides = {}) {
  return {
    planId,
    sourceDefaultPlanId: `default-er-layout-${planId}`,
    correctedSavedCopyPath: `packages/shared/fixtures/source-corrections/${planId}/${planId}-corrected-saved-copy.json`,
    correctedSavedCopyHashBefore: sha,
    repairedSavedCopyPath: `packages/shared/fixtures/source-corrections/${planId}/${planId}-route-repaired-saved-copy.json`,
    repairedSavedCopyHash: sha,
    routeRepairReportPath: `packages/shared/fixtures/source-corrections/${planId}/${planId}-route-repair-report.json`,
    routeRepairReportHash: sha,
    simulationReadyExportPath: `packages/shared/fixtures/source-corrections/${planId}/${planId}-simulation-ready-export.json`,
    simulationReadyExportHash: sha,
    routeRepairStatus: "repaired",
    pathSyncStatus: "fresh",
    routeAudit: cleanAudit,
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

test("route export matrix classifies ready and blocked plans", () => {
  const matrix = buildCorrectedPlanRouteExportMatrix({
    manifestVersion: "1.0.0",
    batch: "311-320",
    lastUpdatedIssue: "318",
    correctedPlanReviewManifestPath: "docs/verification/corrected-plan-review-manifest.json",
    correctedPlanReviewManifestHash: sha,
    repairedPlans: [
      entry("plan-2"),
      entry("plan-3", {
        pathSyncStatus: "stale_warning",
        simulationReadyExportStatus: "blocked_path_sync",
        simulationReadyExportPath: undefined,
        simulationReadyExportHash: undefined,
        promotionCandidateStatus: "blocked_by_export_status",
        blockingIssues: ["PATH_SYNC_NOT_FRESH"]
      })
    ],
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
    goNoGoStatus: "GO for matrix proof"
  });
  assert.equal(matrix[0].routeClassification, "route_ready");
  assert.equal(matrix[0].exportClassification, "simulation_ready");
  assert.equal(matrix[1].exportClassification, "export_blocked");
  assert.deepEqual(matrix[1].blockers, ["PATH_SYNC_NOT_FRESH"]);
});

test("route export matrix blocks incomplete route audits even with an export artifact", () => {
  const matrix = buildCorrectedPlanRouteExportMatrix({
    manifestVersion: "1.0.0",
    batch: "311-320",
    lastUpdatedIssue: "318",
    correctedPlanReviewManifestPath: "docs/verification/corrected-plan-review-manifest.json",
    correctedPlanReviewManifestHash: sha,
    repairedPlans: [
      entry("plan-2", {
        routeAudit: {
          ...cleanAudit,
          roomsMissingDoor: ["room-without-door"]
        }
      })
    ],
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
    goNoGoStatus: "GO for matrix proof"
  });
  assert.equal(matrix[0].routeClassification, "route_blocked");
  assert.equal(matrix[0].proof.routeAuditPassed, false);
});
