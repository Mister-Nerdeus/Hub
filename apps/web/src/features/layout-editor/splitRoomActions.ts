import type {
  BedPositionContract,
  EditableRoomGeometry,
  SplitRoomContract
} from "@nerdeus/shared";

export type SplitRoomDividerOrientation = SplitRoomContract["dividerOrientation"];

export type ConvertRoomToSplitRoomInput = {
  room: EditableRoomGeometry;
  splitRoomId?: string;
  dividerOrientation?: SplitRoomDividerOrientation;
  dividerRatio?: number;
};

export const DEFAULT_SPLIT_ROOM_DIVIDER_RATIO = 0.5;

export function convertSingleRoomToSplitRoom(
  input: ConvertRoomToSplitRoomInput
): SplitRoomContract {
  const dividerOrientation = input.dividerOrientation ?? "vertical";
  const dividerRatio = clampRatio(input.dividerRatio ?? DEFAULT_SPLIT_ROOM_DIVIDER_RATIO);
  return {
    splitRoomId: input.splitRoomId ?? splitRoomIdForParentRoom(input.room),
    parentRoomId: input.room.id,
    splitMode: "two_bed",
    dividerOrientation,
    dividerRatio,
    bedPositions: createTwoBedPositions({
      parentRoom: input.room,
      dividerOrientation,
      dividerRatio
    })
  };
}

export function splitRoomIdForParentRoom(room: EditableRoomGeometry): string {
  return `split-room-${room.id}`;
}

export function requiresRoomMergeForSplitConversion(): false {
  return false;
}

function createTwoBedPositions(input: {
  parentRoom: EditableRoomGeometry;
  dividerOrientation: SplitRoomDividerOrientation;
  dividerRatio: number;
}): BedPositionContract[] {
  const labelRoot = input.parentRoom.roomNumber || input.parentRoom.label;
  if (input.dividerOrientation === "horizontal") {
    return [
      createBedPosition(input.parentRoom, "a", `${labelRoot}A`, {
        xRatio: 0,
        yRatio: 0,
        widthRatio: 1,
        heightRatio: input.dividerRatio
      }),
      createBedPosition(input.parentRoom, "b", `${labelRoot}B`, {
        xRatio: 0,
        yRatio: input.dividerRatio,
        widthRatio: 1,
        heightRatio: 1 - input.dividerRatio
      })
    ];
  }
  return [
    createBedPosition(input.parentRoom, "a", `${labelRoot}A`, {
      xRatio: 0,
      yRatio: 0,
      widthRatio: input.dividerRatio,
      heightRatio: 1
    }),
    createBedPosition(input.parentRoom, "b", `${labelRoot}B`, {
      xRatio: input.dividerRatio,
      yRatio: 0,
      widthRatio: 1 - input.dividerRatio,
      heightRatio: 1
    })
  ];
}

function createBedPosition(
  parentRoom: EditableRoomGeometry,
  suffix: "a" | "b",
  label: string,
  relativeBounds: BedPositionContract["relativeBounds"]
): BedPositionContract {
  return {
    bedPositionId: `${parentRoom.id}:bed-${suffix}`,
    parentRoomId: parentRoom.id,
    label,
    assignmentTarget: true,
    relativeBounds
  };
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SPLIT_ROOM_DIVIDER_RATIO;
  }
  return Math.min(Math.max(value, 0.2), 0.8);
}
