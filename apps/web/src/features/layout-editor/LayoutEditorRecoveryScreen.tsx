import type { LayoutEditorFloorplanInput } from "./layoutEditorState";
import type { LayoutCrashDiagnostics } from "./layoutCrashDiagnostics";

export type LayoutEditorRecoveryScreenProps = {
  activeFloorplan: LayoutEditorFloorplanInput | null;
  diagnostics: LayoutCrashDiagnostics;
  draftAvailable: boolean;
  lastValidSnapshotAvailable?: boolean;
  onRestoreLatestDraft: () => void;
  onRestoreLastValidSnapshot?: () => void;
  onCopyDiagnostics?: () => void;
  onExportDraftJson: () => void;
  onExportCrashDiagnostics?: () => void;
  onExportLastValidSnapshot?: () => void;
  onDiscardDraft: () => void;
  onReturnToLibrary: () => void;
};

export function LayoutEditorRecoveryScreen({
  activeFloorplan,
  diagnostics,
  draftAvailable,
  lastValidSnapshotAvailable = false,
  onRestoreLatestDraft,
  onRestoreLastValidSnapshot = () => undefined,
  onCopyDiagnostics = () => undefined,
  onExportDraftJson,
  onExportCrashDiagnostics = () => undefined,
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
      <dl className="layout-editor-recovery-screen__diagnostics" aria-label="Crash diagnostics">
        <div>
          <dt>Error</dt>
          <dd>{diagnostics.errorMessage}</dd>
        </div>
        <div>
          <dt>Record ID</dt>
          <dd>{diagnostics.activeRecordId ?? "none"}</dd>
        </div>
        <div>
          <dt>Plan ID</dt>
          <dd>{diagnostics.activePlanId ?? "none"}</dd>
        </div>
        <div>
          <dt>Selected object</dt>
          <dd>
            {diagnostics.selectedObjectType == null || diagnostics.selectedObjectId == null
              ? "none"
              : `${diagnostics.selectedObjectType}:${diagnostics.selectedObjectId}`}
          </dd>
        </div>
        <div>
          <dt>Last door action</dt>
          <dd>{diagnostics.lastDoorAction ?? "none"}</dd>
        </div>
        <div>
          <dt>Draft available</dt>
          <dd>{diagnostics.draftAvailable ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt>Last valid snapshot</dt>
          <dd>{diagnostics.lastValidSnapshotAvailable ? "yes" : "no"}</dd>
        </div>
      </dl>
      <div className="layout-editor-recovery-screen__actions">
        <button type="button" onClick={onCopyDiagnostics}>
          Copy diagnostics
        </button>
        <button type="button" onClick={onExportCrashDiagnostics}>
          Export crash diagnostics
        </button>
        <button type="button" disabled={!draftAvailable} onClick={onRestoreLatestDraft}>
          Restore latest draft
        </button>
        <button type="button" disabled={!draftAvailable} onClick={onExportDraftJson}>
          Export crash draft
        </button>
        <button type="button" disabled={!lastValidSnapshotAvailable} onClick={onRestoreLastValidSnapshot}>
          Restore last valid snapshot
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
