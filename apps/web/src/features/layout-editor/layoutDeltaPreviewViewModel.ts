import type { LayoutEditAuditEntry } from "./layoutEditAuditTrail";
import { getLatestDeltaPreviewEdit } from "./layoutEditEffects";

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
  const latestEdit = getLatestDeltaPreviewEdit(editAuditTrail);
  if (!isDirty || latestEdit == null) {
    return {
      status: "current",
      title: "Metric deltas",
      message: "No pending layout metric recalculation.",
      rerunWired: false,
      hasFakeMetricValues: false,
      affectedCategories: []
    };
  }

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
