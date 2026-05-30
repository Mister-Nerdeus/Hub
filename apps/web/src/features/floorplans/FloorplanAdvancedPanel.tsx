import type { ReactNode } from "react";

type FloorplanAdvancedPanelProps = {
  children: ReactNode;
};

export function FloorplanAdvancedPanel({ children }: FloorplanAdvancedPanelProps) {
  return (
    <details className="floorplan-advanced-panel">
      <summary>Advanced floorplan tools</summary>
      <div className="floorplan-advanced-panel__body">
        {children}
      </div>
    </details>
  );
}
