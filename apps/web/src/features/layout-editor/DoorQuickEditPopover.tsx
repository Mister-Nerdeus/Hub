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
  if (viewModel.ownerStatus !== "room") {
    return (
      <div className="door-quick-edit-popover" data-door-quick-edit="ready">
        <p className="door-quick-edit-popover__owner">
          {viewModel.ownerKindLabel}: {viewModel.ownerLabel}
        </p>
        <p role="status">{viewModel.ownerWarning ?? viewModel.noCandidateReason}</p>
        <div className="door-quick-edit-popover__row">
          <span>{viewModel.ownerStatus === "hallway" ? "Hallway opening" : "Owner recovery"}</span>
          <button type="button" disabled={viewModel.deleteDisabled} onClick={onDeleteDoor}>
            Delete door
          </button>
        </div>
      </div>
    );
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
          value=""
          disabled={viewModel.readOnly || viewModel.adjacentCandidates.length === 0}
          onChange={(event) => {
            if (event.currentTarget.value === "") {
              return;
            }
            const candidate = viewModel.adjacentCandidates.find((item) => item.roomId === event.currentTarget.value);
            if (candidate != null && !candidate.disabled) {
              onAdjacentCandidate(candidate.roomId, candidate.wall, candidate.previewOffsetFeet);
            }
          }}
        >
          <option value="">Select candidate...</option>
          {viewModel.adjacentCandidates.map((candidate) => (
            <option key={candidate.roomId} value={candidate.roomId} disabled={candidate.disabled}>
              {candidate.roomLabel} / {candidate.wall} / {candidate.relationshipLabel}
              {candidate.disabled && candidate.disabledReason != null ? ` - ${candidate.disabledReason}` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="door-quick-edit-popover__row">
        <span>{viewModel.noCandidateReason ?? "Adjacent candidate selection available"}</span>
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
      <p className="door-quick-edit-popover__owner">
        {viewModel.ownerKindLabel}: {viewModel.ownerLabel}
      </p>
    </div>
  );
}
