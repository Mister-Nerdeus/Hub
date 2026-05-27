import type {
  EditableDoorGeometry,
  EditableDoorWall,
  EditableHallwayGeometry,
  EditableLayoutGeometryContract,
  EditableRectFeet,
  EditableRoomGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";
import {
  axisGapFeet,
  getWallSegment,
  oppositeWall,
  overlapLengthFeet,
  wallLengthFeet
} from "./doorGeometryUtils.js";
import { isDoorEligibleRoomType } from "./roomTypeRules.js";

export type DoorAdjacencyRelationshipType = "shared_wall" | "near_touching" | "hallway_adjacent";

export type DoorAdjacencyReasonCode =
  | "owner_not_found"
  | "owner_not_room"
  | "owner_room_door_ineligible"
  | "candidate_shared_wall"
  | "candidate_near_touching"
  | "candidate_hallway_adjacent"
  | "no_geometric_candidate"
  | "owner_wall_has_hallway_only";

export type DoorAdjacencyCandidate = {
  roomId: string;
  roomLabel: string;
  wall: EditableDoorWall;
  relationshipType: DoorAdjacencyRelationshipType;
  sharedOverlapFeet: number;
  previewOffsetFeet: number;
  hallwayId: string | null;
  reasonCode: DoorAdjacencyReasonCode;
};

export type DoorAdjacencyResult = {
  status: "candidates_found" | "no_candidates";
  doorId: string;
  ownerRoomId: string | null;
  ownerWall: EditableDoorWall;
  candidates: DoorAdjacencyCandidate[];
  reasonCodes: DoorAdjacencyReasonCode[];
};

const TOUCH_TOLERANCE_FEET = 0.5;

export function detectDoorAdjacency(input: {
  layout: EditableLayoutGeometryContract;
  door: EditableDoorGeometry;
}): DoorAdjacencyResult {
  if (input.door.ownerKind !== "room") {
    return noCandidates(input.door, null, ["owner_not_room"]);
  }
  const ownerRoom = input.layout.rooms.find((room) => room.id === input.door.ownerId) ?? null;
  if (ownerRoom == null) {
    return noCandidates(input.door, null, ["owner_not_found"]);
  }
  if (!isDoorEligibleRoomType(ownerRoom.roomType)) {
    return noCandidates(input.door, ownerRoom.id, ["owner_room_door_ineligible"]);
  }

  const directCandidates = input.layout.rooms
    .filter((room) => room.id !== ownerRoom.id && isDoorEligibleRoomType(room.roomType))
    .map((room) => candidateForRoom(ownerRoom, room, input.door))
    .filter((candidate): candidate is DoorAdjacencyCandidate => candidate != null);

  const directCandidateIds = new Set(directCandidates.map((candidate) => candidate.roomId));
  const hallwayCandidates = input.layout.hallways
    .filter((hallway) => rectTouchesWall(ownerRoom, hallway, input.door.wall))
    .flatMap((hallway) =>
      input.layout.rooms
        .filter((room) => room.id !== ownerRoom.id && !directCandidateIds.has(room.id) && isDoorEligibleRoomType(room.roomType))
        .map((room) => hallwayCandidateForRoom(ownerRoom, room, hallway, input.door))
        .filter((candidate): candidate is DoorAdjacencyCandidate => candidate != null)
    );

  const candidates = sortCandidates([...directCandidates, ...hallwayCandidates]);
  const reasonCodes = uniqueReasonCodes([
    ...candidates.map((candidate) => candidate.reasonCode),
    ...(candidates.length === 0 && input.layout.hallways.some((hallway) => rectTouchesWall(ownerRoom, hallway, input.door.wall))
      ? ["owner_wall_has_hallway_only" as const]
      : []),
    ...(candidates.length === 0 ? ["no_geometric_candidate" as const] : [])
  ]);

  return {
    status: candidates.length === 0 ? "no_candidates" : "candidates_found",
    doorId: input.door.id,
    ownerRoomId: ownerRoom.id,
    ownerWall: input.door.wall,
    candidates,
    reasonCodes
  };
}

function candidateForRoom(
  ownerRoom: EditableRoomGeometry,
  room: EditableRoomGeometry,
  door: EditableDoorGeometry
): DoorAdjacencyCandidate | null {
  const ownerSegment = getWallSegment(ownerRoom, door.wall);
  const targetWall = oppositeWall(door.wall);
  const targetSegment = getWallSegment(room, targetWall);
  const overlapFeet = overlapLengthFeet(ownerSegment, targetSegment);
  if (ownerSegment.orientation !== targetSegment.orientation || overlapFeet <= 0) {
    return null;
  }
  const gap = axisGapFeet(ownerSegment.fixedAxisFeet, targetSegment.fixedAxisFeet);
  if (gap > TOUCH_TOLERANCE_FEET) {
    return null;
  }
  const relationshipType: DoorAdjacencyRelationshipType = gap === 0 ? "shared_wall" : "near_touching";
  return {
    roomId: room.id,
    roomLabel: room.label,
    wall: targetWall,
    relationshipType,
    sharedOverlapFeet: overlapFeet,
    previewOffsetFeet: preserveDoorOffsetForCandidate({ fromRoom: ownerRoom, toRoom: room, door, wall: targetWall }),
    hallwayId: null,
    reasonCode: relationshipType === "shared_wall" ? "candidate_shared_wall" : "candidate_near_touching"
  };
}

function hallwayCandidateForRoom(
  ownerRoom: EditableRoomGeometry,
  room: EditableRoomGeometry,
  hallway: EditableHallwayGeometry,
  door: EditableDoorGeometry
): DoorAdjacencyCandidate | null {
  if (!rectTouchesWall(ownerRoom, hallway, door.wall)) {
    return null;
  }
  const walls: EditableDoorWall[] = ["north", "south", "east", "west"];
  const targetWall = walls.find((wall) => rectTouchesWall(room, hallway, wall)) ?? null;
  if (targetWall == null) {
    return null;
  }
  const ownerSegment = getWallSegment(ownerRoom, door.wall);
  const targetSegment = getWallSegment(room, targetWall);
  if (ownerSegment.orientation !== targetSegment.orientation) {
    return null;
  }
  const overlapFeet = overlapLengthFeet(ownerSegment, targetSegment);
  if (overlapFeet <= 0) {
    return null;
  }
  return {
    roomId: room.id,
    roomLabel: room.label,
    wall: targetWall,
    relationshipType: "hallway_adjacent",
    sharedOverlapFeet: overlapFeet,
    previewOffsetFeet: preserveDoorOffsetForCandidate({ fromRoom: ownerRoom, toRoom: room, door, wall: targetWall }),
    hallwayId: hallway.id,
    reasonCode: "candidate_hallway_adjacent"
  };
}

function rectTouchesWall(
  rect: EditableRectFeet,
  other: EditableRectFeet,
  wall: EditableDoorWall
): boolean {
  const wallSegment = getWallSegment(rect, wall);
  const otherSegments = [getWallSegment(other, "north"), getWallSegment(other, "south"), getWallSegment(other, "east"), getWallSegment(other, "west")];
  return otherSegments.some(
    (segment) =>
      segment.orientation === wallSegment.orientation &&
      axisGapFeet(segment.fixedAxisFeet, wallSegment.fixedAxisFeet) <= TOUCH_TOLERANCE_FEET &&
      overlapLengthFeet(segment, wallSegment) > 0
  );
}

function preserveDoorOffsetForCandidate(input: {
  fromRoom: EditableRoomGeometry;
  toRoom: EditableRoomGeometry;
  door: EditableDoorGeometry;
  wall: EditableDoorWall;
}): number {
  const fromLength = wallLengthFeet(input.fromRoom, input.door.wall);
  const toLength = wallLengthFeet(input.toRoom, input.wall);
  const ratio = fromLength <= 0 ? 0 : input.door.offsetFeet / fromLength;
  return Math.min(Math.max(0, ratio * toLength), Math.max(0, toLength - input.door.widthFeet));
}

function sortCandidates(candidates: DoorAdjacencyCandidate[]): DoorAdjacencyCandidate[] {
  const rank: Record<DoorAdjacencyRelationshipType, number> = {
    shared_wall: 0,
    near_touching: 1,
    hallway_adjacent: 2
  };
  return candidates.sort(
    (left, right) =>
      rank[left.relationshipType] - rank[right.relationshipType] ||
      right.sharedOverlapFeet - left.sharedOverlapFeet ||
      left.roomLabel.localeCompare(right.roomLabel) ||
      left.roomId.localeCompare(right.roomId)
  );
}

function uniqueReasonCodes(reasonCodes: DoorAdjacencyReasonCode[]): DoorAdjacencyReasonCode[] {
  return [...new Set(reasonCodes)];
}

function noCandidates(
  door: EditableDoorGeometry,
  ownerRoomId: string | null,
  reasonCodes: DoorAdjacencyReasonCode[]
): DoorAdjacencyResult {
  return {
    status: "no_candidates",
    doorId: door.id,
    ownerRoomId,
    ownerWall: door.wall,
    candidates: [],
    reasonCodes
  };
}
