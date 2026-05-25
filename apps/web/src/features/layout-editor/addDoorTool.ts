import type { EditableDoorWall } from "@nerdeus/shared";

export function buildAddDoorAction(input: {
  sequence: number;
  roomId: string;
  wall?: EditableDoorWall;
  offsetFeet?: number;
  widthFeet?: number;
}) {
  const doorId = `authored-door-${String(input.sequence).padStart(3, "0")}`;
  return {
    type: "addDoorToRoom" as const,
    doorId,
    roomId: input.roomId,
    wall: input.wall ?? "south",
    offsetFeet: input.offsetFeet ?? 1,
    widthFeet: input.widthFeet ?? 4
  };
}
