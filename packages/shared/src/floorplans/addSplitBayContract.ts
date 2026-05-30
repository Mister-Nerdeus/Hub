import type {
  EditableLayoutGeometryContract,
  EditableRoomGeometry,
  EditableSplitBayDividerStyle
} from "../layout-editor/editableLayoutGeometryContract.js";
import { createEditableSplitBayOverlay, unionRoomRectFeet } from "./editableSplitBayOverlayContract.js";

export type AddSplitBayResult = {
  layout: EditableLayoutGeometryContract;
  selectedSplitBayId: string;
  createdRoomIds: readonly [string, string];
};

export function addSplitBayToEditableLayout(input: {
  layout: EditableLayoutGeometryContract;
  readOnly: boolean;
  splitBayId: string;
  label: string;
  roomA: EditableRoomGeometry;
  roomB: EditableRoomGeometry;
  dividerStyle?: EditableSplitBayDividerStyle;
}): AddSplitBayResult {
  if (input.readOnly) {
    throw new Error("split bay authoring is disabled for read-only layouts");
  }
  const existingRoomIds = new Set(input.layout.rooms.map((room) => room.id));
  const rooms = [
    ...input.layout.rooms,
    ...[input.roomA, input.roomB].filter((room) => !existingRoomIds.has(room.id))
  ];
  const rect = unionRoomRectFeet([input.roomA, input.roomB]);
  const splitBay = createEditableSplitBayOverlay({
    splitBayId: input.splitBayId,
    label: input.label,
    bedPositionRoomIds: [input.roomA.id, input.roomB.id],
    ...rect,
    dividerStyle: input.dividerStyle ?? "diagonal"
  });
  return {
    layout: {
      ...input.layout,
      rooms,
      splitBays: [
        ...(input.layout.splitBays ?? []).filter((candidate) => candidate.splitBayId !== splitBay.splitBayId),
        splitBay
      ]
    },
    selectedSplitBayId: splitBay.splitBayId,
    createdRoomIds: [input.roomA.id, input.roomB.id]
  };
}
