import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";
import { createPlanBuilderReviewFlowViewModel } from "./planBuilderReviewFlowViewModel";

export type PlanBuilderLibraryCategoryId =
  | "default-fixtures"
  | "corrected-saved-copies"
  | "route-repaired-review-candidates"
  | "manual-review-packets";

export type PlanBuilderLibraryItemViewModel = {
  id: string;
  planId: string;
  displayName: string;
  artifactLabel: string;
  categoryId: PlanBuilderLibraryCategoryId;
  routeStatus: "ready" | "blocked" | "not_applicable";
  simulationExportStatus: "simulation_ready" | "blocked" | "not_applicable";
  manualReviewStatus: "manual_review_required" | "not_applicable";
  promotionStatus: "blocked" | "not_applicable";
  lastVerifiedIssue: string;
  repoRelativePath: string | null;
  notice: string;
};

export type PlanBuilderLibrarySectionViewModel = {
  id: PlanBuilderLibraryCategoryId;
  title: string;
  emptyText: string;
  items: PlanBuilderLibraryItemViewModel[];
};

export type PlanBuilderLibraryViewModel = {
  libraryId: "plan-builder-human-review-library-v1";
  sections: PlanBuilderLibrarySectionViewModel[];
  promotionBlockedNotice: string;
  manualReviewRequiredNotice: string;
  limitations: string[];
};

export function createPlanBuilderLibraryViewModel(): PlanBuilderLibraryViewModel {
  const reviewFlow = createPlanBuilderReviewFlowViewModel();
  const snapshotPlans = reviewFlow.plans;

  const defaultItems = defaultFloorplanLibraryFixtures.map((fixture) => ({
    id: `${fixture.plan.planId}:default`,
    planId: fixture.plan.planId,
    displayName: fixture.plan.name,
    artifactLabel: "Default fixture",
    categoryId: "default-fixtures" as const,
    routeStatus: "not_applicable" as const,
    simulationExportStatus: "not_applicable" as const,
    manualReviewStatus: "not_applicable" as const,
    promotionStatus: "not_applicable" as const,
    lastVerifiedIssue: "333",
    repoRelativePath: null,
    notice: "Default fixture unchanged."
  }));

  const correctedItems = snapshotPlans.map((plan) => ({
    id: `${plan.planId}:corrected`,
    planId: plan.planId,
    displayName: plan.displayName,
    artifactLabel: "Corrected saved copy",
    categoryId: "corrected-saved-copies" as const,
    routeStatus: "ready" as const,
    simulationExportStatus: "simulation_ready" as const,
    manualReviewStatus: "manual_review_required" as const,
    promotionStatus: "blocked" as const,
    lastVerifiedIssue: "334",
    repoRelativePath: plan.artifactReferences.renderedEvidencePath,
    notice: "Review candidate only; default fixture unchanged."
  }));

  const repairedItems = snapshotPlans.map((plan) => ({
    id: `${plan.planId}:route-repaired`,
    planId: plan.planId,
    displayName: plan.displayName,
    artifactLabel: "Route-repaired review candidate",
    categoryId: "route-repaired-review-candidates" as const,
    routeStatus: plan.routeReady ? "ready" as const : "blocked" as const,
    simulationExportStatus: plan.simulationReady ? "simulation_ready" as const : "blocked" as const,
    manualReviewStatus: "manual_review_required" as const,
    promotionStatus: "blocked" as const,
    lastVerifiedIssue: "334",
    repoRelativePath: plan.artifactReferences.renderedEvidencePath,
    notice: "Route/export ready, still pending human review."
  }));

  const packetItems = snapshotPlans.map((plan) => ({
    id: `${plan.planId}:packet`,
    planId: plan.planId,
    displayName: plan.displayName,
    artifactLabel: "Manual review packet",
    categoryId: "manual-review-packets" as const,
    routeStatus: plan.routeReady ? "ready" as const : "blocked" as const,
    simulationExportStatus: plan.simulationReady ? "simulation_ready" as const : "blocked" as const,
    manualReviewStatus: "manual_review_required" as const,
    promotionStatus: "blocked" as const,
    lastVerifiedIssue: "334",
    repoRelativePath: plan.artifactReferences.reviewPacketPath,
    notice: "Open as a reference; it is not a review record."
  }));

  return {
    libraryId: "plan-builder-human-review-library-v1",
    sections: [
      {
        id: "default-fixtures",
        title: "Default Fixtures",
        emptyText: "No default fixtures found.",
        items: defaultItems
      },
      {
        id: "corrected-saved-copies",
        title: "Corrected Saved Copies",
        emptyText: "No corrected saved copies found.",
        items: correctedItems
      },
      {
        id: "route-repaired-review-candidates",
        title: "Route-Repaired Review Candidates",
        emptyText: "No route-repaired review candidates found.",
        items: repairedItems
      },
      {
        id: "manual-review-packets",
        title: "Manual Review Packets",
        emptyText: "No manual review packets found.",
        items: packetItems
      }
    ],
    promotionBlockedNotice: "Promotion blocked until a structured human review record exists.",
    manualReviewRequiredNotice: "Manual review is required before promotion.",
    limitations: [
      "Route/export readiness is operational status, not a review decision.",
      "Rendered evidence is for operational review only.",
      "Default fixtures remain unchanged."
    ]
  };
}
