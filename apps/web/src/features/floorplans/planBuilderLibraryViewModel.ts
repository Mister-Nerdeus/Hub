import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";
import { createOperationalDemoOperatorSnapshot } from "./operationalDemoSnapshotAdapter";
import { createPlanLibraryFilters, sortPlanLibraryItemsForReview, type PlanLibraryFilterViewModel } from "./planStatusViewModel";
import { buildReviewArtifactAction, type ReviewArtifactAction } from "./reviewArtifactLinks";

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
  routeStatusLabel: string;
  simulationExportStatusLabel: string;
  manualReviewStatusLabel: string;
  promotionStatusLabel: string;
  lastVerifiedIssue: string;
  repoRelativePath: string | null;
  notice: string;
  actions: (ReviewArtifactAction | {
    label: string;
    kind: "open-plan" | "open-saved-copy";
  })[];
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
  const safeSnapshot = createOperationalDemoOperatorSnapshot();

  const defaultItems = defaultFloorplanLibraryFixtures.map((fixture) => ({
    id: `${fixture.plan.planId}:default`,
    planId: fixture.plan.planId,
    displayName: fixture.plan.name,
    artifactLabel: "Default fixture",
    categoryId: "default-fixtures" as const,
    routeStatusLabel: "Not applicable",
    simulationExportStatusLabel: "Not applicable",
    manualReviewStatusLabel: "Not applicable",
    promotionStatusLabel: "Not applicable",
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
    routeStatusLabel: plan.routeReadinessLabel,
    simulationExportStatusLabel: plan.simulationExportLabel,
    manualReviewStatusLabel: plan.manualReviewStatusLabel,
    promotionStatusLabel: plan.promotionStatusLabel,
    lastVerifiedIssue: "362",
    repoRelativePath: null,
    notice: "Review candidate only; default fixture unchanged.",
    actions: [{ label: "Open Saved Copy", kind: "open-saved-copy" as const }]
  }));

  const repairedItems = safeSnapshot.operatorPlans.map((plan) => ({
    id: `${plan.planId}:route-repaired`,
    planId: plan.planId,
    displayName: plan.displayName,
    artifactLabel: "Route-repaired review candidate",
    categoryId: "route-repaired-review-candidates" as const,
    routeStatusLabel: plan.routeReadinessLabel,
    simulationExportStatusLabel: plan.simulationExportLabel,
    manualReviewStatusLabel: plan.manualReviewStatusLabel,
    promotionStatusLabel: plan.promotionStatusLabel,
    lastVerifiedIssue: "375",
    repoRelativePath: null,
    notice: "Route/export ready, still pending human review.",
    actions: [
      { label: "Open as Active Floorplan", kind: "open-plan" as const },
      buildReviewArtifactAction(plan.planId, "developer-evidence", "View Evidence")
    ]
  }));

  const packetItems = safeSnapshot.operatorPlans.map((plan) => ({
    id: `${plan.planId}:packet`,
    planId: plan.planId,
    displayName: plan.displayName,
    artifactLabel: "Manual review packet",
    categoryId: "manual-review-packets" as const,
    routeStatusLabel: plan.routeReadinessLabel,
    simulationExportStatusLabel: plan.simulationExportLabel,
    manualReviewStatusLabel: plan.manualReviewStatusLabel,
    promotionStatusLabel: plan.promotionStatusLabel,
    lastVerifiedIssue: "375",
    repoRelativePath: null,
    notice: "Open as a reference; it is not a review record.",
    actions: [
      buildReviewArtifactAction(plan.planId, "review-packet", plan.safeReviewPacketReference.actionLabel),
      buildReviewArtifactAction(plan.planId, "review-template", plan.safeReviewTemplateReference.actionLabel),
      buildReviewArtifactAction(plan.planId, "rendered-preview", "View rendered preview")
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
