import {
  validateCorrectedPlanReviewManifest,
  type CorrectedPlanReviewManifest
} from "./correctedPlanReviewManifest.js";

export type CorrectedPlanReadinessMatrixEntry = {
  planId: string;
  renderedEvidenceReady: boolean;
  machineVisualSanityReady: boolean;
  routeReady: boolean;
  simulationExportReady: boolean;
  privateSourceBoundaryPassed: boolean;
  sourceFixtureUnchanged: boolean;
  promotionCandidateStatus: string;
  blockingIssues: string[];
  warningIssues: string[];
};

export function buildCorrectedPlanReadinessMatrix(
  manifestValue: CorrectedPlanReviewManifest | unknown
): CorrectedPlanReadinessMatrixEntry[] {
  const manifest = validateCorrectedPlanReviewManifest(manifestValue);
  return manifest.reviewedPlans.map((plan) => ({
    planId: plan.planId,
    renderedEvidenceReady: plan.renderedEvidenceHash.length === 64 && plan.renderedEvidencePath.length > 0,
    machineVisualSanityReady: plan.machineVisualSanityStatus === "passed" || plan.machineVisualSanityStatus === "warning",
    routeReady: plan.routeAuditStatus === "passed" || plan.routeAuditStatus === "warning",
    simulationExportReady: plan.simulationReadyExportStatus === "simulation_ready" || plan.simulationReadyExportStatus === "draft_has_warnings",
    privateSourceBoundaryPassed: plan.privateSourcePayloadStored === false && plan.exactParityClaimMade === false,
    sourceFixtureUnchanged: plan.sourceFixtureUnchanged,
    promotionCandidateStatus: plan.promotionCandidateStatus,
    blockingIssues: [...plan.blockingIssues],
    warningIssues: [...plan.warningIssues]
  }));
}
