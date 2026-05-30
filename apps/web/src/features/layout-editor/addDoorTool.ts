import {
  preflightAddDoor,
  type AddDoorPreflightResult,
  type EditableDoorWall,
  type EditableLayoutGeometryContract
} from "@nerdeus/shared";

export type AddDoorAction = {
  type: "addDoorToRoom";
  doorId: string;
  roomId: string;
  wall: EditableDoorWall;
  offsetFeet: number;
  widthFeet: number;
};

export type AddDoorToolResult =
  | { status: "allowed"; action: AddDoorAction; preflight: Extract<AddDoorPreflightResult, { status: "allowed" }> }
  | { status: "blocked"; reason: string };

export function buildAddDoorAction(input: {
  layout: EditableLayoutGeometryContract | null;
  sequence: number;
  roomId: string | null;
  wall?: EditableDoorWall;
  offsetFeet?: number;
  widthFeet?: number;
}): AddDoorToolResult {
  const preflight = preflightAddDoor({
    layout: input.layout,
    roomId: input.roomId,
    wall: input.wall,
    offsetFeet: input.offsetFeet,
    widthFeet: input.widthFeet
  });
  if (preflight.status === "blocked") {
    return { status: "blocked", reason: preflight.reason };
  }
  if (input.roomId == null || input.roomId.length === 0) {
    return { status: "blocked", reason: "Select a patient room before adding a door." };
  }
  const doorId = `authored-door-${String(input.sequence).padStart(3, "0")}`;
  return {
    status: "allowed",
    preflight,
    action: {
      type: "addDoorToRoom" as const,
      doorId,
      roomId: input.roomId,
      wall: preflight.wall,
      offsetFeet: preflight.offsetFeet,
      widthFeet: preflight.widthFeet
    }
  };
}
