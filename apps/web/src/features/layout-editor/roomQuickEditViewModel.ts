import {
  isNurseAssignableRoomType,
  isPatientCareRoomType,
  type EditableRoomGeometry,
  type EditableRoomType
} from "@nerdeus/shared";

export type RoomQuickEditViewModel = {
  status: "missing" | "ready";
  roomId: string | null;
  label: string;
  roomNumber: string;
  roomType: EditableRoomType | null;
  widthFeet: number | null;
  heightFeet: number | null;
  readOnly: boolean;
  assignNurseDisabled: boolean;
  assignNurseDisabledReason: string | null;
  addDoorDisabled: boolean;
  addDoorDisabledReason: string | null;
  deleteDisabled: boolean;
  duplicateDisabled: boolean;
};

export function buildRoomQuickEdit({
  room,
  readOnly
}: {
  room: EditableRoomGeometry | null;
  readOnly: boolean;
}): RoomQuickEditViewModel {
  if (room == null) {
    return {
      status: "missing",
      roomId: null,
      label: "No room selected",
      roomNumber: "",
      roomType: null,
      widthFeet: null,
      heightFeet: null,
      readOnly: true,
      assignNurseDisabled: true,
      assignNurseDisabledReason: null,
      addDoorDisabled: true,
      addDoorDisabledReason: null,
      deleteDisabled: true,
      duplicateDisabled: true
    };
  }
  const assignable = isNurseAssignableRoomType(room.roomType);
  const doorEligible = isPatientCareRoomType(room.roomType);
  return {
    status: "ready",
    roomId: room.id,
    label: room.label,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    widthFeet: room.widthFeet,
    heightFeet: room.heightFeet,
    readOnly,
    assignNurseDisabled: readOnly || !assignable,
    assignNurseDisabledReason: assignable ? null : `${room.roomType} is excluded from nurse assignment.`,
    addDoorDisabled: readOnly || !doorEligible,
    addDoorDisabledReason: doorEligible ? null : addDoorDisabledReasonForRoomType(room.roomType),
    deleteDisabled: readOnly,
    duplicateDisabled: readOnly
  };
}

function addDoorDisabledReasonForRoomType(roomType: EditableRoomType): string {
  switch (roomType) {
    case "solid_wall":
      return "Solid wall / blocked area cannot accept doors.";
    case "storage":
      return "Storage/support-only rooms use non-patient access workflows.";
    case "provider_pharmacy":
      return "Provider/pharmacy areas use support access point tooling.";
    default:
      return "Selected room is not a patient-room door target.";
  }
}
