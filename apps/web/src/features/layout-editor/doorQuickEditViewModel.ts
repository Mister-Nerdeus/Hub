import {
  detectDoorAdjacency,
  evaluateDoorCandidateEligibility,
  type EditableDoorGeometry,
  type EditableDoorWall,
  type EditableHallwayGeometry,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry
} from "@nerdeus/shared";
import type { AdjacentDoorCandidateItem } from "./adjacentDoorCandidateViewModel";
import {
  buildDoorOwnerViewModel,
  doorOwnerDisplayLabel,
  doorOwnerKindLabel,
  doorOwnerWarning,
  type DoorOwnerViewModel
} from "./doorOwnerViewModel";

export type DoorQuickEditViewModel = {
  status: "missing" | "ready";
  doorId: string | null;
  label: string;
  ownerLabel: string | null;
  ownerKindLabel: string | null;
  ownerStatus: DoorOwnerViewModel["status"] | null;
  ownerWarning: string | null;
  wall: EditableDoorWall | null;
  offsetFeet: number | null;
  readOnly: boolean;
  adjacentCandidateCount: number;
  canUseAdjacent: boolean;
  adjacentCandidates: readonly AdjacentDoorCandidateItem[];
  noCandidateReason: string | null;
  deleteDisabled: boolean;
};

export function buildDoorQuickEdit({
  door,
  rooms,
  hallways = [],
  readOnly
}: {
  door: EditableDoorGeometry | null;
  rooms: readonly EditableRoomGeometry[];
  hallways?: readonly EditableHallwayGeometry[];
  readOnly: boolean;
}): DoorQuickEditViewModel {
  if (door == null) {
    return {
      status: "missing",
      doorId: null,
      label: "No door selected",
      ownerLabel: null,
      ownerKindLabel: null,
      ownerStatus: null,
      ownerWarning: null,
      wall: null,
      offsetFeet: null,
      readOnly: true,
      adjacentCandidateCount: 0,
      canUseAdjacent: false,
      adjacentCandidates: [],
      noCandidateReason: "No door selected.",
      deleteDisabled: true
    };
  }
  const owner = buildDoorOwnerViewModel({ door, rooms, hallways });
  const ownerDoorEligible = owner?.status === "room" && owner.doorEligible;
  const layout = candidateLayout({ door, rooms, hallways });
  const adjacency = owner?.status === "room"
    ? detectDoorAdjacency({
        layout,
        door
      })
    : { candidates: [], reasonCodes: [] };
  const adjacentCandidates = adjacency.candidates.map((candidate) => ({
    roomId: candidate.roomId,
    roomLabel: candidate.roomLabel,
    wall: candidate.wall,
    relationshipLabel: candidate.relationshipType.replace("_", " "),
    previewOffsetFeet: candidate.previewOffsetFeet,
    ...disabledStateForCandidate(layout, door, candidate)
  }));
  const adjacentCandidateCount = adjacentCandidates.length;
  const enabledCandidateCount = adjacentCandidates.filter((candidate) => !candidate.disabled).length;
  const ownerWarning = doorOwnerWarning(owner);
  const toolsReadOnly = readOnly || !ownerDoorEligible;
  return {
    status: "ready",
    doorId: door.id,
    label: door.label,
    ownerLabel: doorOwnerDisplayLabel(owner),
    ownerKindLabel: doorOwnerKindLabel(owner),
    ownerStatus: owner?.status ?? null,
    ownerWarning,
    wall: door.wall,
    offsetFeet: door.offsetFeet,
    readOnly: toolsReadOnly,
    adjacentCandidateCount,
    canUseAdjacent: enabledCandidateCount > 0,
    adjacentCandidates,
    noCandidateReason:
      ownerWarning ??
      (!ownerDoorEligible
        ? owner?.status === "hallway"
          ? "Hallway openings do not use patient-room adjacent assignment."
          : "Selected owner cannot use patient-room door controls."
        : adjacentCandidateCount === 0
          ? adjacency.reasonCodes.join(", ")
          : enabledCandidateCount === 0
            ? uniqueDisabledReasons(adjacentCandidates).join("; ")
            : null),
    deleteDisabled: readOnly
  };
}

function candidateLayout(input: {
  door: EditableDoorGeometry;
  rooms: readonly EditableRoomGeometry[];
  hallways: readonly EditableHallwayGeometry[];
}): EditableLayoutGeometryContract {
  return {
    schemaVersion: "1.0.0",
    layoutId: "door-quick-edit-adjacent-candidates",
    units: "feet",
    rooms: [...input.rooms],
    doors: [input.door],
    supportAccessPoints: [],
    stations: [],
    hallways: [...input.hallways],
    zones: [],
    splitBays: [],
    limitations: ["Editor-only adjacent candidate view model."]
  };
}

function disabledStateForCandidate(
  layout: EditableLayoutGeometryContract,
  door: EditableDoorGeometry,
  candidate: {
    roomId: string;
    wall: EditableDoorWall;
    previewOffsetFeet: number;
  }
): { disabled: boolean; disabledReason?: string } {
  const eligibility = evaluateDoorCandidateEligibility({ layout, door, candidate });
  if (eligibility.status === "eligible") {
    return { disabled: false };
  }
  return { disabled: true, disabledReason: eligibility.reason };
}

function uniqueDisabledReasons(candidates: readonly AdjacentDoorCandidateItem[]): string[] {
  return [...new Set(candidates.flatMap((candidate) => candidate.disabledReason ?? []))];
}
