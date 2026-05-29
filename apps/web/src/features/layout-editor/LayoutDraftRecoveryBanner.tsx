import {
  formatDraftRecoveryTimestamp,
  type DraftRecoveryState
} from "./layoutDraftRecoveryViewModel";

export type LayoutDraftRecoveryBannerProps = {
  state: DraftRecoveryState;
  onRestore: () => void;
  onDiscard: () => void;
  onExportJson: () => void;
};

export function LayoutDraftRecoveryBanner({
  state,
  onRestore,
  onDiscard,
  onExportJson
}: LayoutDraftRecoveryBannerProps) {
  if (state.status === "none") {
    return null;
  }
  if (state.status === "restored") {
    return (
      <aside className="layout-draft-recovery-banner" role="status">
        Restored local draft saved {formatDraftRecoveryTimestamp(state.updatedAt)}.
      </aside>
    );
  }
  if (state.status === "discarded") {
    return (
      <aside className="layout-draft-recovery-banner" role="status">
        Local draft discarded.
      </aside>
    );
  }
  return (
    <aside className="layout-draft-recovery-banner" role="status" data-draft-recovery-banner="available">
      <p>
        Recovered local draft for {state.displayName}, plan {state.planId}, saved{" "}
        {formatDraftRecoveryTimestamp(state.updatedAt)}. Dirty state:{" "}
        {state.isDirty ? "draft changed" : "no unsaved edits"}.
      </p>
      <div className="layout-draft-recovery-banner__actions">
        <button type="button" onClick={onRestore}>
          Restore draft
        </button>
        <button type="button" onClick={onDiscard}>
          Discard draft
        </button>
        <button type="button" onClick={onExportJson}>
          Export draft JSON
        </button>
      </div>
    </aside>
  );
}
