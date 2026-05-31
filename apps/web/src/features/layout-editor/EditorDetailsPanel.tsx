import type { ReactNode } from "react";

type EditorDetailsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function EditorDetailsPanel({
  open,
  onOpenChange,
  children
}: EditorDetailsPanelProps) {
  return (
    <details
      className="editor-details-panel"
      data-editor-details-panel="bottom-collapsible"
      data-right-inspector-removed-normal="true"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary>
        <span>Selected room details</span>
        <small>Room identity, Room type & capacity, Operational capabilities, Geometry</small>
      </summary>
      <div className="editor-details-panel__body">
        {children}
      </div>
    </details>
  );
}
