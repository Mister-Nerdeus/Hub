import type { LayoutEditorFloorplanInput } from "./layoutEditorState";

export type LayoutEditorRecoveryScreenProps = {
  activeFloorplan: LayoutEditorFloorplanInput | null;
  draftAvailable: boolean;
  lastValidSnapshotAvailable?: boolean;
  onRestoreLatestDraft: () => void;
  onExportDraftJson: () => void;
  onExportLastValidSnapshot?: () => void;
  onDiscardDraft: () => void;
  onReturnToLibrary: () => void;
};

export function LayoutEditorRecoveryScreen({
  activeFloorplan,
  draftAvailable,
  lastValidSnapshotAvailable = false,
  onRestoreLatestDraft,
  onExportDraftJson,
  onExportLastValidSnapshot = () => undefined,
  onDiscardDraft,
  onReturnToLibrary
}: LayoutEditorRecoveryScreenProps) {
  return (
    <section className="layout-editor-recovery-screen" aria-labelledby="layout-editor-recovery-title">
      <p className="eyebrow">Layout editor recovery</p>
      <h3 id="layout-editor-recovery-title">Editor recovery tools</h3>
      <p>
        The editor stopped rendering for {activeFloorplan?.name ?? "the active floorplan"}.
      </p>
      <div className="layout-editor-recovery-screen__actions">
        <button type="button" disabled={!draftAvailable} onClick={onRestoreLatestDraft}>
          Restore latest draft
        </button>
        <button type="button" disabled={!draftAvailable} onClick={onExportDraftJson}>
          Export draft JSON
        </button>
        <button type="button" disabled={!lastValidSnapshotAvailable} onClick={onExportLastValidSnapshot}>
          Export last valid snapshot
        </button>
        <button type="button" disabled={!draftAvailable} onClick={onDiscardDraft}>
          Discard draft
        </button>
        <button type="button" onClick={onReturnToLibrary}>
          Return to floorplan library
        </button>
      </div>
    </section>
  );
}
