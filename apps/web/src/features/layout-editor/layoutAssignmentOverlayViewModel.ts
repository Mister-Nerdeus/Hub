import { syntheticManualAssignmentFixture, type EditableLayoutGeometryContract } from "@nerdeus/shared";
import type {
  LayoutAssignmentOverlay,
  LayoutAssignmentOverlayRoom
} from "./layoutAssignmentOverlay";
import { roomTypeSuppressesAssignmentOverlay } from "./roomPresentationStyles";

export function createSyntheticLayoutAssignmentOverlay(
  layout: EditableLayoutGeometryContract | null
): LayoutAssignmentOverlay {
  if (layout == null) {
    return { syntheticDataOnly: true, roomsById: {}, legend: [] };
  }

  const fixture = syntheticManualAssignmentFixture;
  const nurses = fixture.nurses;
  const warningsByRoomId = new Set(fixture.warnings.flatMap((warning) => warning.roomIds));
  const roomsById: Record<string, LayoutAssignmentOverlayRoom> = {};

  layout.rooms.forEach((room, index) => {
    if (roomTypeSuppressesAssignmentOverlay(room.roomType)) {
      roomsById[room.id] = {
        roomId: room.id,
        assignmentColor: null,
        assignmentLabel: "Room type excluded",
        burdenLevel: "none",
        warningState: "none",
        unassignedOccupied: false
      };
      return;
    }
    const nurse = nurses[index % Math.max(nurses.length, 1)] ?? null;
    const fixtureRoomLoad = fixture.roomLoads[index % Math.max(fixture.roomLoads.length, 1)] ?? null;
    const syntheticFixtureRoomId = fixtureRoomLoad?.roomId ?? room.id;
    const assigned = index % 3 !== 2 && nurse != null;
    const unassignedOccupied = !assigned && Boolean(fixtureRoomLoad?.occupied ?? true);
    roomsById[room.id] = {
      roomId: room.id,
      assignmentColor: assigned ? nurse.color : null,
      assignmentLabel: assigned ? nurse.displayLabel : "Unassigned occupied",
      burdenLevel: fixtureRoomLoad?.acuity != null && fixtureRoomLoad.acuity >= 4 ? "high" : "medium",
      warningState: warningsByRoomId.has(syntheticFixtureRoomId) || index === 1 ? "warning" : "none",
      unassignedOccupied
    };
  });

  return {
    syntheticDataOnly: true,
    roomsById,
    legend: nurses.map((nurse) => ({
      label: nurse.displayLabel,
      color: nurse.color
    }))
  };
}
