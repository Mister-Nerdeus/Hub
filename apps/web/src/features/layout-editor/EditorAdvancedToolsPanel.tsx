import type { ReactNode } from "react";

type EditorAdvancedToolsPanelProps = {
  children: ReactNode;
};

export function EditorAdvancedToolsPanel({ children }: EditorAdvancedToolsPanelProps) {
  return (
    <details className="editor-advanced-tools-panel" data-editor-advanced-tools-panel="true">
      <summary>Advanced</summary>
      <div className="editor-advanced-tools-panel__body" data-editor-advanced-tools-body="true">
        {children}
      </div>
    </details>
  );
}
