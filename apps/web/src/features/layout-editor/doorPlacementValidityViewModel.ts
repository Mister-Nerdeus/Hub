import {
  validateDoorPlacement,
  type EditableDoorGeometry,
  type EditableHallwayGeometry,
  type EditableRoomGeometry
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
  return {
    status: result.status,
    label: result.status === "valid" ? "Placement valid" : "Placement needs repair",
    warnings: result.warnings,
    reasonCodes: result.reasonCodes
  };
}
