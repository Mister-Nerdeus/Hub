import type { ReactNode } from "react";

type EditorAdvancedToolsPanelProps = {
  children: ReactNode;
};

export function EditorAdvancedToolsPanel({ children }: EditorAdvancedToolsPanelProps) {
  return (
    <details className="editor-advanced-tools-panel">
      <summary>Advanced</summary>
      <div className="editor-advanced-tools-panel__body">
        {children}
      </div>
    </details>
  );
}
