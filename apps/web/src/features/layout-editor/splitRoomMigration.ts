import {
  migrateLegacySplitBayToParentBed,
  type EditableLayoutGeometryContract
} from "@nerdeus/shared";

export function migrateEditableLayoutLegacySplitRooms(
  layout: EditableLayoutGeometryContract
) {
  return {
    layout,
    splitRoomMigrations: (layout.splitBays ?? []).map((splitBay) =>
      migrateLegacySplitBayToParentBed({
        splitBay,
        rooms: layout.rooms
      })
    )
  };
}
