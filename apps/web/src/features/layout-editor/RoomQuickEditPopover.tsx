import type { EditableRoomType } from "@nerdeus/shared";
import type { RoomQuickEditViewModel } from "./roomQuickEditViewModel";

export type RoomQuickEditPopoverProps = {
  viewModel: RoomQuickEditViewModel;
  onRoomTypeChange: (roomType: EditableRoomType) => void;
  onWidthStep: (deltaFeet: number) => void;
  onHeightStep: (deltaFeet: number) => void;
  onAssignNurse: () => void;
  onAddDoor: () => void;
  onDuplicateRoom: () => void;
  onDeleteRoom: () => void;
};

const ROOM_TYPE_OPTIONS: readonly EditableRoomType[] = [
  "standard",
  "trauma",
  "isolation",
  "behavioral",
  "hall_bed",
  "procedure",
  "overflow",
  "storage",
  "solid_wall"
];

export function RoomQuickEditPopover({
  viewModel,
  onRoomTypeChange,
  onWidthStep,
  onHeightStep,
  onAssignNurse,
  onAddDoor,
  onDuplicateRoom,
  onDeleteRoom
}: RoomQuickEditPopoverProps) {
  if (viewModel.status !== "ready" || viewModel.roomType == null) {
    return <p>No room selected.</p>;
  }
  return (
    <div className="room-quick-edit-popover" data-room-quick-edit="ready">
      <label>
        Room number / label
        <input value={`${viewModel.roomNumber} / ${viewModel.label}`} readOnly />
      </label>
      <label>
        Room type
        <select
          value={viewModel.roomType}
          disabled={viewModel.readOnly}
          onChange={(event) => onRoomTypeChange(event.target.value as EditableRoomType)}
        >
          {ROOM_TYPE_OPTIONS.map((roomType) => (
            <option key={roomType} value={roomType}>
              {roomType}
            </option>
          ))}
        </select>
      </label>
      <div className="room-quick-edit-popover__sizes">
        <span>Width {viewModel.widthFeet} ft</span>
        <button type="button" disabled={viewModel.readOnly} onClick={() => onWidthStep(-1)}>
          -W
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={() => onWidthStep(1)}>
          +W
        </button>
        <span>Height {viewModel.heightFeet} ft</span>
        <button type="button" disabled={viewModel.readOnly} onClick={() => onHeightStep(-1)}>
          -H
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={() => onHeightStep(1)}>
          +H
        </button>
      </div>
      <div className="room-quick-edit-popover__actions">
        <button type="button" disabled={viewModel.readOnly} onClick={onAssignNurse}>
          Assign nurse
        </button>
        <button
          type="button"
          disabled={viewModel.addDoorDisabled}
          title={viewModel.addDoorDisabledReason ?? undefined}
          onClick={onAddDoor}
        >
          Add door
        </button>
        <button type="button" disabled={viewModel.duplicateDisabled} onClick={onDuplicateRoom}>
          Duplicate room
        </button>
        <button type="button" disabled={viewModel.deleteDisabled} onClick={onDeleteRoom}>
          Delete room
        </button>
      </div>
    </div>
  );
}
