import { Component, type ErrorInfo, type ReactNode } from "react";
import type { LayoutEditorFloorplanInput } from "./layoutEditorState";
import {
  loadLayoutLocalDraft,
  resetLayoutLocalDraft
} from "./layoutLocalDraftPersistence";
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
    return (
      <LayoutEditorRecoveryScreen
        activeFloorplan={this.props.activeFloorplan}
        draftAvailable={draft != null}
        onRestoreLatestDraft={() => this.restoreLatestDraft()}
        onExportDraftJson={() => this.exportDraftJson()}
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

  private exportDraftJson() {
    const draft = this.loadActiveDraft();
    if (draft == null || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${draft.recordId}-layout-recovery-draft.json`;
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
