import {
  validateCorrectedPlanRouteRepairManifest,
  type CorrectedPlanRouteRepairManifest
} from "./correctedPlanRouteRepairManifest.js";

export type CorrectedPlanRouteExportMatrixEntry = {
  planId: string;
  routeClassification: "route_ready" | "route_blocked";
  exportClassification: "simulation_ready" | "export_blocked";
  promotionClassification:
    | "manual_review_candidate"
    | "future_promotion_review_candidate"
    | "not_candidate";
  pathSyncFresh: boolean;
  blockers: string[];
  proof: {
    repairedSavedCopyPath: string;
    routeRepairReportPath: string;
    simulationReadyExportPath: string | null;
    routeAuditPassed: boolean;
    simulationReadyExportValid: boolean;
  };
};

export function buildCorrectedPlanRouteExportMatrix(
  manifestValue: CorrectedPlanRouteRepairManifest | unknown
): CorrectedPlanRouteExportMatrixEntry[] {
  const manifest = validateCorrectedPlanRouteRepairManifest(manifestValue);
  return manifest.repairedPlans
    .map((plan) => {
      const routeAuditPassed = plan.routeAudit.roomsMissingPathNode.length === 0 &&
        plan.routeAudit.unreachableRoomIds.length === 0 &&
        plan.routeAudit.danglingPathEdgeIds.length === 0 &&
        plan.routeAudit.nonFinitePathEdgeIds.length === 0 &&
        plan.routeAudit.nonPositivePathEdgeIds.length === 0 &&
        plan.routeAudit.stationToRoomRoutesChecked === plan.routeAudit.stationToRoomRoutesPassed;
      const simulationReadyExportValid = plan.pathSyncStatus === "fresh" &&
        plan.simulationReadyExportStatus === "simulation_ready" &&
        plan.simulationReadyExportPath != null &&
        plan.simulationReadyExportHash != null &&
        plan.privateSourcePayloadStored === false;
      const promotionClassification = plan.promotionCandidateStatus === "manual_review_candidate"
        ? "manual_review_candidate"
        : plan.promotionCandidateStatus === "future_promotion_review_candidate"
          ? "future_promotion_review_candidate"
          : "not_candidate";
      return {
        planId: plan.planId,
        routeClassification: routeAuditPassed ? "route_ready" : "route_blocked",
        exportClassification: simulationReadyExportValid ? "simulation_ready" : "export_blocked",
        promotionClassification,
        pathSyncFresh: plan.pathSyncStatus === "fresh",
        blockers: [...plan.blockingIssues],
        proof: {
          repairedSavedCopyPath: plan.repairedSavedCopyPath,
          routeRepairReportPath: plan.routeRepairReportPath,
          simulationReadyExportPath: plan.simulationReadyExportPath ?? null,
          routeAuditPassed,
          simulationReadyExportValid
        }
      } satisfies CorrectedPlanRouteExportMatrixEntry;
    })
    .sort((left, right) => left.planId.localeCompare(right.planId));
}
