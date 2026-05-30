import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry,
  type EditableSplitBayDividerStyle,
  type EditableSplitBayGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";

export type SplitBayOverlayValidationResult = {
  status: "passed" | "blocked";
  splitBayCount: number;
  referencedBedPositionRoomIds: string[];
  physicalRoomCountContribution: number;
  duplicatesRoomData: false;
  blockers: string[];
};

export function createEditableSplitBayOverlay(input: {
  splitBayId: string;
  label: string;
  bedPositionRoomIds: readonly [string, string];
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
  dividerStyle?: EditableSplitBayDividerStyle;
}): EditableSplitBayGeometry {
  return {
    objectType: "split_bay",
    id: input.splitBayId,
    splitBayId: input.splitBayId,
    label: input.label,
    bedPositionRoomIds: input.bedPositionRoomIds,
    dividerStyle: input.dividerStyle ?? "diagonal",
    xFeet: input.xFeet,
    yFeet: input.yFeet,
    widthFeet: input.widthFeet,
    heightFeet: input.heightFeet
  };
}

export function validateEditableSplitBayOverlayLayout(
  layoutValue: EditableLayoutGeometryContract
): SplitBayOverlayValidationResult {
  const layout = validateEditableLayoutGeometryContract(layoutValue);
  const roomIds = new Set(layout.rooms.map((room) => room.id));
  const blockers: string[] = [];
  const referencedBedPositionRoomIds: string[] = [];
  for (const splitBay of layout.splitBays ?? []) {
    for (const roomId of splitBay.bedPositionRoomIds) {
      referencedBedPositionRoomIds.push(roomId);
      if (!roomIds.has(roomId)) {
        blockers.push(`${splitBay.splitBayId} references missing room ${roomId}`);
      }
    }
  }
  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    splitBayCount: layout.splitBays?.length ?? 0,
    referencedBedPositionRoomIds,
    physicalRoomCountContribution: layout.splitBays?.length ?? 0,
    duplicatesRoomData: false,
    blockers
  };
}

export function unionRoomRectFeet(rooms: readonly EditableRoomGeometry[]): {
  xFeet: number;
  yFeet: number;
  widthFeet: number;
  heightFeet: number;
} {
  if (rooms.length === 0) {
    throw new Error("at least one room is required");
  }
  const minX = Math.min(...rooms.map((room) => room.xFeet));
  const minY = Math.min(...rooms.map((room) => room.yFeet));
  const maxX = Math.max(...rooms.map((room) => room.xFeet + room.widthFeet));
  const maxY = Math.max(...rooms.map((room) => room.yFeet + room.heightFeet));
  return {
    xFeet: minX,
    yFeet: minY,
    widthFeet: maxX - minX,
    heightFeet: maxY - minY
  };
}
