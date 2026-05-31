import type { ReactNode } from "react";

type LayoutEditorWorkspaceProps = {
  children: ReactNode;
};

export function LayoutEditorWorkspace({ children }: LayoutEditorWorkspaceProps) {
  return (
    <div
      className="layout-editor-workspace"
      data-editor-workspace-layout="full-page"
      data-editor-canvas-priority="true"
    >
      {children}
    </div>
  );
}
