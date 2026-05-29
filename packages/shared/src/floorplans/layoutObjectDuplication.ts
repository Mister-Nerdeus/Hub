import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry,
  type EditableStationGeometry,
  type EditableZoneGeometry
} from "../layout-editor/editableLayoutGeometryContract.js";

export type DuplicableLayoutObjectType = "room" | "station" | "zone";

export type DuplicateLayoutObjectInput = {
  layout: EditableLayoutGeometryContract;
  readOnly: boolean;
  objectType: DuplicableLayoutObjectType;
  objectId: string;
  offsetFeet?: {
    xFeet: number;
    yFeet: number;
  };
};

export type DuplicateLayoutObjectResult = {
  layout: EditableLayoutGeometryContract;
  objectType: DuplicableLayoutObjectType;
  duplicatedObjectId: string;
};

const DEFAULT_DUPLICATE_OFFSET_FEET = { xFeet: 2, yFeet: 2 };

export function duplicateLayoutObject(input: DuplicateLayoutObjectInput): DuplicateLayoutObjectResult {
  if (input.readOnly) {
    throw new Error("duplicateLayoutObject is blocked for read-only layouts");
  }
  const layout = validateEditableLayoutGeometryContract(input.layout);
  const offset = normalizeOffset(input.offsetFeet ?? DEFAULT_DUPLICATE_OFFSET_FEET);
  const allIds = collectLayoutObjectIds(layout);

  if (input.objectType === "room") {
    const source = layout.rooms.find((room) => room.id === input.objectId);
    if (source == null) throw new Error(`unknown room: ${input.objectId}`);
    const duplicatedObjectId = nextDuplicateId(source.id, allIds);
    const duplicateLabel = normalizeDuplicateLabel({
      originalLabel: source.label,
      existingLabels: layout.rooms.map((room) => room.label)
    });
    const duplicate: EditableRoomGeometry = {
      ...source,
      id: duplicatedObjectId,
      label: duplicateLabel,
      roomNumber: "Review",
      xFeet: source.xFeet + offset.xFeet,
      yFeet: source.yFeet + offset.yFeet
    };
    return {
      objectType: "room",
      duplicatedObjectId,
      layout: validateEditableLayoutGeometryContract({
        ...layout,
        rooms: [...layout.rooms, duplicate]
      })
    };
  }

  if (input.objectType === "station") {
    const source = layout.stations.find((station) => station.id === input.objectId);
    if (source == null) throw new Error(`unknown station: ${input.objectId}`);
    const duplicatedObjectId = nextDuplicateId(source.id, allIds);
    const duplicateLabel = normalizeDuplicateLabel({
      originalLabel: source.label,
      existingLabels: layout.stations.map((station) => station.label)
    });
    const duplicate: EditableStationGeometry = {
      ...source,
      id: duplicatedObjectId,
      label: duplicateLabel,
      xFeet: source.xFeet + offset.xFeet,
      yFeet: source.yFeet + offset.yFeet
    };
    return {
      objectType: "station",
      duplicatedObjectId,
      layout: validateEditableLayoutGeometryContract({
        ...layout,
        stations: [...layout.stations, duplicate]
      })
    };
  }

  const source = layout.zones.find((zone) => zone.id === input.objectId);
  if (source == null) throw new Error(`unknown zone: ${input.objectId}`);
  const duplicatedObjectId = nextDuplicateId(source.id, allIds);
  const duplicateLabel = normalizeDuplicateLabel({
    originalLabel: source.label,
    existingLabels: layout.zones.map((zone) => zone.label)
  });
  const duplicate: EditableZoneGeometry = {
    ...source,
    id: duplicatedObjectId,
    label: duplicateLabel,
    xFeet: source.xFeet + offset.xFeet,
    yFeet: source.yFeet + offset.yFeet
  };
  return {
    objectType: "zone",
    duplicatedObjectId,
    layout: validateEditableLayoutGeometryContract({
      ...layout,
      zones: [...layout.zones, duplicate]
    })
  };
}

export function normalizeDuplicateLabel(input: {
  originalLabel: string;
  existingLabels: readonly string[];
}): string {
  const baseLabel = input.originalLabel
    .trim()
    .replace(/(?:\s+Copy(?:\s+\d+)?)+$/u, "")
    .trim() || "Copy";
  const existing = new Set(input.existingLabels.map((label) => label.trim()));
  const firstCandidate = `${baseLabel} Copy`;
  if (!existing.has(firstCandidate)) {
    return firstCandidate;
  }
  let index = 2;
  let candidate = `${firstCandidate} ${index}`;
  while (existing.has(candidate)) {
    index += 1;
    candidate = `${firstCandidate} ${index}`;
  }
  return candidate;
}

function collectLayoutObjectIds(layout: EditableLayoutGeometryContract): Set<string> {
  return new Set([
    ...layout.rooms.map((room) => room.id),
    ...layout.doors.map((door) => door.id),
    ...layout.stations.map((station) => station.id),
    ...layout.hallways.map((hallway) => hallway.id),
    ...layout.zones.map((zone) => zone.id)
  ]);
}

function nextDuplicateId(sourceId: string, allIds: Set<string>): string {
  let index = 1;
  let candidate = `${sourceId}-copy`;
  while (allIds.has(candidate)) {
    index += 1;
    candidate = `${sourceId}-copy-${index}`;
  }
  return candidate;
}

function normalizeOffset(offset: { xFeet: number; yFeet: number }) {
  if (!Number.isFinite(offset.xFeet) || !Number.isFinite(offset.yFeet)) {
    throw new Error("duplicate offset must be finite");
  }
  return offset;
}
