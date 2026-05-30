import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { isPatientCareRoomType } from "./roomTypeRules.js";

export type EditableLayoutCapacityCounts = {
  physicalBayCount: number;
  patientCarePositionCount: number;
  splitRoomPhysicalBayCount: number;
  splitRoomPatientCarePositionCount: number;
};

export function countEditableLayoutCapacity(
  layoutValue: EditableLayoutGeometryContract
): EditableLayoutCapacityCounts {
  const layout = validateEditableLayoutGeometryContract(layoutValue);
  const splitRoomChildIds = new Set((layout.splitBays ?? []).flatMap((splitBay) => [...splitBay.bedPositionRoomIds]));
  const standalonePatientRooms = layout.rooms.filter(
    (room) => !splitRoomChildIds.has(room.id) && isPatientCareRoomType(room.roomType)
  );
  const splitRoomPatientCarePositionCount = (layout.splitBays ?? []).reduce(
    (sum, splitBay) =>
      sum + splitBay.bedPositionRoomIds.filter((roomId) => {
        const room = layout.rooms.find((candidate) => candidate.id === roomId);
        return room != null && isPatientCareRoomType(room.roomType);
      }).length,
    0
  );
  return {
    physicalBayCount: standalonePatientRooms.length + (layout.splitBays?.length ?? 0),
    patientCarePositionCount: standalonePatientRooms.length + splitRoomPatientCarePositionCount,
    splitRoomPhysicalBayCount: layout.splitBays?.length ?? 0,
    splitRoomPatientCarePositionCount
  };
}
