import type { LayoutEditorFloorplanInput } from "./layoutEditorState";

export type LayoutEditorRecoveryScreenProps = {
  activeFloorplan: LayoutEditorFloorplanInput | null;
  draftAvailable: boolean;
  onRestoreLatestDraft: () => void;
  onExportDraftJson: () => void;
  onDiscardDraft: () => void;
  onReturnToLibrary: () => void;
};

export function LayoutEditorRecoveryScreen({
  activeFloorplan,
  draftAvailable,
  onRestoreLatestDraft,
  onExportDraftJson,
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
