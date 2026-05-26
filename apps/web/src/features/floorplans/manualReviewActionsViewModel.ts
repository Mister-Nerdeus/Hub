import {
  planBuilderReviewFlowSnapshot,
  type PlanBuilderReviewFlowSnapshotPlan
} from "./generated/planBuilderReviewFlowSnapshot";
import type { PlanReviewFlowPlanId } from "./planBuilderReviewFlowTypes";

export type ManualReviewActionKind =
  | "review-packet"
  | "review-record-template"
  | "rendered-evidence"
  | "route-export-summary";

export type ManualReviewActionViewModel = {
  kind: ManualReviewActionKind;
  label: string;
  repoRelativePath: string;
  hash: string;
  available: true;
  manualReviewRequired: true;
  promotionBlocked: true;
  statusText: string;
};

export type ManualReviewPlanActionsViewModel = {
  planId: PlanReviewFlowPlanId;
  displayName: string;
  manualReviewStatus: "manual_review_required";
  promotionStatus: "blocked";
  actions: ManualReviewActionViewModel[];
};

export type ManualReviewActionsViewModel = {
  actionsId: "plan-builder-manual-review-actions-v1";
  plans: ManualReviewPlanActionsViewModel[];
  manualReviewRequiredNotice: string;
  promotionBlockedNotice: string;
};

export function createManualReviewActionsViewModel(): ManualReviewActionsViewModel {
  return {
    actionsId: "plan-builder-manual-review-actions-v1",
    plans: planBuilderReviewFlowSnapshot.plans.map(createManualReviewPlanActionsViewModel),
    manualReviewRequiredNotice: "Manual review is required before promotion.",
    promotionBlockedNotice: "Promotion is blocked."
  };
}

export function createManualReviewPlanActionsViewModel(
  plan: PlanBuilderReviewFlowSnapshotPlan
): ManualReviewPlanActionsViewModel {
  return {
    planId: plan.planId,
    displayName: plan.displayName,
    manualReviewStatus: "manual_review_required",
    promotionStatus: "blocked",
    actions: [
      createManualReviewAction("review-packet", "Review Packet Reference", plan.reviewPacketPath, plan.reviewPacketHash),
      createManualReviewAction(
        "review-record-template",
        "Review Record Template Reference",
        plan.reviewRecordTemplatePath,
        plan.reviewRecordTemplateHash
      ),
      createManualReviewAction(
        "rendered-evidence",
        "Rendered Evidence Reference",
        plan.renderedEvidencePath,
        plan.renderedEvidenceHash
      ),
      createManualReviewAction(
        "route-export-summary",
        "Route/Export Summary Reference",
        plan.routeRepairReportPath,
        plan.routeRepairReportHash
      )
    ]
  };
}

export function createManualReviewAction(
  kind: ManualReviewActionKind,
  label: string,
  repoRelativePath: string,
  hash: string
): ManualReviewActionViewModel {
  if (repoRelativePath.length === 0 || hash.length === 0) {
    throw new Error(`${kind} action reference is missing a path or hash`);
  }
  if (!isSafeManualReviewActionReference(repoRelativePath)) {
    throw new Error(`${kind} action reference is unsafe`);
  }
  return {
    kind,
    label,
    repoRelativePath,
    hash,
    available: true,
    manualReviewRequired: true,
    promotionBlocked: true,
    statusText: "Manual review required; promotion blocked."
  };
}

export function isSafeManualReviewActionReference(path: string): boolean {
  const lowered = path.toLowerCase();
  const forbiddenDocExtension = [".", "docx"].join("");
  if (
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("..") ||
    /^[a-z]:/iu.test(path) ||
    lowered.includes("private") ||
    lowered.includes("source-artifacts") ||
    lowered.endsWith(forbiddenDocExtension)
  ) {
    return false;
  }
  return [
    /^docs\/manual-review\/plan-[2-5]-review-packet\.md$/u,
    /^docs\/manual-review\/plan-[2-5]-review-record\.template\.json$/u,
    /^docs\/verification\/rendered-plans\/plan-[2-5]-rendered-review\.png$/u,
    /^packages\/shared\/fixtures\/source-corrections\/plan-[2-5]\/plan-[2-5]-route-repair-report\.json$/u
  ].some((pattern) => pattern.test(path));
}
