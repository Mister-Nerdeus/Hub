import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import { isPatientCareRoomType } from "./roomTypeRules.js";
import {
  splitRoomPairForRoomId,
  type SplitRoomPairResolution
} from "./splitRoomContracts.js";

export function resolveSplitRoomPair(input: {
  layout: EditableLayoutGeometryContract;
  selectedRoomId: string;
}): SplitRoomPairResolution {
  const layout = validateEditableLayoutGeometryContract(input.layout);
  const canonicalPair = splitRoomPairForRoomId(input.selectedRoomId);
  if (canonicalPair == null) {
    return blocked(input.selectedRoomId, "No canonical split room pair is configured for the selected room.");
  }

  const selectedRoom = layout.rooms.find((room) => room.id === input.selectedRoomId);
  const expectedPartnerId =
    input.selectedRoomId === canonicalPair.roomAId ? canonicalPair.roomBId : canonicalPair.roomAId;
  const partnerRoom = layout.rooms.find((room) => room.id === expectedPartnerId);
  if (selectedRoom == null) {
    return blocked(input.selectedRoomId, "Selected room is missing.", expectedPartnerId);
  }
  if (partnerRoom == null) {
    return blocked(input.selectedRoomId, "Partner room is missing.", expectedPartnerId);
  }
  if (roomAlreadySplit(layout, selectedRoom.id) || roomAlreadySplit(layout, partnerRoom.id)) {
    return blocked(input.selectedRoomId, "One or both rooms are already part of a split room.", expectedPartnerId);
  }
  const nonPatientCareRoom = [selectedRoom, partnerRoom].find((room) => !isPatientCareRoomType(room.roomType));
  if (nonPatientCareRoom != null) {
    return blocked(
      input.selectedRoomId,
      `${displayRoom(nonPatientCareRoom)} cannot be used because it is ${formatRoomType(nonPatientCareRoom.roomType)}.`,
      expectedPartnerId
    );
  }
  if (!roomsHaveCompatibleGeometry(selectedRoom, partnerRoom)) {
    return blocked(input.selectedRoomId, "Room geometry does not align for one physical split room.", expectedPartnerId);
  }

  const roomA = layout.rooms.find((room) => room.id === canonicalPair.roomAId);
  const roomB = layout.rooms.find((room) => room.id === canonicalPair.roomBId);
  if (roomA == null || roomB == null) {
    return blocked(input.selectedRoomId, "Canonical split room pair could not be resolved.", expectedPartnerId);
  }
  return {
    status: "ready",
    pairId: canonicalPair.pairId,
    pairLabel: canonicalPair.pairLabel,
    roomAId: canonicalPair.roomAId,
    roomBId: canonicalPair.roomBId,
    roomALabel: displayRoom(roomA),
    roomBLabel: displayRoom(roomB),
    suggestedDivider: canonicalPair.suggestedDivider,
    physicalBayCount: 1,
    patientCarePositionCount: 2
  };
}

function blocked(
  selectedRoomId: string,
  reason: string,
  expectedPartnerId?: string
): SplitRoomPairResolution {
  return {
    status: "blocked",
    reason,
    selectedRoomId,
    ...(expectedPartnerId == null ? {} : { expectedPartnerId })
  };
}

function roomAlreadySplit(layout: EditableLayoutGeometryContract, roomId: string): boolean {
  return (layout.splitBays ?? []).some((splitBay) => splitBay.bedPositionRoomIds.includes(roomId));
}

function roomsHaveCompatibleGeometry(
  roomA: EditableRoomGeometry,
  roomB: EditableRoomGeometry
): boolean {
  const sameRow = roomA.yFeet === roomB.yFeet && roomA.heightFeet === roomB.heightFeet;
  const sameColumn = roomA.xFeet === roomB.xFeet && roomA.widthFeet === roomB.widthFeet;
  return sameRow || sameColumn;
}

function displayRoom(room: EditableRoomGeometry): string {
  return `Room ${room.roomNumber || room.label}`;
}

function formatRoomType(roomType: EditableRoomGeometry["roomType"]): string {
  if (roomType === "solid_wall") return "solid wall";
  if (roomType === "provider_pharmacy") return "provider/pharmacy support";
  return roomType.replaceAll("_", " ");
}
