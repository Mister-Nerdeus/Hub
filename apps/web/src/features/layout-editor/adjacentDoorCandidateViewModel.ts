import {
  detectDoorAdjacency,
  evaluateDoorCandidateEligibility,
  type DoorAdjacencyCandidate,
  type EditableDoorGeometry,
  type EditableHallwayGeometry,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry
} from "@nerdeus/shared";

export type AdjacentDoorCandidateItem = {
  roomId: string;
  roomLabel: string;
  wall: DoorAdjacencyCandidate["wall"];
  relationshipLabel: string;
  previewOffsetFeet: number;
  disabled: boolean;
  disabledReason?: string;
};

export type AdjacentDoorCandidateViewModel = {
  status: "ready" | "no-candidates" | "missing";
  candidates: AdjacentDoorCandidateItem[];
  disabledReason: string | null;
  readOnly: boolean;
};

export function buildAdjacentDoorCandidateViewModel(input: {
  door: EditableDoorGeometry | null;
  rooms: readonly EditableRoomGeometry[];
  hallways?: readonly EditableHallwayGeometry[];
  readOnly: boolean;
}): AdjacentDoorCandidateViewModel {
  if (input.door == null) {
    return { status: "missing", candidates: [], disabledReason: "No door selected.", readOnly: true };
  }
  const door = input.door;
  const layout = candidateLayout({ door, rooms: input.rooms, hallways: input.hallways });
  const adjacency = detectDoorAdjacency({
    layout,
    door
  });
  const candidates = adjacency.candidates.map((candidate) => ({
    roomId: candidate.roomId,
    roomLabel: candidate.roomLabel,
    wall: candidate.wall,
    relationshipLabel: formatRelationship(candidate.relationshipType),
    previewOffsetFeet: candidate.previewOffsetFeet,
    ...disabledStateForCandidate(layout, door, candidate)
  }));
  const enabledCandidateCount = candidates.filter((candidate) => !candidate.disabled).length;
  return {
    status: candidates.length === 0 ? "no-candidates" : "ready",
    candidates,
    disabledReason:
      candidates.length === 0
        ? `No geometry-valid adjacent room candidate (${adjacency.reasonCodes.join(", ")}).`
        : enabledCandidateCount === 0
          ? `No selectable adjacent room candidate (${uniqueDisabledReasons(candidates).join("; ")}).`
        : null,
    readOnly: input.readOnly
  };
}

function candidateLayout(input: {
  door: EditableDoorGeometry;
  rooms: readonly EditableRoomGeometry[];
  hallways?: readonly EditableHallwayGeometry[];
}): EditableLayoutGeometryContract {
  return {
    schemaVersion: "1.0.0",
    layoutId: "adjacent-door-candidate-view-model",
    units: "feet",
    rooms: [...input.rooms],
    doors: [input.door],
    supportAccessPoints: [],
    stations: [],
    hallways: [...(input.hallways ?? [])],
    zones: [],
    limitations: ["Editor-only candidate calculation; no source fixture mutation."]
  };
}

function disabledStateForCandidate(
  layout: EditableLayoutGeometryContract,
  door: EditableDoorGeometry,
  candidate: DoorAdjacencyCandidate
): { disabled: boolean; disabledReason?: string } {
  const eligibility = evaluateDoorCandidateEligibility({
    layout,
    door,
    candidate: {
      roomId: candidate.roomId,
      wall: candidate.wall,
      previewOffsetFeet: candidate.previewOffsetFeet
    }
  });
  if (eligibility.status === "eligible") {
    return { disabled: false };
  }
  return { disabled: true, disabledReason: eligibility.reason };
}

function uniqueDisabledReasons(candidates: readonly AdjacentDoorCandidateItem[]): string[] {
  return [...new Set(candidates.flatMap((candidate) => candidate.disabledReason ?? []))];
}

function formatRelationship(value: DoorAdjacencyCandidate["relationshipType"]): string {
  switch (value) {
    case "shared_wall":
      return "Shared wall";
    case "near_touching":
      return "Near-touching wall";
    case "hallway_adjacent":
      return "Hallway-adjacent";
  }
}
