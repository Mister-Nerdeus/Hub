import { useEffect, useState } from "react";
import type { EditableRoomGeometry, SplitRoomContract } from "@nerdeus/shared";
import { SplitRoomHelpPanel } from "./SplitRoomHelpPanel";
import { splitRoomDisplayName } from "./splitRoomTerminology";
import type { SplitRoomDividerOrientation } from "./splitRoomActions";

export function SplitRoomInspectorPanel({
  splitRoom,
  parentRoom,
  selectedBedPositionId = null,
  readOnly,
  advanced = false,
  onSelectParent,
  onSelectBedPosition,
  onDividerOrientationChange,
  onDividerRatioChange,
  onDividerRatioReset,
  onUnsplit
}: {
  splitRoom: SplitRoomContract | null;
  parentRoom: EditableRoomGeometry | null;
  selectedBedPositionId?: string | null;
  readOnly: boolean;
  advanced?: boolean;
  onSelectParent: (splitRoomId: string) => void;
  onSelectBedPosition: (bedPositionId: string) => void;
  onDividerOrientationChange: (dividerOrientation: SplitRoomDividerOrientation) => void;
  onDividerRatioChange: (dividerRatio: number) => void;
  onDividerRatioReset: () => void;
  onUnsplit: () => void;
}) {
  const [unsplitConfirmationOpen, setUnsplitConfirmationOpen] = useState(false);

  useEffect(() => {
    setUnsplitConfirmationOpen(false);
  }, [splitRoom?.splitRoomId]);

  if (splitRoom == null || parentRoom == null) {
    return <p>No split room selected.</p>;
  }
  const [bedA, bedB] = splitRoom.bedPositions;
  const selectedBed = splitRoom.bedPositions.find((bedPosition) => bedPosition.bedPositionId === selectedBedPositionId) ?? null;
  const title = splitRoomDisplayName(parentRoom.roomNumber);

  return (
    <aside className="split-room-inspector-panel" data-split-room-inspector="ready">
      <header>
        <p className="eyebrow">Inspector</p>
        <h3>{selectedBed == null ? title : selectedBed.label}</h3>
      </header>
      <section
        className="split-room-inspector-panel__normal-model"
        data-split-room-normal-inspector="parent-bed-model"
      >
        <dl>
          <div>
            <dt>Parent room</dt>
            <dd>{parentRoom.roomNumber} - {parentRoom.label}</dd>
          </div>
          <div>
            <dt>Divider orientation</dt>
            <dd>{splitRoom.dividerOrientation}</dd>
          </div>
          <div>
            <dt>Divider ratio</dt>
            <dd>{Math.round(splitRoom.dividerRatio * 100)} / {Math.round((1 - splitRoom.dividerRatio) * 100)}</dd>
          </div>
          <div>
            <dt>Bed labels</dt>
            <dd>{splitRoom.bedPositions.map((bedPosition) => bedPosition.label).join(" / ")}</dd>
          </div>
          <div>
            <dt>Selected bed</dt>
            <dd>{selectedBed == null ? "None" : selectedBed.label}</dd>
          </div>
          <div>
            <dt>Operational label</dt>
            <dd>{selectedBed == null ? title : selectedBed.label}</dd>
          </div>
        </dl>
      </section>
      {advanced ? (
        <details
          open
          className="split-room-inspector-panel__advanced-model"
          data-split-room-advanced-inspector="parent-bed-model"
        >
          <summary>Technical fields</summary>
          <dl>
            <div>
              <dt>splitRoomId</dt>
              <dd>{splitRoom.splitRoomId}</dd>
            </div>
            <div>
              <dt>parentRoomId</dt>
              <dd>{splitRoom.parentRoomId}</dd>
            </div>
            <div>
              <dt>assignmentTargetIds</dt>
              <dd>{splitRoom.bedPositions.map((bedPosition) => bedPosition.bedPositionId).join(" / ")}</dd>
            </div>
            <div>
              <dt>relativeBounds</dt>
              <dd>{splitRoom.bedPositions.map((bedPosition) => formatRelativeBounds(bedPosition.relativeBounds)).join(" | ")}</dd>
            </div>
          </dl>
        </details>
      ) : null}
      <section
        className="split-room-inspector-panel__divider-controls"
        data-split-divider-controls="parent-bed-model"
        data-divider-orientation={splitRoom.dividerOrientation}
        data-divider-ratio={splitRoom.dividerRatio}
      >
        <label>
          Divider orientation
          <select
            value={splitRoom.dividerOrientation}
            disabled={readOnly}
            data-divider-orientation-control="true"
            onChange={(event) => onDividerOrientationChange(event.currentTarget.value as SplitRoomDividerOrientation)}
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
            value={splitRoom.dividerRatio}
            disabled={readOnly}
            data-divider-ratio-control="true"
            onChange={(event) => onDividerRatioChange(Number(event.currentTarget.value))}
          />
        </label>
        <button
          type="button"
          disabled={readOnly}
          data-divider-ratio-reset="50-50"
          onClick={onDividerRatioReset}
        >
          Reset 50/50
        </button>
      </section>
      <div className="split-room-inspector-panel__actions">
        <button type="button" onClick={() => onSelectParent(splitRoom.splitRoomId)}>
          Select Parent
        </button>
        {bedA == null ? null : (
          <button type="button" onClick={() => onSelectBedPosition(bedA.bedPositionId)}>
            Select {bedA.label}
          </button>
        )}
        {bedB == null ? null : (
          <button type="button" onClick={() => onSelectBedPosition(bedB.bedPositionId)}>
            Select {bedB.label}
          </button>
        )}
        <button
          type="button"
          disabled={readOnly}
          data-unsplit-action="request"
          data-unsplit-preserves-parent-footprint="true"
          onClick={() => setUnsplitConfirmationOpen(true)}
        >
          Unsplit {parentRoom.roomNumber}
        </button>
      </div>
      {unsplitConfirmationOpen ? (
        <section className="split-room-inspector-panel__unsplit-confirmation" data-unsplit-confirmation="open">
          <h4>Unsplit {title}?</h4>
          <p>The parent room footprint remains in the layout.</p>
          <p>Bed positions are removed from the split-room model.</p>
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
              disabled={readOnly}
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

function formatRelativeBounds(bounds: SplitRoomContract["bedPositions"][number]["relativeBounds"]): string {
  return `${bounds.xRatio},${bounds.yRatio},${bounds.widthRatio},${bounds.heightRatio}`;
}
