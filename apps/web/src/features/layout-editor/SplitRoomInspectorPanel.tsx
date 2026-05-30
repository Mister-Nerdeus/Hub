import type { EditableSplitBayDividerStyle } from "@nerdeus/shared";
import type { SplitBayQuickEditViewModel } from "./splitBayQuickEditViewModel";
import { SplitRoomHelpPanel } from "./SplitRoomHelpPanel";
import { splitRoomDisplayName } from "./splitRoomTerminology";

const DIVIDER_STYLES: readonly EditableSplitBayDividerStyle[] = [
  "diagonal_down",
  "diagonal_up",
  "vertical",
  "horizontal"
];

export function SplitRoomInspectorPanel({
  viewModel,
  onSelectChildRoom,
  onDividerStyleChange,
  onUnsplit
}: {
  viewModel: SplitBayQuickEditViewModel;
  onSelectChildRoom: (roomId: string) => void;
  onDividerStyleChange: (dividerStyle: EditableSplitBayDividerStyle) => void;
  onUnsplit: () => void;
}) {
  if (viewModel.status !== "ready" || viewModel.pairLabel == null || viewModel.childRooms == null || viewModel.dividerStyle == null) {
    return <p>No split room selected.</p>;
  }
  const [childA, childB] = viewModel.childRooms;
  return (
    <aside className="split-room-inspector-panel" data-split-room-inspector="ready">
      <header>
        <p className="eyebrow">Inspector</p>
        <h3>{splitRoomDisplayName(viewModel.pairLabel)}</h3>
      </header>
      <dl>
        <div>
          <dt>Physical bay</dt>
          <dd>1</dd>
        </div>
        <div>
          <dt>Patient-care positions</dt>
          <dd>2</dd>
        </div>
        <div>
          <dt>Child A</dt>
          <dd>{childA.label}</dd>
        </div>
        <div>
          <dt>Child A ID</dt>
          <dd>{childA.roomId}</dd>
        </div>
        <div>
          <dt>Child B</dt>
          <dd>{childB.label}</dd>
        </div>
        <div>
          <dt>Child B ID</dt>
          <dd>{childB.roomId}</dd>
        </div>
        <div>
          <dt>Divider</dt>
          <dd>{formatDividerStyle(viewModel.dividerStyle)}</dd>
        </div>
        <div>
          <dt>Assignment</dt>
          <dd>Rooms {childA.roomNumber} and {childB.roomNumber} assign independently</dd>
        </div>
      </dl>
      <label>
        Change Divider
        <select
          value={viewModel.dividerStyle}
          disabled={viewModel.readOnly}
          onChange={(event) => onDividerStyleChange(event.currentTarget.value as EditableSplitBayDividerStyle)}
        >
          {DIVIDER_STYLES.map((style) => (
            <option key={style} value={style}>{formatDividerStyle(style)}</option>
          ))}
        </select>
      </label>
      <div className="split-room-inspector-panel__actions">
        <button type="button" onClick={() => onSelectChildRoom(childA.roomId)}>
          Select Room {childA.roomNumber}
        </button>
        <button type="button" onClick={() => onSelectChildRoom(childB.roomId)}>
          Select Room {childB.roomNumber}
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={onUnsplit}>
          Unsplit {viewModel.pairLabel}
        </button>
      </div>
      <SplitRoomHelpPanel />
    </aside>
  );
}

function formatDividerStyle(style: EditableSplitBayDividerStyle): string {
  if (style === "vertical") return "vertical";
  if (style === "horizontal") return "horizontal";
  return "diagonal";
}
