import type { PlanBuilderLibraryItemViewModel } from "./planBuilderLibraryViewModel";

export type PlanStatusBadgeKind =
  | "route-ready"
  | "route-export-ready"
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
  | "route-export-ready"
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
  if (item.routeStatusLabel === "Route ready") {
    badges.push({ kind: "route-ready", label: "Route Ready", tone: "ready" });
  }
  if (item.simulationExportStatusLabel === "Route-ready export") {
    badges.push({ kind: "route-export-ready", label: "Route Export Ready", tone: "ready" });
  }
  if (item.manualReviewStatusLabel === "Manual review required") {
    badges.push({ kind: "manual-review-required", label: "Manual Review Required", tone: "attention" });
  }
  if (item.promotionStatusLabel === "Promotion blocked") {
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
      itemCount: items.filter((item) => item.manualReviewStatusLabel === "Manual review required").length
    },
    {
      id: "route-ready",
      label: "Route Ready",
      itemCount: items.filter((item) => item.routeStatusLabel === "Route ready").length
    },
    {
      id: "route-export-ready",
      label: "Route Export Ready",
      itemCount: items.filter((item) => item.simulationExportStatusLabel === "Route-ready export").length
    },
    {
      id: "promotion-blocked",
      label: "Promotion Blocked",
      itemCount: items.filter((item) => item.promotionStatusLabel === "Promotion blocked").length
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
