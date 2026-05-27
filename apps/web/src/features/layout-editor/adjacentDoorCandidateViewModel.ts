import {
  detectDoorAdjacency,
  type DoorAdjacencyCandidate,
  type EditableDoorGeometry,
  type EditableHallwayGeometry,
  type EditableRoomGeometry
} from "@nerdeus/shared";

export type AdjacentDoorCandidateItem = {
  roomId: string;
  roomLabel: string;
  wall: DoorAdjacencyCandidate["wall"];
  relationshipLabel: string;
  previewOffsetFeet: number;
  disabled: false;
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
  const adjacency = detectDoorAdjacency({
    layout: {
      schemaVersion: "1.0.0",
      layoutId: "adjacent-door-candidate-view-model",
      units: "feet",
      rooms: [...input.rooms],
      doors: [input.door],
      stations: [],
      hallways: [...(input.hallways ?? [])],
      zones: [],
      limitations: ["Editor-only candidate calculation; no source fixture mutation."]
    },
    door: input.door
  });
  const candidates = adjacency.candidates.map((candidate) => ({
    roomId: candidate.roomId,
    roomLabel: candidate.roomLabel,
    wall: candidate.wall,
    relationshipLabel: formatRelationship(candidate.relationshipType),
    previewOffsetFeet: candidate.previewOffsetFeet,
    disabled: false as const
  }));
  return {
    status: candidates.length === 0 ? "no-candidates" : "ready",
    candidates,
    disabledReason:
      candidates.length === 0
        ? `No geometry-valid adjacent room candidate (${adjacency.reasonCodes.join(", ")}).`
        : null,
    readOnly: input.readOnly
  };
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
