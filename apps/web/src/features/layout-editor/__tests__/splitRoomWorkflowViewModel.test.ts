import { buildRoomQuickEdit } from "../roomQuickEditViewModel";

const layout = {
  schemaVersion: "1.0.0" as const,
  layoutId: "split-room-workflow-test",
  units: "feet" as const,
  rooms: [
    room("room-02", "2", 0, 0),
    room("room-03", "3", 10, 0),
    room("room-04", "4", 0, 10),
    room("room-05", "5", 10, 10),
    room("room-06", "6", 0, 20),
    room("room-07", "7", 10, 20),
    room("room-08", "8", 0, 30),
    room("room-09", "9", 10, 30)
  ],
  doors: [],
  supportAccessPoints: [],
  stations: [],
  hallways: [],
  zones: [],
  splitBays: [],
  limitations: ["Synthetic split-room workflow test layout."]
};

for (const [roomId, label] of [
  ["room-05", "4/5"],
  ["room-04", "4/5"],
  ["room-03", "2/3"],
  ["room-07", "6/7"],
  ["room-09", "8/9"]
] as const) {
  const selectedRoom = layout.rooms.find((candidate) => candidate.id === roomId) ?? null;
  const viewModel = buildRoomQuickEdit({ room: selectedRoom, layout, readOnly: false });
  if (viewModel.splitRoomAction.status !== "ready") {
    throw new Error(`${roomId} should expose split room creation`);
  }
  if (viewModel.splitRoomAction.createActionLabel !== `Create Split Room ${label}`) {
    throw new Error(`${roomId} should expose Create Split Room ${label}`);
  }
}

function room(id: string, number: string, xFeet: number, yFeet: number) {
  return {
    objectType: "room" as const,
    id,
    label: number,
    roomNumber: number,
    roomType: "standard" as const,
    capacityType: "single" as const,
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 10,
    heightFeet: 10
  };
}
