import { buildRoomPresentationClass } from "../layoutRoomPresentationViewModel";

const className = buildRoomPresentationClass({
  objectType: "room",
  objectId: "room-01",
  ariaLabel: "Room",
  hitTargetKey: "room:1",
  label: "Level 1 Trauma",
  visibleLabel: "Level 1 Trauma",
  roomNumber: "01",
  roomType: "trauma",
  xPixels: 0,
  yPixels: 0,
  widthPixels: 10,
  heightPixels: 10,
  labelX: 5,
  labelY: 5,
  assignmentColor: "#2563eb",
  assignmentLabel: "Nurse Blue",
  burdenLevel: "high",
  warningState: "warning",
  unassignedOccupied: false,
  presentationActive: true
});

for (const token of ["assigned", "warning", "special"]) {
  if (!className.includes(token)) throw new Error(`presentation class missing ${token}`);
}
