import type {
  BedPositionContract,
  EditableRoomGeometry,
  SplitRoomContract
} from "@nerdeus/shared";

import { splitRoomBedLabels } from "./splitRoomLabeling";

export type SplitRoomDividerOrientation = SplitRoomContract["dividerOrientation"];

export type ConvertRoomToSplitRoomInput = {
  room: EditableRoomGeometry;
  splitRoomId?: string;
  dividerOrientation?: SplitRoomDividerOrientation;
  dividerRatio?: number;
};

export const DEFAULT_SPLIT_ROOM_DIVIDER_RATIO = 0.5;

export type SplitRoomParentMoveResult = {
  parentRoom: EditableRoomGeometry;
  splitRoom: SplitRoomContract;
};

export type SplitRoomParentResizeResult = {
  parentRoom: EditableRoomGeometry;
  splitRoom: SplitRoomContract;
};

export type SplitRoomUnsplitResult = {
  parentRoom: EditableRoomGeometry;
  removedSplitRoomId: string;
  bedPositionsRemoved: true;
};

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

export function moveSplitRoomParent(input: {
  parentRoom: EditableRoomGeometry;
  splitRoom: SplitRoomContract;
  deltaXFeet: number;
  deltaYFeet: number;
}): SplitRoomParentMoveResult {
  return {
    parentRoom: {
      ...input.parentRoom,
      xFeet: input.parentRoom.xFeet + input.deltaXFeet,
      yFeet: input.parentRoom.yFeet + input.deltaYFeet
    },
    splitRoom: {
      ...input.splitRoom,
      bedPositions: input.splitRoom.bedPositions.map((bedPosition) => ({ ...bedPosition }))
    }
  };
}

export function splitRoomBedPositionAbsoluteBounds(input: {
  parentRoom: EditableRoomGeometry;
  bedPosition: BedPositionContract;
}) {
  const { parentRoom, bedPosition } = input;
  return {
    xFeet: parentRoom.xFeet + parentRoom.widthFeet * bedPosition.relativeBounds.xRatio,
    yFeet: parentRoom.yFeet + parentRoom.heightFeet * bedPosition.relativeBounds.yRatio,
    widthFeet: parentRoom.widthFeet * bedPosition.relativeBounds.widthRatio,
    heightFeet: parentRoom.heightFeet * bedPosition.relativeBounds.heightRatio
  };
}

export function resizeSplitRoomParent(input: {
  parentRoom: EditableRoomGeometry;
  splitRoom: SplitRoomContract;
  widthFeet: number;
  heightFeet: number;
}): SplitRoomParentResizeResult {
  const parentRoom = {
    ...input.parentRoom,
    widthFeet: Math.max(4, input.widthFeet),
    heightFeet: Math.max(4, input.heightFeet)
  };
  return {
    parentRoom,
    splitRoom: {
      ...input.splitRoom,
      bedPositions: recalculateSplitRoomBedRelativeBounds(input.splitRoom)
    }
  };
}

export function recalculateSplitRoomBedRelativeBounds(
  splitRoom: SplitRoomContract
): BedPositionContract[] {
  const [first, second] = splitRoom.bedPositions;
  if (first == null || second == null) {
    return splitRoom.bedPositions.map((bedPosition) => ({ ...bedPosition }));
  }
  const dividerRatio = clampRatio(splitRoom.dividerRatio);
  if (splitRoom.dividerOrientation === "horizontal") {
    return [
      { ...first, relativeBounds: { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: dividerRatio } },
      { ...second, relativeBounds: { xRatio: 0, yRatio: dividerRatio, widthRatio: 1, heightRatio: 1 - dividerRatio } }
    ];
  }
  return [
    { ...first, relativeBounds: { xRatio: 0, yRatio: 0, widthRatio: dividerRatio, heightRatio: 1 } },
    { ...second, relativeBounds: { xRatio: dividerRatio, yRatio: 0, widthRatio: 1 - dividerRatio, heightRatio: 1 } }
  ];
}

export function updateSplitRoomDividerOrientation(
  splitRoom: SplitRoomContract,
  dividerOrientation: SplitRoomDividerOrientation
): SplitRoomContract {
  const nextSplitRoom = {
    ...splitRoom,
    dividerOrientation
  };
  return {
    ...nextSplitRoom,
    bedPositions: recalculateSplitRoomBedRelativeBounds(nextSplitRoom)
  };
}

export function updateSplitRoomDividerRatio(
  splitRoom: SplitRoomContract,
  dividerRatio: number
): SplitRoomContract {
  const nextSplitRoom = {
    ...splitRoom,
    dividerRatio: clampRatio(dividerRatio)
  };
  return {
    ...nextSplitRoom,
    bedPositions: recalculateSplitRoomBedRelativeBounds(nextSplitRoom)
  };
}

export function resetSplitRoomDividerToEven(splitRoom: SplitRoomContract): SplitRoomContract {
  return updateSplitRoomDividerRatio(splitRoom, DEFAULT_SPLIT_ROOM_DIVIDER_RATIO);
}

export function unsplitSplitRoomToParentRoom(input: {
  parentRoom: EditableRoomGeometry;
  splitRoom: SplitRoomContract;
}): SplitRoomUnsplitResult {
  return {
    parentRoom: { ...input.parentRoom },
    removedSplitRoomId: input.splitRoom.splitRoomId,
    bedPositionsRemoved: true
  };
}

function createTwoBedPositions(input: {
  parentRoom: EditableRoomGeometry;
  dividerOrientation: SplitRoomDividerOrientation;
  dividerRatio: number;
}): BedPositionContract[] {
  const labelRoot = input.parentRoom.roomNumber || input.parentRoom.label;
  const [bedALabel, bedBLabel] = splitRoomBedLabels(labelRoot);
  if (input.dividerOrientation === "horizontal") {
    return [
      createBedPosition(input.parentRoom, "a", bedALabel, {
        xRatio: 0,
        yRatio: 0,
        widthRatio: 1,
        heightRatio: input.dividerRatio
      }),
      createBedPosition(input.parentRoom, "b", bedBLabel, {
        xRatio: 0,
        yRatio: input.dividerRatio,
        widthRatio: 1,
        heightRatio: 1 - input.dividerRatio
      })
    ];
  }
  return [
    createBedPosition(input.parentRoom, "a", bedALabel, {
      xRatio: 0,
      yRatio: 0,
      widthRatio: input.dividerRatio,
      heightRatio: 1
    }),
    createBedPosition(input.parentRoom, "b", bedBLabel, {
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
