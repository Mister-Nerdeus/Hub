import type { HumanReviewIntakeManifest } from "./humanReviewIntakeManifest.js";

export type HumanReviewPromotionRecheckPlan = {
  planId: string;
  manualReviewStatus: string;
  identityStatus: string;
  authorityStatus: string;
  attestationStatus: "not_required_until_record_exists" | "present" | "missing_or_invalid";
  routeExportStatus: string;
  boundaryStatus: "passed" | "failed";
  dryRunStatus: "blocked_missing_manual_review" | "dry_run_ready" | "blocked_invalid_review_record" | "blocked_by_route_export" | "blocked_by_boundary";
  canPromote: false;
  blockingReasons: string[];
};

export type HumanReviewPromotionRecheck = {
  recheckVersion: string;
  batch: "341-350";
  dryRunOnly: true;
  promotionStatus: "blocked" | "dry_run_only";
  allPlansDryRunReady: boolean;
  plans: HumanReviewPromotionRecheckPlan[];
};

export function buildHumanReviewPromotionRecheck(
  manifest: HumanReviewIntakeManifest
): HumanReviewPromotionRecheck {
  const plans: HumanReviewPromotionRecheckPlan[] = manifest.reviewedPlans.map((entry) => {
    const blockingReasons = [...entry.blockingIssues];
    const approved =
      entry.manualReviewStatus === "approved_for_promotion_review" ||
      entry.manualReviewStatus === "approved_with_notes";
    if (
      !approved
    ) {
      blockingReasons.push("missing valid structured human approval");
    }
    if (entry.reviewerIdentityStatus !== "present" && entry.submittedReviewRecordPath != null) {
      blockingReasons.push("reviewer identity is not valid");
    }
    if (entry.reviewerAuthorityStatus !== "authorized" && entry.submittedReviewRecordPath != null) {
      blockingReasons.push("reviewer authority is not valid");
    }
    if (entry.routeReadinessStatus !== "ready" || entry.simulationReadyExportStatus !== "simulation_ready") {
      blockingReasons.push("route/export readiness is blocked");
    }
    if (manifest.privateSourceBoundaryStatus !== "passed" || manifest.noPhiStatus !== "passed") {
      blockingReasons.push("boundary or no-PHI status is blocked");
    }
    const dryRunStatus: HumanReviewPromotionRecheckPlan["dryRunStatus"] =
      manifest.privateSourceBoundaryStatus !== "passed" || manifest.noPhiStatus !== "passed"
        ? "blocked_by_boundary"
        : entry.routeReadinessStatus !== "ready" || entry.simulationReadyExportStatus !== "simulation_ready"
          ? "blocked_by_route_export"
          : entry.manualReviewStatus === "blocked_invalid_review_record" ||
            entry.reviewerIdentityStatus === "invalid" ||
            entry.reviewerAuthorityStatus === "unauthorized"
            ? "blocked_invalid_review_record"
            : approved
              ? entry.promotionReadinessDryRunStatus
              : "blocked_missing_manual_review";
    return {
      planId: entry.planId,
      manualReviewStatus: entry.manualReviewStatus,
      identityStatus: entry.reviewerIdentityStatus,
      authorityStatus: entry.reviewerAuthorityStatus,
      attestationStatus: (entry.submittedReviewRecordPath == null
        ? "not_required_until_record_exists"
        : entry.reviewerIdentityStatus === "present" && entry.reviewerAuthorityStatus === "authorized"
          ? "present"
          : "missing_or_invalid") as HumanReviewPromotionRecheckPlan["attestationStatus"],
      routeExportStatus: `${entry.routeReadinessStatus}/${entry.simulationReadyExportStatus}`,
      boundaryStatus: manifest.privateSourceBoundaryStatus === "passed" && manifest.noPhiStatus === "passed" ? "passed" : "failed",
      dryRunStatus,
      canPromote: false as const,
      blockingReasons: [...new Set(blockingReasons)]
    };
  });
  return {
    recheckVersion: "1.0.0",
    batch: "341-350",
    dryRunOnly: true,
    promotionStatus: manifest.promotionStatus,
    allPlansDryRunReady: plans.every((plan) => plan.dryRunStatus === "dry_run_ready" && plan.blockingReasons.length === 0),
    plans
  };
}
