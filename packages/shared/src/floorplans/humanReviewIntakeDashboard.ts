import type { HumanReviewIntakeManifest } from "./humanReviewIntakeManifest.js";

export type HumanReviewIntakeDashboardPlan = {
  planId: string;
  submittedRecordStatus: "missing" | "present";
  recordValidationStatus: "missing" | "valid" | "invalid";
  reviewerIdentityStatus: string;
  reviewerAuthorityStatus: string;
  manualReviewStatus: string;
  promotionReadinessDryRunStatus: string;
  canPromote: false;
  blockingIssues: string[];
};

export type HumanReviewIntakeDashboard = {
  dashboardVersion: string;
  batch: "341-350";
  sourceManifestStatus: string;
  promotionStatus: "blocked" | "dry_run_only";
  allRequiredApprovalsValid: boolean;
  plans: HumanReviewIntakeDashboardPlan[];
};

export function buildHumanReviewIntakeDashboard(
  manifest: HumanReviewIntakeManifest
): HumanReviewIntakeDashboard {
  const plans: HumanReviewIntakeDashboardPlan[] = manifest.reviewedPlans.map((entry) => {
    const submittedRecordStatus: HumanReviewIntakeDashboardPlan["submittedRecordStatus"] =
      entry.submittedReviewRecordPath == null ? "missing" : "present";
    const recordValidationStatus: HumanReviewIntakeDashboardPlan["recordValidationStatus"] = submittedRecordStatus === "missing"
      ? "missing"
      : entry.manualReviewStatus === "blocked_invalid_review_record" || entry.reviewerIdentityStatus === "invalid"
        ? "invalid"
        : "valid";
    return {
      planId: entry.planId,
      submittedRecordStatus,
      recordValidationStatus,
      reviewerIdentityStatus: entry.reviewerIdentityStatus,
      reviewerAuthorityStatus: entry.reviewerAuthorityStatus,
      manualReviewStatus: entry.manualReviewStatus,
      promotionReadinessDryRunStatus: entry.promotionReadinessDryRunStatus,
      canPromote: false as const,
      blockingIssues: entry.blockingIssues
    };
  });
  return {
    dashboardVersion: "1.0.0",
    batch: "341-350",
    sourceManifestStatus: manifest.intakeStatus,
    promotionStatus: manifest.promotionStatus,
    allRequiredApprovalsValid: plans.every(
      (plan) =>
        plan.recordValidationStatus === "valid" &&
        (plan.manualReviewStatus === "approved_for_promotion_review" ||
          plan.manualReviewStatus === "approved_with_notes")
    ),
    plans
  };
}

export function renderHumanReviewIntakeDashboardMarkdown(
  dashboard: HumanReviewIntakeDashboard
): string {
  const lines = [
    "# Human Review Intake Dashboard",
    "",
    "Status-only dashboard for structured human review intake. It does not approve visual correctness and does not promote default fixtures.",
    "",
    `Promotion status: ${dashboard.promotionStatus}`,
    `All required approvals valid: ${dashboard.allRequiredApprovalsValid ? "yes" : "no"}`,
    "",
    "| Plan | Submitted record | Record validation | Manual review | Identity | Authority | Promotion dry run | Blocking issues |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |"
  ];
  for (const plan of dashboard.plans) {
    lines.push(
      `| ${plan.planId} | ${plan.submittedRecordStatus} | ${plan.recordValidationStatus} | ${plan.manualReviewStatus} | ${plan.reviewerIdentityStatus} | ${plan.reviewerAuthorityStatus} | ${plan.promotionReadinessDryRunStatus} | ${plan.blockingIssues.join("; ") || "none"} |`
    );
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
