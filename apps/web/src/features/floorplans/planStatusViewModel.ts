import type { PlanBuilderLibraryItemViewModel } from "./planBuilderLibraryViewModel";

export type PlanStatusBadgeKind =
  | "route-ready"
  | "simulation-ready"
  | "manual-review-required"
  | "promotion-blocked"
  | "default-fixture-unchanged";

export type PlanStatusBadgeViewModel = {
  kind: PlanStatusBadgeKind;
  label: string;
  tone: "ready" | "attention" | "blocked" | "neutral";
};

export type PlanLibraryFilterId =
  | "needs-manual-review"
  | "route-ready"
  | "simulation-ready"
  | "promotion-blocked"
  | "default-fixtures"
  | "review-candidates";

export type PlanLibraryFilterViewModel = {
  id: PlanLibraryFilterId;
  label: string;
  itemCount: number;
};

export function createPlanStatusBadges(item: PlanBuilderLibraryItemViewModel): PlanStatusBadgeViewModel[] {
  const badges: PlanStatusBadgeViewModel[] = [];
  if (item.routeStatus === "ready") {
    badges.push({ kind: "route-ready", label: "Route Ready", tone: "ready" });
  }
  if (item.simulationExportStatus === "simulation_ready") {
    badges.push({ kind: "simulation-ready", label: "Simulation Ready", tone: "ready" });
  }
  if (item.manualReviewStatus === "manual_review_required") {
    badges.push({ kind: "manual-review-required", label: "Manual Review Required", tone: "attention" });
  }
  if (item.promotionStatus === "blocked") {
    badges.push({ kind: "promotion-blocked", label: "Promotion Blocked", tone: "blocked" });
  }
  if (item.categoryId === "default-fixtures") {
    badges.push({ kind: "default-fixture-unchanged", label: "Default Fixture Unchanged", tone: "neutral" });
  }
  return badges;
}

export function createPlanLibraryFilters(items: PlanBuilderLibraryItemViewModel[]): PlanLibraryFilterViewModel[] {
  return [
    {
      id: "needs-manual-review",
      label: "Needs Manual Review",
      itemCount: items.filter((item) => item.manualReviewStatus === "manual_review_required").length
    },
    {
      id: "route-ready",
      label: "Route Ready",
      itemCount: items.filter((item) => item.routeStatus === "ready").length
    },
    {
      id: "simulation-ready",
      label: "Simulation Ready",
      itemCount: items.filter((item) => item.simulationExportStatus === "simulation_ready").length
    },
    {
      id: "promotion-blocked",
      label: "Promotion Blocked",
      itemCount: items.filter((item) => item.promotionStatus === "blocked").length
    },
    {
      id: "default-fixtures",
      label: "Default Fixtures",
      itemCount: items.filter((item) => item.categoryId === "default-fixtures").length
    },
    {
      id: "review-candidates",
      label: "Review Candidates",
      itemCount: items.filter((item) => item.categoryId === "route-repaired-review-candidates").length
    }
  ];
}

export function sortPlanLibraryItemsForReview(
  items: PlanBuilderLibraryItemViewModel[]
): PlanBuilderLibraryItemViewModel[] {
  const priority: Record<PlanBuilderLibraryItemViewModel["categoryId"], number> = {
    "route-repaired-review-candidates": 0,
    "manual-review-packets": 1,
    "corrected-saved-copies": 2,
    "default-fixtures": 3
  };
  return [...items].sort((left, right) =>
    priority[left.categoryId] - priority[right.categoryId] || left.planId.localeCompare(right.planId)
  );
}
