import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import {
  authoringRoomTypeToEditableRoomType,
  validateAuthoringRoomType,
  type AuthoringRoomType
} from "./roomTypeContract.js";

export type AddRoomInput = {
  layout: EditableLayoutGeometryContract;
  readOnly: boolean;
  roomId: string;
  label: string;
  roomType: AuthoringRoomType;
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
  boundsFeet: { xFeet: number; yFeet: number; widthFeet: number; heightFeet: number };
};

export type AddRoomResult = {
  layout: EditableLayoutGeometryContract;
  selectedRoomId: string;
  warnings: string[];
};

export function addRoomToEditableLayout(input: AddRoomInput): AddRoomResult {
  if (input.readOnly) {
    throw new Error("add room is blocked for read-only default plans");
  }
  const layout = validateEditableLayoutGeometryContract(input.layout);
  if (layout.rooms.some((room) => room.id === input.roomId)) {
    throw new Error("room ID must be unique");
  }
  const roomType = validateAuthoringRoomType(input.roomType);
  const room: EditableRoomGeometry = {
    objectType: "room",
    id: requireString(input.roomId, "roomId"),
    label: requireString(input.label, "label"),
    roomNumber: input.label,
    roomType: authoringRoomTypeToEditableRoomType(roomType),
    capacityType: roomType === "hallway" ? "hall" : "single",
    isHallBed: roomType === "hallway",
    isTraumaAdjacent: roomType === "trauma_room",
    xFeet: requireFinite(input.xFeet, "xFeet"),
    yFeet: requireFinite(input.yFeet, "yFeet"),
    widthFeet: requirePositive(input.widthFeet, "widthFeet"),
    heightFeet: requirePositive(input.heightFeet, "heightFeet")
  };
  assertWithinBounds(room, input.boundsFeet);
  const nextLayout = validateEditableLayoutGeometryContract({
    ...layout,
    rooms: [...layout.rooms, room]
  });
  return {
    layout: nextLayout,
    selectedRoomId: room.id,
    warnings: [
      `Room ${room.id} has no authored door.`,
      `Room ${room.id} has no synced path node; route/path sync is stale.`
    ]
  };
}

function assertWithinBounds(
  room: Pick<EditableRoomGeometry, "xFeet" | "yFeet" | "widthFeet" | "heightFeet">,
  bounds: AddRoomInput["boundsFeet"]
): void {
  if (
    room.xFeet < bounds.xFeet ||
    room.yFeet < bounds.yFeet ||
    room.xFeet + room.widthFeet > bounds.xFeet + bounds.widthFeet ||
    room.yFeet + room.heightFeet > bounds.yFeet + bounds.heightFeet
  ) {
    throw new Error("room must be within layout bounds");
  }
}

function requireString(value: string, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireFinite(value: number, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return finite;
}
