import type { LayoutAssignmentOverlayLegendItem } from "./layoutAssignmentOverlay";
import { semanticRoomPresentationStyles } from "./roomPresentationStyles";

export type PresentationLegendProps = {
  assignmentItems: LayoutAssignmentOverlayLegendItem[];
};

export function PresentationLegend({ assignmentItems }: PresentationLegendProps) {
  const semanticItems = Object.values(semanticRoomPresentationStyles);
  return (
    <aside className="layout-assignment-legend" aria-label="Assignment and room semantics legend">
      <h3>Assignment Colors</h3>
      <ul>
        {assignmentItems.map((item) => (
          <li key={item.label}>
            <span style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
        <li>
          <span className="layout-assignment-legend__unassigned" />
          Unassigned occupied
        </li>
        {semanticItems.map((item) => (
          <li key={item.roomType} data-room-type-legend={item.roomType}>
            <span style={{ backgroundColor: item.fill, borderColor: item.stroke }} />
            {item.legendLabel}
          </li>
        ))}
      </ul>
    </aside>
  );
}
