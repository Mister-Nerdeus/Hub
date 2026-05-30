import type {
  EditableRoomGeometry,
  EditableSplitBayGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import { createEditableSplitBayOverlay, unionRoomRectFeet } from "./editableSplitBayOverlayContract.js";
import { CANONICAL_SPLIT_BAY_CANDIDATES } from "./splitBayContract.js";

export type CanonicalSplitBayEditableBridgeResult = {
  status: "passed" | "blocked";
  splitBays: EditableSplitBayGeometry[];
  roomPairMappings: Record<string, string>;
  blockers: string[];
};

export function buildCanonicalSplitBayEditableOverlays(
  rooms: readonly EditableRoomGeometry[]
): CanonicalSplitBayEditableBridgeResult {
  const roomsById = new Map(rooms.map((room) => [room.id, room]));
  const blockers: string[] = [];
  const splitBays: EditableSplitBayGeometry[] = [];
  const roomPairMappings: Record<string, string> = {};
  for (const candidate of CANONICAL_SPLIT_BAY_CANDIDATES) {
    const pairRooms = candidate.bedPositionRoomIds.map((roomId) => roomsById.get(roomId));
    if (pairRooms.some((room) => room == null)) {
      blockers.push(`${candidate.splitBayId} missing one or more bed-position rooms`);
      continue;
    }
    const typedRooms = pairRooms as [EditableRoomGeometry, EditableRoomGeometry];
    const rect = unionRoomRectFeet(typedRooms);
    splitBays.push(createEditableSplitBayOverlay({
      splitBayId: candidate.splitBayId,
      label: labelForSplitBay(candidate.bedPositionRoomIds),
      bedPositionRoomIds: candidate.bedPositionRoomIds,
      dividerStyle: "diagonal",
      ...rect
    }));
    for (const roomId of candidate.bedPositionRoomIds) {
      roomPairMappings[roomId] = candidate.splitBayId;
    }
  }
  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    splitBays,
    roomPairMappings,
    blockers
  };
}

function labelForSplitBay(roomIds: readonly [string, string]): string {
  return roomIds.map((roomId) => String(Number(roomId.replace("room-", "")))).join("/");
}
