import type { EditableRoomType } from "@nerdeus/shared";
import type { RoomQuickEditViewModel } from "./roomQuickEditViewModel";
import {
  validateRoomOperationalLabel,
  validateRoomOperationalNumber
} from "./roomLabelValidation";

export type RoomQuickEditPopoverProps = {
  viewModel: RoomQuickEditViewModel;
  onRoomTypeChange: (roomType: EditableRoomType) => void;
  onRoomIdentityChange: (input: { roomNumber: string; label: string }) => void;
  onWidthStep: (deltaFeet: number) => void;
  onHeightStep: (deltaFeet: number) => void;
  onAssignNurse: () => void;
  onAddDoor: () => void;
  onConvertToSplitBay?: () => void;
  onRemoveAttachedDoors: () => void;
  onDuplicateRoom: () => void;
  onDeleteRoom: () => void;
  attachedDoorCount?: number;
};

const ROOM_TYPE_OPTIONS: readonly EditableRoomType[] = [
  "standard",
  "trauma",
  "isolation",
  "behavioral",
  "hall_bed",
  "procedure",
  "overflow",
  "provider_pharmacy",
  "storage",
  "solid_wall"
];

export function RoomQuickEditPopover({
  viewModel,
  onRoomTypeChange,
  onRoomIdentityChange,
  onWidthStep,
  onHeightStep,
  onAssignNurse,
  onAddDoor,
  onConvertToSplitBay,
  onRemoveAttachedDoors,
  onDuplicateRoom,
  onDeleteRoom,
  attachedDoorCount = 0
}: RoomQuickEditPopoverProps) {
  const commitIdentity = (input: HTMLInputElement, roomNumber: string, label: string) => {
    const roomNumberResult = validateRoomOperationalNumber(roomNumber);
    if (roomNumberResult.status === "rejected") {
      input.setCustomValidity(roomNumberResult.reason);
      input.reportValidity();
      return;
    }
    const labelResult = validateRoomOperationalLabel(label);
    if (labelResult.status === "rejected") {
      input.setCustomValidity(labelResult.reason);
      input.reportValidity();
      return;
    }
    input.setCustomValidity("");
    onRoomIdentityChange({
      roomNumber: roomNumberResult.value,
      label: labelResult.value
    });
  };
  if (viewModel.status !== "ready" || viewModel.roomType == null) {
    return <p>No room selected.</p>;
  }
  return (
    <div className="room-quick-edit-popover" data-room-quick-edit="ready">
      <label>
        Room number
        <input
          defaultValue={viewModel.roomNumber}
          readOnly={viewModel.readOnly}
          onBlur={(event) => commitIdentity(event.currentTarget, event.currentTarget.value, viewModel.label)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitIdentity(event.currentTarget, event.currentTarget.value, viewModel.label);
            if (event.key === "Escape") event.currentTarget.value = viewModel.roomNumber;
          }}
        />
      </label>
      <label>
        Room label
        <input
          defaultValue={viewModel.label}
          readOnly={viewModel.readOnly}
          onBlur={(event) => commitIdentity(event.currentTarget, viewModel.roomNumber, event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitIdentity(event.currentTarget, viewModel.roomNumber, event.currentTarget.value);
            if (event.key === "Escape") event.currentTarget.value = viewModel.label;
          }}
        />
      </label>
      <p className="room-quick-edit-popover__validation">Operational labels only.</p>
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
        <button
          type="button"
          disabled={viewModel.assignNurseDisabled}
          title={viewModel.assignNurseDisabledReason ?? undefined}
          onClick={onAssignNurse}
        >
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
        <button
          type="button"
          disabled={viewModel.readOnly || attachedDoorCount === 0}
          onClick={onRemoveAttachedDoors}
        >
          Remove attached doors
        </button>
        <button type="button" disabled={viewModel.duplicateDisabled} onClick={onDuplicateRoom}>
          Duplicate room
        </button>
        <button type="button" disabled={viewModel.deleteDisabled} onClick={onDeleteRoom}>
          Delete room
        </button>
        {onConvertToSplitBay == null ? null : (
          <button
            type="button"
            disabled={viewModel.readOnly || viewModel.roomType === "solid_wall"}
            onClick={onConvertToSplitBay}
          >
            Convert pair to Split Bay
          </button>
        )}
      </div>
    </div>
  );
}
