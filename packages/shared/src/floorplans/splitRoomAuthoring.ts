import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { createEditableSplitBayOverlay, unionRoomRectFeet } from "./editableSplitBayOverlayContract.js";
import { resolveSplitRoomPair } from "./splitRoomPairResolver.js";
import { splitRoomIdForPair, type SplitRoomAuthoringResult } from "./splitRoomContracts.js";

export function createSplitRoomInEditableLayout(input: {
  layout: EditableLayoutGeometryContract;
  readOnly?: boolean;
  selectedRoomId: string;
}): SplitRoomAuthoringResult {
  const layout = validateEditableLayoutGeometryContract(input.layout);
  if (input.readOnly === true) {
    return {
      status: "blocked",
      layout,
      reason: "Read-only layouts cannot be edited."
    };
  }

  const resolution = resolveSplitRoomPair({ layout, selectedRoomId: input.selectedRoomId });
  if (resolution.status === "blocked") {
    return {
      status: "blocked",
      layout,
      reason: resolution.reason
    };
  }

  const roomA = layout.rooms.find((room) => room.id === resolution.roomAId);
  const roomB = layout.rooms.find((room) => room.id === resolution.roomBId);
  if (roomA == null || roomB == null) {
    return {
      status: "blocked",
      layout,
      reason: "Split room child rooms could not be resolved."
    };
  }

  const splitBayId = splitRoomIdForPair(roomA.id, roomB.id);
  const rect = unionRoomRectFeet([roomA, roomB]);
  const splitBay = createEditableSplitBayOverlay({
    splitBayId,
    label: resolution.pairLabel,
    bedPositionRoomIds: [roomA.id, roomB.id],
    dividerStyle: resolution.suggestedDivider,
    ...rect
  });
  const nextLayout = validateEditableLayoutGeometryContract({
    ...layout,
    splitBays: [
      ...(layout.splitBays ?? []).filter((candidate) => candidate.splitBayId !== splitBayId),
      splitBay
    ].sort((left, right) => left.splitBayId.localeCompare(right.splitBayId))
  });

  return {
    status: "created",
    layout: nextLayout,
    splitBayId,
    pairLabel: resolution.pairLabel,
    childRoomIds: [roomA.id, roomB.id],
    warnings: []
  };
}

export function removeSplitRoomFromEditableLayout(input: {
  layout: EditableLayoutGeometryContract;
  splitBayId: string;
  readOnly?: boolean;
}): SplitRoomAuthoringResult {
  const layout = validateEditableLayoutGeometryContract(input.layout);
  if (input.readOnly === true) {
    return {
      status: "blocked",
      layout,
      reason: "Read-only layouts cannot be edited."
    };
  }
  const splitBay = (layout.splitBays ?? []).find((candidate) => candidate.splitBayId === input.splitBayId);
  if (splitBay == null) {
    return {
      status: "blocked",
      layout,
      reason: "Split room is missing."
    };
  }
  return {
    status: "created",
    layout: validateEditableLayoutGeometryContract({
      ...layout,
      splitBays: (layout.splitBays ?? []).filter((candidate) => candidate.splitBayId !== input.splitBayId)
    }),
    splitBayId: input.splitBayId,
    pairLabel: splitBay.label,
    childRoomIds: [...splitBay.bedPositionRoomIds] as [string, string],
    warnings: []
  };
}
