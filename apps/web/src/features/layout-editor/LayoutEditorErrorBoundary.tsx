import { Component, type ErrorInfo, type ReactNode } from "react";
import type { LayoutEditorFloorplanInput } from "./layoutEditorState";
import {
  buildLayoutCrashDiagnostics,
  serializeLayoutCrashDiagnostics
} from "./layoutCrashDiagnostics";
import {
  loadLayoutLocalDraft,
  resetLayoutLocalDraft
} from "./layoutLocalDraftPersistence";
import { loadLatestDoorRecoverySnapshot } from "./layoutDoorRecoverySnapshots";
import { LayoutEditorRecoveryScreen } from "./LayoutEditorRecoveryScreen";

export type LayoutEditorErrorBoundaryProps = {
  activeFloorplan: LayoutEditorFloorplanInput | null;
  onReturnToLibrary: () => void;
  children: ReactNode;
};

type LayoutEditorErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

export class LayoutEditorErrorBoundary extends Component<
  LayoutEditorErrorBoundaryProps,
  LayoutEditorErrorBoundaryState
> {
  override state: LayoutEditorErrorBoundaryState = {
    hasError: false,
    message: null
  };

  static getDerivedStateFromError(error: Error): LayoutEditorErrorBoundaryState {
    return {
      hasError: true,
      message: error.message
    };
  }

  override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Local boundary only; recovery actions below keep the route nonblank.
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    const draft = this.loadActiveDraft();
    const snapshot = this.loadLatestDoorRecoverySnapshot();
    const diagnostics = buildLayoutCrashDiagnostics({
      errorMessage: this.state.message,
      activeFloorplan: this.props.activeFloorplan,
      selectedObjectId: snapshot?.selectedObjectId ?? null,
      selectedObjectType: snapshot?.selectedObjectType ?? null,
      lastDoorAction: snapshot?.actionType ?? null,
      draftAvailable: draft != null,
      lastValidSnapshotAvailable: snapshot != null
    });
    return (
      <LayoutEditorRecoveryScreen
        activeFloorplan={this.props.activeFloorplan}
        diagnostics={diagnostics}
        draftAvailable={draft != null}
        lastValidSnapshotAvailable={snapshot != null}
        onRestoreLatestDraft={() => this.restoreLatestDraft()}
        onRestoreLastValidSnapshot={() => this.restoreLastValidSnapshot()}
        onCopyDiagnostics={() => this.copyDiagnostics(diagnostics)}
        onExportDraftJson={() => this.exportDraftJson()}
        onExportCrashDiagnostics={() => this.exportCrashDiagnostics(diagnostics)}
        onExportLastValidSnapshot={() => this.exportLastValidSnapshot()}
        onDiscardDraft={() => this.discardDraft()}
        onReturnToLibrary={this.props.onReturnToLibrary}
      />
    );
  }

  private loadActiveDraft() {
    if (
      this.props.activeFloorplan == null ||
      typeof window === "undefined" ||
      window.localStorage == null
    ) {
      return null;
    }
    const loaded = loadLayoutLocalDraft(window.localStorage, this.props.activeFloorplan.recordId);
    return loaded.status === "loaded" ? loaded.draft : null;
  }

  private restoreLatestDraft() {
    this.clearForcedCrashTrigger();
    this.setState({ hasError: false, message: null });
  }

  private restoreLastValidSnapshot() {
    this.clearForcedCrashTrigger();
    this.setState({ hasError: false, message: null });
  }

  private copyDiagnostics(diagnostics: ReturnType<typeof buildLayoutCrashDiagnostics>) {
    if (typeof navigator === "undefined" || navigator.clipboard == null) {
      return;
    }
    void navigator.clipboard.writeText(serializeLayoutCrashDiagnostics(diagnostics));
  }

  private exportDraftJson() {
    const draft = this.loadActiveDraft();
    if (draft == null || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    this.exportJsonBlob(JSON.stringify(draft, null, 2), `${draft.recordId}-layout-recovery-draft.json`);
  }

  private exportCrashDiagnostics(diagnostics: ReturnType<typeof buildLayoutCrashDiagnostics>) {
    this.exportJsonBlob(
      serializeLayoutCrashDiagnostics(diagnostics),
      `${diagnostics.activeRecordId ?? "layout-editor"}-crash-diagnostics.json`
    );
  }

  private loadLatestDoorRecoverySnapshot() {
    if (
      this.props.activeFloorplan == null ||
      typeof window === "undefined" ||
      window.localStorage == null
    ) {
      return null;
    }
    return loadLatestDoorRecoverySnapshot(window.localStorage, this.props.activeFloorplan.recordId);
  }

  private exportLastValidSnapshot() {
    const snapshot = this.loadLatestDoorRecoverySnapshot();
    if (snapshot == null || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    this.exportJsonBlob(JSON.stringify(snapshot, null, 2), `${snapshot.recordId}-door-recovery-snapshot.json`);
  }

  private exportJsonBlob(content: string, filename: string) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private discardDraft() {
    if (
      this.props.activeFloorplan == null ||
      typeof window === "undefined" ||
      window.localStorage == null
    ) {
      return;
    }
    resetLayoutLocalDraft(window.localStorage, this.props.activeFloorplan.recordId);
    this.clearForcedCrashTrigger();
    this.setState({ hasError: false, message: null });
  }

  private clearForcedCrashTrigger() {
    if (typeof window === "undefined") {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("forceLayoutEditorCrash");
    window.history.replaceState({}, "", url.toString());
  }
}
