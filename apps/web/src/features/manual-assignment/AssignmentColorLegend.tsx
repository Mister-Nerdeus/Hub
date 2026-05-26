import type { ManualAssignmentColorLegendItem } from "./manualAssignmentWorkspaceViewModel";

type AssignmentColorLegendProps = {
  items: ManualAssignmentColorLegendItem[];
};

export function AssignmentColorLegend({ items }: AssignmentColorLegendProps) {
  return (
    <div className="assignment-color-legend" aria-label="Nurse color legend">
      {items.map((item) => (
        <span className="assignment-color-legend__item" key={item.nurseId}>
          <span className="assignment-color-legend__swatch" style={{ background: item.color }} />
          {item.displayLabel}
        </span>
      ))}
    </div>
  );
}
