export type EditorViewportLayoutViewModel = {
  workspaceClassName: string;
  canvasLayoutStatus: "dominant" | "constrained";
  commandBarStatus: "compact";
  inspectorState: "expanded" | "collapsed";
  validationSummary: string;
  dataAttributes: {
    "data-canvas-layout": "dominant" | "constrained";
    "data-inspector-state": "expanded" | "collapsed";
    "data-command-bar": "compact";
  };
};

export type BuildEditorViewportLayoutViewModelInput = {
  inspectorCollapsed: boolean;
  validationWarningCount: number;
};

export function buildEditorViewportLayoutViewModel({
  inspectorCollapsed,
  validationWarningCount
}: BuildEditorViewportLayoutViewModelInput): EditorViewportLayoutViewModel {
  const inspectorState = inspectorCollapsed ? "collapsed" : "expanded";
  const canvasLayoutStatus = "dominant";
  return {
    workspaceClassName: [
      "layout-editor-stage__workspace",
      inspectorCollapsed ? "layout-editor-stage__workspace--inspector-collapsed" : ""
    ].filter(Boolean).join(" "),
    canvasLayoutStatus,
    commandBarStatus: "compact",
    inspectorState,
    validationSummary:
      validationWarningCount === 0
        ? "No validation warnings"
        : `${validationWarningCount} validation warning${validationWarningCount === 1 ? "" : "s"}`,
    dataAttributes: {
      "data-canvas-layout": canvasLayoutStatus,
      "data-inspector-state": inspectorState,
      "data-command-bar": "compact"
    }
  };
}
