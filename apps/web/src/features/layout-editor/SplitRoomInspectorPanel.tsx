import { useEffect, useState } from "react";
import type { EditableSplitBayDividerStyle } from "@nerdeus/shared";
import type { SplitBayQuickEditViewModel } from "./splitBayQuickEditViewModel";
import { SplitRoomHelpPanel } from "./SplitRoomHelpPanel";
import { splitRoomDisplayName } from "./splitRoomTerminology";
import type { SplitRoomDividerOrientation } from "./splitRoomActions";

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
  onDividerOrientationChange,
  onDividerRatioChange,
  onDividerRatioReset,
  dividerOrientation,
  dividerRatio,
  onUnsplit
}: {
  viewModel: SplitBayQuickEditViewModel;
  onSelectChildRoom: (roomId: string) => void;
  onDividerStyleChange: (dividerStyle: EditableSplitBayDividerStyle) => void;
  onDividerOrientationChange?: (dividerOrientation: SplitRoomDividerOrientation) => void;
  onDividerRatioChange?: (dividerRatio: number) => void;
  onDividerRatioReset?: () => void;
  dividerOrientation?: SplitRoomDividerOrientation;
  dividerRatio?: number;
  onUnsplit: () => void;
}) {
  const [unsplitConfirmationOpen, setUnsplitConfirmationOpen] = useState(false);

  useEffect(() => {
    setUnsplitConfirmationOpen(false);
  }, [viewModel.splitBayId]);

  if (viewModel.status !== "ready" || viewModel.pairLabel == null || viewModel.childRooms == null || viewModel.dividerStyle == null) {
    return <p>No split room selected.</p>;
  }
  const [childA, childB] = viewModel.childRooms;
  const selectedDividerOrientation = dividerOrientation ?? dividerOrientationFromStyle(viewModel.dividerStyle);
  const selectedDividerRatio = dividerRatio ?? 0.5;
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
      <section
        className="split-room-inspector-panel__normal-model"
        data-split-room-normal-inspector="parent-bed-model"
      >
        <dl>
          <div>
            <dt>Parent room</dt>
            <dd>{viewModel.pairLabel}</dd>
          </div>
          <div>
            <dt>Bed label</dt>
            <dd>{childA.roomNumber}A / {childB.roomNumber}B</dd>
          </div>
          <div>
            <dt>Bed position</dt>
            <dd>A and B</dd>
          </div>
          <div>
            <dt>Divider orientation</dt>
            <dd>{selectedDividerOrientation}</dd>
          </div>
          <div>
            <dt>Divider ratio</dt>
            <dd>{Math.round(selectedDividerRatio * 100)} / {Math.round((1 - selectedDividerRatio) * 100)}</dd>
          </div>
          <div>
            <dt>Assignable target</dt>
            <dd>Yes</dd>
          </div>
        </dl>
      </section>
      <details
        className="split-room-inspector-panel__advanced-model"
        data-split-room-advanced-inspector="parent-bed-model"
      >
        <summary>Technical fields</summary>
        <dl>
          <div>
            <dt>splitRoomId</dt>
            <dd>{viewModel.splitBayId}</dd>
          </div>
          <div>
            <dt>bedPositionId</dt>
            <dd>{childA.roomId}:bed-a / {childB.roomId}:bed-b</dd>
          </div>
          <div>
            <dt>parentRoomId</dt>
            <dd>{viewModel.splitBayId}</dd>
          </div>
          <div>
            <dt>relativeBounds</dt>
            <dd>{selectedDividerOrientation}:{selectedDividerRatio}</dd>
          </div>
        </dl>
      </details>
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
      <section
        className="split-room-inspector-panel__divider-controls"
        data-split-divider-controls="parent-bed-model"
        data-divider-orientation={selectedDividerOrientation}
        data-divider-ratio={selectedDividerRatio}
      >
        <label>
          Divider orientation
          <select
            value={selectedDividerOrientation}
            disabled={viewModel.readOnly}
            data-divider-orientation-control="true"
            onChange={(event) => onDividerOrientationChange?.(event.currentTarget.value as SplitRoomDividerOrientation)}
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </label>
        <label>
          Divider ratio
          <input
            type="range"
            min="0.2"
            max="0.8"
            step="0.05"
            value={selectedDividerRatio}
            disabled={viewModel.readOnly}
            data-divider-ratio-control="true"
            onChange={(event) => onDividerRatioChange?.(Number(event.currentTarget.value))}
          />
        </label>
        <button
          type="button"
          disabled={viewModel.readOnly}
          data-divider-ratio-reset="50-50"
          onClick={() => onDividerRatioReset?.()}
        >
          Reset 50/50
        </button>
      </section>
      <div className="split-room-inspector-panel__actions">
        <button type="button" onClick={() => onSelectChildRoom(childA.roomId)}>
          Select Room {childA.roomNumber}
        </button>
        <button type="button" onClick={() => onSelectChildRoom(childB.roomId)}>
          Select Room {childB.roomNumber}
        </button>
        <button
          type="button"
          disabled={viewModel.readOnly}
          data-unsplit-action="request"
          data-unsplit-preserves-parent-footprint="true"
          onClick={() => setUnsplitConfirmationOpen(true)}
        >
          {viewModel.unsplitButtonLabel ?? `Unsplit ${viewModel.pairLabel}`}
        </button>
      </div>
      {unsplitConfirmationOpen ? (
        <section className="split-room-inspector-panel__unsplit-confirmation" data-unsplit-confirmation="open">
          <h4>{viewModel.unsplitConfirmationTitle ?? `Unsplit Split Room ${viewModel.pairLabel}?`}</h4>
          <p>{viewModel.unsplitPreservationCopy}</p>
          <p>{viewModel.unsplitAssignmentCopy}</p>
          <div className="split-room-inspector-panel__confirmation-actions">
            <button
              type="button"
              data-unsplit-action="cancel"
              onClick={() => setUnsplitConfirmationOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={viewModel.readOnly}
              data-unsplit-action="confirm"
              data-unsplit-preserves-parent-footprint="true"
              onClick={() => {
                setUnsplitConfirmationOpen(false);
                onUnsplit();
              }}
            >
              Confirm Unsplit
            </button>
          </div>
        </section>
      ) : null}
      <SplitRoomHelpPanel />
    </aside>
  );
}

function formatDividerStyle(style: EditableSplitBayDividerStyle): string {
  if (style === "vertical") return "vertical";
  if (style === "horizontal") return "horizontal";
  return "diagonal";
}

function dividerOrientationFromStyle(style: EditableSplitBayDividerStyle): SplitRoomDividerOrientation {
  return style === "horizontal" ? "horizontal" : "vertical";
}
