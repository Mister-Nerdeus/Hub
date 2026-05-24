import type {
  EditableDoorGeometry,
  EditableHallwayGeometry,
  EditableLayoutGeometryContract,
  EditableRoomGeometry,
  EditableStationGeometry,
  EditableZoneGeometry
} from "@nerdeus/shared";

export const LAYOUT_SELECTION_OBJECT_TYPES = [
  "room",
  "door",
  "station",
  "hallway",
  "zone"
] as const;

export type LayoutSelectionObjectType = (typeof LAYOUT_SELECTION_OBJECT_TYPES)[number];

export type LayoutSelection = {
  objectType: LayoutSelectionObjectType;
  objectId: string;
};

export type LayoutSelectableObject =
  | EditableRoomGeometry
  | EditableDoorGeometry
  | EditableStationGeometry
  | EditableHallwayGeometry
  | EditableZoneGeometry;

export function isLayoutSelectionObjectType(value: unknown): value is LayoutSelectionObjectType {
  return (
    typeof value === "string" &&
    LAYOUT_SELECTION_OBJECT_TYPES.includes(value as LayoutSelectionObjectType)
  );
}

export function selectEditableLayoutObject(
  layout: EditableLayoutGeometryContract,
  objectType: LayoutSelectionObjectType,
  objectId: string
): LayoutSelection | null {
  requireSelectionObjectType(objectType);
  requireSelectionObjectId(objectId);
  if (!findEditableLayoutObject(layout, objectType, objectId)) {
    return null;
  }
  return { objectType, objectId };
}

export function clearLayoutSelection(): null {
  return null;
}

export function findEditableLayoutObject(
  layout: EditableLayoutGeometryContract,
  objectType: LayoutSelectionObjectType,
  objectId: string
): LayoutSelectableObject | null {
  requireSelectionObjectType(objectType);
  requireSelectionObjectId(objectId);
  return getEditableLayoutObjects(layout, objectType).find((object) => object.id === objectId) ?? null;
}

export function hasEditableLayoutObject(
  layout: EditableLayoutGeometryContract,
  objectType: LayoutSelectionObjectType,
  objectId: string
): boolean {
  return findEditableLayoutObject(layout, objectType, objectId) != null;
}

function getEditableLayoutObjects(
  layout: EditableLayoutGeometryContract,
  objectType: LayoutSelectionObjectType
): LayoutSelectableObject[] {
  switch (objectType) {
    case "room":
      return layout.rooms;
    case "door":
      return layout.doors;
    case "station":
      return layout.stations;
    case "hallway":
      return layout.hallways;
    case "zone":
      return layout.zones;
  }
}

function requireSelectionObjectType(objectType: LayoutSelectionObjectType): void {
  if (!isLayoutSelectionObjectType(objectType)) {
    throw new Error("objectType must be room, door, station, hallway, or zone");
  }
}

function requireSelectionObjectId(objectId: string): void {
  if (typeof objectId !== "string" || objectId.length === 0) {
    throw new Error("objectId must be a non-empty string");
  }
}
