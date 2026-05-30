import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { isNurseAssignableRoomType } from "./roomTypeRules.js";
import type { SplitRoomAssignmentSemantics } from "./splitRoomContracts.js";

export function buildSplitRoomAssignmentSemantics(input: {
  layout: EditableLayoutGeometryContract;
  splitBayId: string;
}): SplitRoomAssignmentSemantics {
  const layout = validateEditableLayoutGeometryContract(input.layout);
  const splitBay = (layout.splitBays ?? []).find((candidate) => candidate.splitBayId === input.splitBayId);
  if (splitBay == null) {
    throw new Error(`unknown split room: ${input.splitBayId}`);
  }
  const roomById = new Map(layout.rooms.map((room) => [room.id, room]));
  const assignableRoomIds = splitBay.bedPositionRoomIds.filter((roomId) => {
    const room = roomById.get(roomId);
    return room != null && isNurseAssignableRoomType(room.roomType);
  });
  return {
    parentSplitBayId: splitBay.splitBayId,
    assignableRoomIds,
    physicalBayCount: 1,
    patientCarePositionCount: assignableRoomIds.length,
    parentAssignable: false
  };
}

export function parentSplitBayIsAssignable(): false {
  return false;
}

export function listSplitRoomParentIds(layoutValue: EditableLayoutGeometryContract): string[] {
  const layout = validateEditableLayoutGeometryContract(layoutValue);
  return (layout.splitBays ?? []).map((splitBay) => splitBay.splitBayId).sort();
}

export function listSplitRoomChildRoomIds(layoutValue: EditableLayoutGeometryContract): string[] {
  const layout = validateEditableLayoutGeometryContract(layoutValue);
  return [
    ...new Set((layout.splitBays ?? []).flatMap((splitBay) => [...splitBay.bedPositionRoomIds]))
  ].sort();
}
