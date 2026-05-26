import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";
import { createOperationalDemoOperatorSnapshot } from "./operationalDemoSnapshotAdapter";
import { createPlanBuilderReviewFlowViewModel } from "./planBuilderReviewFlowViewModel";
import { createPlanLibraryFilters, sortPlanLibraryItemsForReview, type PlanLibraryFilterViewModel } from "./planStatusViewModel";
import {
  manualReviewStatusLabel,
  promotionStatusLabel,
  routeStatusLabel,
  simulationExportStatusLabel
} from "./statusLabels";

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
  routeStatusLabel: string;
  simulationExportStatusLabel: string;
  manualReviewStatusLabel: string;
  promotionStatusLabel: string;
  lastVerifiedIssue: string;
  repoRelativePath: string | null;
  notice: string;
  actions: {
    label: string;
    kind: "open-plan" | "open-saved-copy" | "open-review-packet" | "open-review-template" | "view-evidence";
  }[];
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
  filters: PlanLibraryFilterViewModel[];
  promotionBlockedNotice: string;
  manualReviewRequiredNotice: string;
  limitations: string[];
};

export function createPlanBuilderLibraryViewModel(): PlanBuilderLibraryViewModel {
  const reviewFlow = createPlanBuilderReviewFlowViewModel();
  const safeSnapshot = createOperationalDemoOperatorSnapshot();
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
    routeStatusLabel: routeStatusLabel("not_applicable"),
    simulationExportStatusLabel: simulationExportStatusLabel("not_applicable"),
    manualReviewStatusLabel: manualReviewStatusLabel("not_applicable"),
    promotionStatusLabel: promotionStatusLabel("not_applicable"),
    lastVerifiedIssue: "333",
    repoRelativePath: null,
    notice: "Default fixture unchanged.",
    actions: [{ label: "Open Plan", kind: "open-plan" as const }]
  }));

  const correctedItems = safeSnapshot.operatorPlans.map((plan) => ({
    id: `${plan.planId}:corrected`,
    planId: plan.planId,
    displayName: plan.displayName,
    artifactLabel: "Saved editable copy",
    categoryId: "corrected-saved-copies" as const,
    routeStatus: "ready" as const,
    simulationExportStatus: "simulation_ready" as const,
    manualReviewStatus: "manual_review_required" as const,
    promotionStatus: "blocked" as const,
    routeStatusLabel: plan.routeReadinessLabel,
    simulationExportStatusLabel: plan.simulationExportLabel,
    manualReviewStatusLabel: plan.manualReviewStatusLabel,
    promotionStatusLabel: plan.promotionStatusLabel,
    lastVerifiedIssue: "362",
    repoRelativePath: null,
    notice: "Review candidate only; default fixture unchanged.",
    actions: [{ label: "Open Saved Copy", kind: "open-saved-copy" as const }]
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
    routeStatusLabel: routeStatusLabel(plan.routeReady ? "ready" : "blocked"),
    simulationExportStatusLabel: simulationExportStatusLabel(plan.simulationReady ? "simulation_ready" : "blocked"),
    manualReviewStatusLabel: manualReviewStatusLabel("manual_review_required"),
    promotionStatusLabel: promotionStatusLabel("blocked"),
    lastVerifiedIssue: "362",
    repoRelativePath: null,
    notice: "Route/export ready, still pending human review.",
    actions: [
      { label: "Open as Active Floorplan", kind: "open-plan" as const },
      { label: "View Evidence", kind: "view-evidence" as const }
    ]
  }));

  const packetItems = safeSnapshot.operatorPlans.map((plan) => ({
    id: `${plan.planId}:packet`,
    planId: plan.planId,
    displayName: plan.displayName,
    artifactLabel: "Manual review packet",
    categoryId: "manual-review-packets" as const,
    routeStatus: "ready" as const,
    simulationExportStatus: "simulation_ready" as const,
    manualReviewStatus: "manual_review_required" as const,
    promotionStatus: "blocked" as const,
    routeStatusLabel: plan.routeReadinessLabel,
    simulationExportStatusLabel: plan.simulationExportLabel,
    manualReviewStatusLabel: plan.manualReviewStatusLabel,
    promotionStatusLabel: plan.promotionStatusLabel,
    lastVerifiedIssue: "362",
    repoRelativePath: null,
    notice: "Open as a reference; it is not a review record.",
    actions: [
      { label: plan.safeReviewPacketReference.actionLabel, kind: "open-review-packet" as const },
      { label: plan.safeReviewTemplateReference.actionLabel, kind: "open-review-template" as const }
    ]
  }));

  const sections = [
    {
      id: "default-fixtures" as const,
      title: "Default Fixtures",
      emptyText: "No default fixtures found.",
      items: defaultItems
    },
    {
      id: "corrected-saved-copies" as const,
      title: "Saved Editable Copies",
      emptyText: "No saved editable copies found.",
      items: correctedItems
    },
    {
      id: "route-repaired-review-candidates" as const,
      title: "Route-Repaired Review Candidates",
      emptyText: "No route-repaired review candidates found.",
      items: sortPlanLibraryItemsForReview(repairedItems)
    },
    {
      id: "manual-review-packets" as const,
      title: "Manual Review Packets",
      emptyText: "No manual review packets found.",
      items: packetItems
    }
  ];
  const allItems = sections.flatMap((section) => section.items);

  return {
    libraryId: "plan-builder-human-review-library-v1",
    sections,
    filters: createPlanLibraryFilters(allItems),
    promotionBlockedNotice: "Promotion blocked until a structured human review record exists.",
    manualReviewRequiredNotice: "Manual review is required before promotion.",
    limitations: [
      "Route/export readiness is operational status, not a review decision.",
      "Rendered evidence is for operational review only.",
      "Default fixtures remain unchanged."
    ]
  };
}
