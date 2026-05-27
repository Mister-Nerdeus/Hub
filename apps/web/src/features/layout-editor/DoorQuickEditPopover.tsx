import type { EditableDoorWall } from "@nerdeus/shared";
import type { DoorQuickEditViewModel } from "./doorQuickEditViewModel";

export type DoorQuickEditPopoverProps = {
  viewModel: DoorQuickEditViewModel;
  onWallChange: (wall: EditableDoorWall) => void;
  onNudge: (deltaFeet: number) => void;
  onCenter: () => void;
  onOpposite: () => void;
  onAdjacent: () => void;
  onDeleteDoor: () => void;
};

const WALLS: readonly EditableDoorWall[] = ["north", "south", "east", "west"];

export function DoorQuickEditPopover({
  viewModel,
  onWallChange,
  onNudge,
  onCenter,
  onOpposite,
  onAdjacent,
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
        <button type="button" disabled={viewModel.readOnly || !viewModel.canUseAdjacent} onClick={onAdjacent}>
          Adjacent
        </button>
        <button type="button" disabled={viewModel.deleteDisabled} onClick={onDeleteDoor}>
          Delete door
        </button>
      </div>
    </div>
  );
}
