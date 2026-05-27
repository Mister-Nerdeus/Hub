import type { EditableRoomGeometry } from "../layout-editor/editableLayoutGeometryContract.js";
import { isPathNodeEligibleRoomType } from "./roomTypeRules.js";

export function canCreateRoomDoorPathNode(room: Pick<EditableRoomGeometry, "roomType">): boolean {
  return isPathNodeEligibleRoomType(room.roomType);
}

