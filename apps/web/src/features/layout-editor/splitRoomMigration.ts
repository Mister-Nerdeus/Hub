import {
  migrateLegacySplitBayToParentBed,
  type EditableLayoutGeometryContract
} from "@nerdeus/shared";

export function migrateEditableLayoutLegacySplitRooms(
  layout: EditableLayoutGeometryContract
) {
  const splitRoomMigrations = (layout.splitBays ?? []).map((splitBay) =>
    migrateLegacySplitBayToParentBed({
      splitBay,
      rooms: layout.rooms
    })
  );

  return {
    layout,
    migratedParentRooms: splitRoomMigrations.flatMap((migration) =>
      migration.status === "migrated" ? [migration.parentRoom] : []
    ),
    splitRoomMigrations
  };
}
