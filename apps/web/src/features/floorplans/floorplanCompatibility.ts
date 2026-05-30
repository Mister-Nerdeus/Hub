import type { ActiveFloorplanContract } from "@nerdeus/shared";
import type { ManualAssignmentMap } from "../manual-assignment/ManualAssignmentWorkspace";

export type FloorplanAssignmentCompatibility = {
  compatible: boolean;
  missingRoomIds: string[];
};

export function checkAssignmentCompatibility(
  activeFloorplan: ActiveFloorplanContract,
  assignmentsByRoomId: Readonly<ManualAssignmentMap>
): FloorplanAssignmentCompatibility {
  const roomIds = new Set(activeFloorplan.editableLayout.rooms.map((room) => room.id));
  const missingRoomIds = Object.keys(assignmentsByRoomId).filter((roomId) => !roomIds.has(roomId));
  return {
    compatible: missingRoomIds.length === 0,
    missingRoomIds
  };
}
