import type {
  EditableLayoutGeometryContract,
  EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";

export type RoomAlignmentOperation =
  | "alignTop"
  | "alignBottom"
  | "alignLeft"
  | "alignRight"
  | "matchWidth"
  | "matchHeight"
  | "snapToGrid";

export function alignRoomToReference(input: {
  layout: EditableLayoutGeometryContract;
  roomId: string;
  referenceRoomId: string;
  operation: Exclude<RoomAlignmentOperation, "snapToGrid">;
}): EditableLayoutGeometryContract {
  const target = requireRoom(input.layout, input.roomId);
  const reference = requireRoom(input.layout, input.referenceRoomId);
  return replaceRoom(input.layout, applyReferenceOperation(target, reference, input.operation));
}

export function snapRoomToGrid(input: {
  layout: EditableLayoutGeometryContract;
  roomId: string;
  gridFeet?: number;
}): EditableLayoutGeometryContract {
  const gridFeet = input.gridFeet ?? 2;
  const room = requireRoom(input.layout, input.roomId);
  return replaceRoom(input.layout, {
    ...room,
    xFeet: snap(room.xFeet, gridFeet),
    yFeet: snap(room.yFeet, gridFeet),
    widthFeet: Math.max(4, snap(room.widthFeet, gridFeet)),
    heightFeet: Math.max(4, snap(room.heightFeet, gridFeet))
  });
}

function applyReferenceOperation(
  target: EditableRoomGeometry,
  reference: EditableRoomGeometry,
  operation: Exclude<RoomAlignmentOperation, "snapToGrid">
): EditableRoomGeometry {
  switch (operation) {
    case "alignTop":
      return { ...target, yFeet: reference.yFeet };
    case "alignBottom":
      return { ...target, yFeet: reference.yFeet + reference.heightFeet - target.heightFeet };
    case "alignLeft":
      return { ...target, xFeet: reference.xFeet };
    case "alignRight":
      return { ...target, xFeet: reference.xFeet + reference.widthFeet - target.widthFeet };
    case "matchWidth":
      return { ...target, widthFeet: reference.widthFeet };
    case "matchHeight":
      return { ...target, heightFeet: reference.heightFeet };
  }
}

function requireRoom(layout: EditableLayoutGeometryContract, roomId: string): EditableRoomGeometry {
  const room = layout.rooms.find((candidate) => candidate.id === roomId);
  if (room == null) {
    throw new Error(`unknown room: ${roomId}`);
  }
  return room;
}

function replaceRoom(layout: EditableLayoutGeometryContract, room: EditableRoomGeometry): EditableLayoutGeometryContract {
  return {
    ...layout,
    rooms: layout.rooms.map((candidate) => (candidate.id === room.id ? room : candidate))
  };
}

function snap(value: number, gridFeet: number): number {
  return Math.round(value / gridFeet) * gridFeet;
}
