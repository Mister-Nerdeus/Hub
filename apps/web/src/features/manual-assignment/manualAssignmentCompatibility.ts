import type { ActiveFloorplanContract } from "@nerdeus/shared";
import type { ManualAssignmentMap } from "./ManualAssignmentWorkspace";

export type ManualAssignmentCompatibilitySummary = {
  status: "compatible" | "incompatible" | "empty";
  missingRoomIds: string[];
};

export function summarizeManualAssignmentCompatibility(
  activeFloorplan: ActiveFloorplanContract,
  assignmentsByRoomId: Readonly<ManualAssignmentMap>
): ManualAssignmentCompatibilitySummary {
  const assignedRoomIds = Object.keys(assignmentsByRoomId);
  if (assignedRoomIds.length === 0) {
    return { status: "empty", missingRoomIds: [] };
  }
  const activeRoomIds = new Set(activeFloorplan.editableLayout.rooms.map((room) => room.id));
  const missingRoomIds = assignedRoomIds.filter((roomId) => !activeRoomIds.has(roomId));
  return {
    status: missingRoomIds.length === 0 ? "compatible" : "incompatible",
    missingRoomIds
  };
}
