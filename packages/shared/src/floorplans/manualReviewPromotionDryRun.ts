import type { ManualVisualReviewEntry } from "./manualVisualReviewManifest.js";

export type ManualReviewPromotionDryRunInput = {
  plan: ManualVisualReviewEntry;
  defaultFixturePath: string;
  defaultFixtureHash: string;
  rollbackPackagePath: string;
  rollbackPackageHash?: string;
  privateSourceBoundaryPassed: boolean;
  noPhiPassed: boolean;
};

export type ManualReviewPromotionDryRunResult = {
  planId: ManualVisualReviewEntry["planId"];
  status:
    | "blocked_missing_manual_review"
    | "dry_run_ready"
    | "blocked_by_route_export"
    | "blocked_by_boundary";
  defaultFixturePath: string;
  defaultFixtureHash: string;
  repairedSavedCopyPath: string;
  repairedSavedCopyHash: string;
  simulationReadyExportPath: string;
  simulationReadyExportHash: string;
  manualReviewStatus: ManualVisualReviewEntry["manualReviewStatus"];
  blockingReasons: string[];
  rollbackRequirements: string[];
  dryRunOnly: true;
  defaultFixtureMutated: false;
};

export function buildManualReviewPromotionDryRun(
  input: ManualReviewPromotionDryRunInput
): ManualReviewPromotionDryRunResult {
  const blockingReasons: string[] = [];
  if (input.plan.routeReadinessStatus !== "ready" || input.plan.simulationReadyExportStatus !== "simulation_ready") {
    blockingReasons.push("route/export readiness is not complete");
  }
  if (!(
    input.plan.manualReviewStatus === "approved_for_promotion_review" ||
    input.plan.manualReviewStatus === "approved_with_notes"
  )) {
    blockingReasons.push("missing explicit manual visual review approval");
  }
  if (input.plan.reviewerDecisionSource === "none") {
    blockingReasons.push("reviewer decision source is none");
  }
  if (!input.privateSourceBoundaryPassed || !input.noPhiPassed) {
    blockingReasons.push("boundary checks are not passing");
  }
  if (input.rollbackPackageHash == null) {
    blockingReasons.push("rollback package hash is missing");
  }

  const status = blockingReasons.includes("route/export readiness is not complete")
    ? "blocked_by_route_export"
    : blockingReasons.includes("boundary checks are not passing")
      ? "blocked_by_boundary"
      : blockingReasons.length > 0
        ? "blocked_missing_manual_review"
        : "dry_run_ready";

  return {
    planId: input.plan.planId,
    status,
    defaultFixturePath: input.defaultFixturePath,
    defaultFixtureHash: input.defaultFixtureHash,
    repairedSavedCopyPath: input.plan.repairedSavedCopyPath,
    repairedSavedCopyHash: input.plan.repairedSavedCopyHash,
    simulationReadyExportPath: input.plan.simulationReadyExportPath,
    simulationReadyExportHash: input.plan.simulationReadyExportHash,
    manualReviewStatus: input.plan.manualReviewStatus,
    blockingReasons,
    rollbackRequirements: [
      "Record default fixture hash before any future promotion-review batch.",
      "Record repaired saved-copy hash before any future promotion-review batch.",
      "Keep rollback command plan separate from dry-run evidence.",
      "Do not mutate default fixtures during dry run."
    ],
    dryRunOnly: true,
    defaultFixtureMutated: false
  };
}
