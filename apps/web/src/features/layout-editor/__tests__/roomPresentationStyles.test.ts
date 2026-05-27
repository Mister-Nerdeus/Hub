import {
  getRoomPresentationStyle,
  roomTypeSuppressesAssignmentOverlay,
  semanticRoomPresentationStyles
} from "../roomPresentationStyles";

const storage = getRoomPresentationStyle("storage");
if (!storage.muted || storage.fill !== semanticRoomPresentationStyles.storage.fill) {
  throw new Error("storage must use the central muted gray presentation style");
}
if (!roomTypeSuppressesAssignmentOverlay("storage")) {
  throw new Error("storage must suppress assignment overlay color");
}

const solidWall = getRoomPresentationStyle("solid_wall");
if (!solidWall.muted || solidWall.fill !== semanticRoomPresentationStyles.solid_wall.fill) {
  throw new Error("solid wall must use the central blocked gray presentation style");
}
if (!roomTypeSuppressesAssignmentOverlay("solid_wall")) {
  throw new Error("solid wall must suppress assignment overlay color");
}

const standard = getRoomPresentationStyle("standard");
if (standard.muted || roomTypeSuppressesAssignmentOverlay("standard")) {
  throw new Error("patient-care room presentation must still allow assignment color");
}
