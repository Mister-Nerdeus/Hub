import type { ReactNode } from "react";
import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";

export type EditorDetailsPanelProps = {
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  advancedDetails?: ReactNode;
  children: ReactNode;
};

export function EditorDetailsPanel({
  selectedObjectType,
  collapsed,
  onToggleCollapsed,
  advancedDetails,
  children
}: EditorDetailsPanelProps) {
  if (selectedObjectType == null) {
    return null;
  }

  return (
    <section
      className="editor-details-panel"
      aria-label="Selected object details"
      data-editor-details-panel="bottom"
      data-bottom-details-panel="true"
      data-bottom-panel-internal-scroll="true"
    >
      <header className="editor-details-panel__header">
        <div>
          <p className="editor-details-panel__eyebrow">Selected object</p>
          <h3>{selectedObjectType.replaceAll("_", " ")} details</h3>
        </div>
        <button
          type="button"
          aria-expanded={!collapsed}
          data-editor-details-toggle="true"
          onClick={onToggleCollapsed}
        >
          {collapsed ? "Show details" : "Hide details"}
        </button>
      </header>
      {collapsed ? null : (
        <div className="editor-details-panel__body" data-selected-object-details-visible="true">
          {children}
          {advancedDetails == null ? null : (
            <details
              className="editor-details-panel__advanced"
              data-technical-inspector-fields-advanced="true"
            >
              <summary>Advanced details</summary>
              {advancedDetails}
            </details>
          )}
        </div>
      )}
    </section>
  );
}
