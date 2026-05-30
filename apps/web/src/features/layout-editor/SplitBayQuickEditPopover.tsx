import type { EditableSplitBayDividerStyle } from "@nerdeus/shared";
import type { SplitBayQuickEditViewModel } from "./splitBayQuickEditViewModel";

const DIVIDER_STYLES: readonly EditableSplitBayDividerStyle[] = ["diagonal", "vertical", "horizontal"];

export function SplitBayQuickEditPopover({
  viewModel,
  onDividerStyleChange
}: {
  viewModel: SplitBayQuickEditViewModel;
  onDividerStyleChange: (dividerStyle: EditableSplitBayDividerStyle) => void;
}) {
  if (viewModel.status !== "ready" || viewModel.dividerStyle == null || viewModel.bedPositionRoomIds == null) {
    return <p>No split bay selected.</p>;
  }
  return (
    <div className="split-bay-quick-edit-popover" data-split-bay-quick-edit="ready">
      <dl>
        <div>
          <dt>Bed positions</dt>
          <dd>{viewModel.bedPositionRoomIds.join(" / ")}</dd>
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
  if (style === "diagonal") return "Diagonal";
  if (style === "vertical") return "Vertical";
  return "Horizontal";
}
