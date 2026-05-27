import type {
  EditableDoorWall,
  EditableRectFeet
} from "../layout-editor/editableLayoutGeometryContract.js";

export type DoorWallOrientation = "horizontal" | "vertical";

export type DoorWallSegment = {
  wall: EditableDoorWall;
  orientation: DoorWallOrientation;
  fixedAxisFeet: number;
  minFeet: number;
  maxFeet: number;
};

export function wallLengthFeet(room: Pick<EditableRectFeet, "widthFeet" | "heightFeet">, wall: EditableDoorWall): number {
  return wall === "north" || wall === "south" ? room.widthFeet : room.heightFeet;
}

export function deriveDoorOrientationFromWall(wall: EditableDoorWall): DoorWallOrientation {
  return wall === "north" || wall === "south" ? "horizontal" : "vertical";
}

export function oppositeWall(wall: EditableDoorWall): EditableDoorWall {
  switch (wall) {
    case "north":
      return "south";
    case "south":
      return "north";
    case "east":
      return "west";
    case "west":
      return "east";
  }
}

export function getWallSegment(rect: EditableRectFeet, wall: EditableDoorWall): DoorWallSegment {
  switch (wall) {
    case "north":
      return {
        wall,
        orientation: "horizontal",
        fixedAxisFeet: rect.yFeet,
        minFeet: rect.xFeet,
        maxFeet: rect.xFeet + rect.widthFeet
      };
    case "south":
      return {
        wall,
        orientation: "horizontal",
        fixedAxisFeet: rect.yFeet + rect.heightFeet,
        minFeet: rect.xFeet,
        maxFeet: rect.xFeet + rect.widthFeet
      };
    case "west":
      return {
        wall,
        orientation: "vertical",
        fixedAxisFeet: rect.xFeet,
        minFeet: rect.yFeet,
        maxFeet: rect.yFeet + rect.heightFeet
      };
    case "east":
      return {
        wall,
        orientation: "vertical",
        fixedAxisFeet: rect.xFeet + rect.widthFeet,
        minFeet: rect.yFeet,
        maxFeet: rect.yFeet + rect.heightFeet
      };
  }
}

export function overlapLengthFeet(
  left: Pick<DoorWallSegment, "minFeet" | "maxFeet">,
  right: Pick<DoorWallSegment, "minFeet" | "maxFeet">
): number {
  return Math.max(0, Math.min(left.maxFeet, right.maxFeet) - Math.max(left.minFeet, right.minFeet));
}

export function axisGapFeet(leftFixedAxisFeet: number, rightFixedAxisFeet: number): number {
  return Math.abs(leftFixedAxisFeet - rightFixedAxisFeet);
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
