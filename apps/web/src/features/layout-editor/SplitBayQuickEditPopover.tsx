import type { EditableSplitBayDividerStyle } from "@nerdeus/shared";
import type { SplitBayQuickEditViewModel } from "./splitBayQuickEditViewModel";

const DIVIDER_STYLES: readonly EditableSplitBayDividerStyle[] = [
  "diagonal_down",
  "diagonal_up",
  "vertical",
  "horizontal"
];

export function SplitBayQuickEditPopover({
  viewModel,
  onDividerStyleChange
}: {
  viewModel: SplitBayQuickEditViewModel;
  onDividerStyleChange: (dividerStyle: EditableSplitBayDividerStyle) => void;
}) {
  if (viewModel.status !== "ready" || viewModel.dividerStyle == null || viewModel.childRooms == null) {
    return <p>No split room selected.</p>;
  }
  const [childA, childB] = viewModel.childRooms;
  return (
    <div className="split-bay-quick-edit-popover" data-split-bay-quick-edit="ready">
      <strong>Split Room {viewModel.pairLabel}</strong>
      <dl>
        <div>
          <dt>Patient-care positions</dt>
          <dd>{childA.label} / {childB.label}</dd>
        </div>
        <div>
          <dt>Assignment</dt>
          <dd>Rooms {childA.roomNumber} and {childB.roomNumber} assign independently</dd>
        </div>
      </dl>
      <label>
        Divider
        <select
          value={viewModel.dividerStyle}
          disabled={viewModel.readOnly}
          onChange={(event) => onDividerStyleChange(event.currentTarget.value as EditableSplitBayDividerStyle)}
        >
          {DIVIDER_STYLES.map((style) => (
            <option key={style} value={style}>
              {formatDividerStyle(style)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function formatDividerStyle(style: EditableSplitBayDividerStyle): string {
  if (style === "diagonal" || style === "diagonal_down" || style === "diagonal_up") return "Diagonal";
  if (style === "vertical") return "Vertical";
  return "Horizontal";
}
