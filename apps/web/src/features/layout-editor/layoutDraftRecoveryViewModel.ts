import type { LayoutLocalDraftRecord } from "./layoutLocalDraftPersistence";

export type DraftRecoveryState =
  | { status: "none" }
  | {
      status: "available";
      recordId: string;
      planId: string;
      displayName: string;
      updatedAt: string;
      isDirty: boolean;
    }
  | { status: "restored"; updatedAt: string }
  | { status: "discarded" };

export function buildDraftRecoveryState(
  draft: LayoutLocalDraftRecord | null
): DraftRecoveryState {
  if (draft == null) {
    return { status: "none" };
  }
  return {
    status: "available",
    recordId: draft.recordId,
    planId: draft.planId,
    displayName: draft.displayName,
    updatedAt: draft.updatedAt,
    isDirty: draft.dirtyState.isDirty
  };
}

export function formatDraftRecoveryTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}
