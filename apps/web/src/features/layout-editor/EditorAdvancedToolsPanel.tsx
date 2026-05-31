import type { ReactNode } from "react";

type EditorAdvancedToolsPanelProps = {
  children: ReactNode;
};

export function EditorAdvancedToolsPanel({ children }: EditorAdvancedToolsPanelProps) {
  return (
    <details
      className="editor-advanced-tools-panel"
      data-editor-advanced-tools-panel="undo-redo-validate-json-recovery-records-reload-proof"
      data-advanced-tools-contain-technical-details="true"
    >
      <summary>Advanced</summary>
      <div className="editor-advanced-tools-panel__body">
        {children}
      </div>
    </details>
  );
}
