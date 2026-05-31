import type {
  EditableDoorGeometry,
  EditableHallwayGeometry,
  EditableLayoutGeometryContract,
  EditableRoomGeometry,
  EditableSplitBayGeometry,
  EditableStationGeometry,
  EditableSupportAccessPointGeometry,
  EditableZoneGeometry,
  BedPositionContract,
  SplitRoomContract
} from "@nerdeus/shared";

export const LAYOUT_SELECTION_OBJECT_TYPES = [
  "room",
  "door",
  "support_access",
  "station",
  "hallway",
  "zone",
  "split_room_parent",
  "bed_position",
  "outer_wall",
  "split_bay"
] as const;

export type LayoutSelectionObjectType = (typeof LAYOUT_SELECTION_OBJECT_TYPES)[number];

export type LayoutSelection = {
  objectType: LayoutSelectionObjectType;
  objectId: string;
};

export type LayoutSelectableObject =
  | EditableRoomGeometry
  | EditableDoorGeometry
  | EditableSupportAccessPointGeometry
  | EditableStationGeometry
  | EditableHallwayGeometry
  | EditableZoneGeometry
  | (SplitRoomContract & { objectType: "split_room_parent"; id: string; label: string })
  | (BedPositionContract & { objectType: "bed_position"; id: string; label: string })
  | { objectType: "outer_wall"; id: string; label: string }
  | EditableSplitBayGeometry;

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
    case "support_access":
      return layout.supportAccessPoints ?? [];
    case "station":
      return layout.stations;
    case "hallway":
      return layout.hallways;
    case "zone":
      return layout.zones;
    case "split_room_parent":
      return (layout.splitRooms ?? []).map((splitRoom) => ({
        ...splitRoom,
        objectType: "split_room_parent" as const,
        id: splitRoom.splitRoomId,
        label: splitRoomLabel(layout, splitRoom)
      }));
    case "bed_position":
      return (layout.splitRooms ?? []).flatMap((splitRoom) =>
        splitRoom.bedPositions.map((bedPosition) => ({
          ...bedPosition,
          objectType: "bed_position" as const,
          id: bedPosition.bedPositionId,
          label: bedPosition.label
        }))
      );
    case "outer_wall":
      return [{ objectType: "outer_wall", id: "workspace-outer-boundary", label: "Outer wall boundary" }];
    case "split_bay":
      return layout.splitBays ?? [];
  }
}

function requireSelectionObjectType(objectType: LayoutSelectionObjectType): void {
  if (!isLayoutSelectionObjectType(objectType)) {
    throw new Error("objectType must be room, door, support_access, station, hallway, zone, split_room_parent, bed_position, outer_wall, or split_bay");
  }
}

function splitRoomLabel(layout: EditableLayoutGeometryContract, splitRoom: SplitRoomContract): string {
  const parentRoom = layout.rooms.find((room) => room.id === splitRoom.parentRoomId);
  return parentRoom == null ? splitRoom.splitRoomId : `Split Room ${parentRoom.roomNumber}`;
}

function requireSelectionObjectId(objectId: string): void {
  if (typeof objectId !== "string" || objectId.length === 0) {
    throw new Error("objectId must be a non-empty string");
  }
}
