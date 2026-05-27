import type { EditableDoorWall } from "@nerdeus/shared";
import type { DoorQuickEditViewModel } from "./doorQuickEditViewModel";

export type DoorQuickEditPopoverProps = {
  viewModel: DoorQuickEditViewModel;
  onWallChange: (wall: EditableDoorWall) => void;
  onNudge: (deltaFeet: number) => void;
  onCenter: () => void;
  onOpposite: () => void;
  onAdjacentCandidate?: (roomId: string, wall: EditableDoorWall, offsetFeet: number) => void;
  onWidthDecrease?: () => void;
  onWidthIncrease?: () => void;
  onWidthPreset?: (widthFeet: number) => void;
  onDeleteDoor: () => void;
};

const WALLS: readonly EditableDoorWall[] = ["north", "south", "east", "west"];

export function DoorQuickEditPopover({
  viewModel,
  onWallChange,
  onNudge,
  onCenter,
  onOpposite,
  onAdjacentCandidate = () => undefined,
  onWidthDecrease = () => undefined,
  onWidthIncrease = () => undefined,
  onWidthPreset = () => undefined,
  onDeleteDoor
}: DoorQuickEditPopoverProps) {
  if (viewModel.status !== "ready" || viewModel.wall == null) {
    return <p>No door selected.</p>;
  }
  return (
    <div className="door-quick-edit-popover" data-door-quick-edit="ready">
      <label>
        Wall
        <select
          value={viewModel.wall}
          disabled={viewModel.readOnly}
          onChange={(event) => onWallChange(event.currentTarget.value as EditableDoorWall)}
        >
          {WALLS.map((wall) => (
            <option key={wall} value={wall}>
              {wall}
            </option>
          ))}
        </select>
      </label>
      <div className="door-quick-edit-popover__row">
        <span>Offset {viewModel.offsetFeet} ft</span>
        <button type="button" disabled={viewModel.readOnly} onClick={() => onNudge(-1)}>
          Nudge -
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={() => onNudge(1)}>
          Nudge +
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={onCenter}>
          Center
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={onOpposite}>
          Opposite
        </button>
      </div>
      <div className="door-quick-edit-popover__row">
        <span>{viewModel.adjacentCandidateCount} adjacent candidates</span>
        <button type="button" disabled={viewModel.deleteDisabled} onClick={onDeleteDoor}>
          Delete door
        </button>
      </div>
      <label>
        Candidate
        <select
          value={viewModel.adjacentCandidates[0]?.roomId ?? ""}
          disabled={viewModel.readOnly || viewModel.adjacentCandidates.length === 0}
          onChange={(event) => {
            const candidate = viewModel.adjacentCandidates.find((item) => item.roomId === event.currentTarget.value);
            if (candidate != null) {
              onAdjacentCandidate(candidate.roomId, candidate.wall, candidate.previewOffsetFeet);
            }
          }}
        >
          {viewModel.adjacentCandidates.map((candidate) => (
            <option key={candidate.roomId} value={candidate.roomId}>
              {candidate.roomLabel} / {candidate.wall} / {candidate.relationshipLabel}
            </option>
          ))}
        </select>
      </label>
      <div className="door-quick-edit-popover__row">
        <span>{viewModel.noCandidateReason ?? "Geometry-valid candidate selection available"}</span>
        <button type="button" disabled={viewModel.readOnly} onClick={onWidthDecrease}>
          Width -
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={onWidthIncrease}>
          Width +
        </button>
        {[3, 4, 6].map((widthFeet) => (
          <button key={widthFeet} type="button" disabled={viewModel.readOnly} onClick={() => onWidthPreset(widthFeet)}>
            {widthFeet} ft
          </button>
        ))}
      </div>
    </div>
  );
}
