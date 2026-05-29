import {
  validateDoorPlacement,
  type EditableDoorGeometry,
  type EditableHallwayGeometry,
  type EditableRoomGeometry,
  normalizeDoorForOwnerWall
} from "@nerdeus/shared";

export type DoorPlacementValidityViewModel = {
  status: "missing" | "valid" | "invalid";
  label: string;
  warnings: readonly string[];
  reasonCodes: readonly string[];
};

export function buildDoorPlacementValidityViewModel(input: {
  door: EditableDoorGeometry | null;
  rooms: readonly EditableRoomGeometry[];
  hallways?: readonly EditableHallwayGeometry[];
}): DoorPlacementValidityViewModel {
  if (input.door == null) {
    return { status: "missing", label: "No door selected", warnings: [], reasonCodes: [] };
  }
  const ownerRoom = input.rooms.find((room) => room.id === input.door?.ownerId) ?? null;
  const normalized = ownerRoom == null
    ? null
    : normalizeDoorForOwnerWall({
        door: input.door,
        ownerRect: ownerRoom,
        minimumDoorWidthFeet: 2
      });
  const result = validateDoorPlacement({
      layout: {
        schemaVersion: "1.0.0",
        layoutId: "door-placement-validity-preview",
        units: "feet",
        rooms: [...input.rooms],
        doors: [input.door],
        stations: [],
        hallways: [...(input.hallways ?? [])],
        zones: [],
        limitations: ["Editor advisory preview; export validation may remain stricter."]
      },
      door: input.door
    });
  const warnings = [...result.warnings, ...(normalized?.warnings ?? [])];
  const status = result.status === "valid" && normalized?.status !== "invalid" && normalized?.status !== "clamped"
    ? "valid"
    : "invalid";
  return {
    status,
    label: status === "valid" ? "Placement valid" : "Placement needs repair",
    warnings,
    reasonCodes: result.reasonCodes
  };
}
