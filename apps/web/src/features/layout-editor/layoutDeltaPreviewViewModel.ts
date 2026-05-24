import type { LayoutEditAuditEntry } from "./layoutEditAuditTrail";

export const LAYOUT_DELTA_PREVIEW_CATEGORIES = [
  "walk time",
  "layout friction",
  "room turnover",
  "patient wait/idle proxy",
  "nurse strain proxy"
] as const;

export type LayoutDeltaPreviewCategory = (typeof LAYOUT_DELTA_PREVIEW_CATEGORIES)[number];

export type LayoutDeltaPreviewViewModel = {
  status: "current" | "pending_recalculation";
  title: "Metric deltas";
  message: string;
  rerunWired: false;
  hasFakeMetricValues: false;
  affectedCategories: readonly LayoutDeltaPreviewCategory[];
  latestEditId?: string;
};

export type BuildLayoutDeltaPreviewViewModelInput = {
  isDirty: boolean;
  editAuditTrail: readonly LayoutEditAuditEntry[];
};

export function buildLayoutDeltaPreviewViewModel({
  isDirty,
  editAuditTrail
}: BuildLayoutDeltaPreviewViewModelInput): LayoutDeltaPreviewViewModel {
  if (!isDirty || editAuditTrail.length === 0) {
    return {
      status: "current",
      title: "Metric deltas",
      message: "No pending layout metric recalculation.",
      rerunWired: false,
      hasFakeMetricValues: false,
      affectedCategories: []
    };
  }

  const latestEdit = [...editAuditTrail].sort(
    (left, right) => right.createdAtOrder - left.createdAtOrder
  )[0];

  return {
    status: "pending_recalculation",
    title: "Metric deltas",
    message: "Simulation metrics are pending recalculation. Simulation rerun is not yet wired.",
    rerunWired: false,
    hasFakeMetricValues: false,
    affectedCategories: [...LAYOUT_DELTA_PREVIEW_CATEGORIES],
    latestEditId: latestEdit?.editId
  };
}
