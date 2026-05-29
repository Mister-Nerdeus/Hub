import type { EditableLayoutGeometryContract, EditableRoomGeometry } from "@nerdeus/shared";

import { buildLayoutObjectRenderPipeline } from "../layoutObjectRenderPipeline";
import { resizeRoomByHandleDeltaFeet } from "../roomResizeGeometry";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
  },
  ok(value: unknown, message: string): void {
    if (!value) throw new Error(message);
  }
};

const baseRoom: EditableRoomGeometry = {
  objectType: "room",
  id: "room-narrow",
  label: "Room Narrow",
  roomNumber: "N1",
  roomType: "standard",
  capacityType: "single",
  isHallBed: false,
  isTraumaAdjacent: false,
  xFeet: 8,
  yFeet: 8,
  widthFeet: 12,
  heightFeet: 12
};

const viewport = {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
};

for (const [target, field, handle, delta] of [
  [5, "widthFeet", "east", { deltaXFeet: -7, deltaYFeet: 0 }],
  [4, "widthFeet", "east", { deltaXFeet: -8, deltaYFeet: 0 }],
  [5, "heightFeet", "south", { deltaXFeet: 0, deltaYFeet: -7 }],
  [4, "heightFeet", "south", { deltaXFeet: 0, deltaYFeet: -8 }]
] as const) {
  const room = resizeRoomByHandleDeltaFeet({
    room: baseRoom,
    handle,
    deltaFeet: delta,
    snapMode: "fine"
  });
  assert.equal(room[field], target);
  const layout = layoutWithRoomAndDoor(room, "north");
  const renderItems = buildLayoutObjectRenderPipeline({ layout, viewport });
  assert.ok(renderItems.some((item) => item.objectType === "room" && item.objectId === room.id), `${target} ft ${field} room renders`);
  assert.ok(renderItems.some((item) => item.objectType === "door"), `${target} ft ${field} room door renders`);
}

for (const wall of ["north", "south", "east", "west"] as const) {
  for (const room of [
    { ...baseRoom, widthFeet: 5, heightFeet: 5 },
    { ...baseRoom, widthFeet: 4, heightFeet: 4 }
  ]) {
    const renderItems = buildLayoutObjectRenderPipeline({
      layout: layoutWithRoomAndDoor(room, wall),
      viewport
    });
    const doorItem = renderItems.find((item) => item.objectType === "door");
    assert.ok(doorItem, `${room.widthFeet} ft room with ${wall} door renders`);
    assert.ok(Number.isFinite(doorItem?.displayRectPixels.widthPixels), "door width pixels remain finite");
    assert.ok(Number.isFinite(doorItem?.displayRectPixels.heightPixels), "door height pixels remain finite");
  }
}

function layoutWithRoomAndDoor(
  room: EditableRoomGeometry,
  wall: "north" | "south" | "east" | "west"
): EditableLayoutGeometryContract {
  return {
    schemaVersion: "1.0.0",
    layoutId: "narrow-room-render-test",
    units: "feet",
    rooms: [room],
    doors: [
      {
        objectType: "door",
        id: `door-${wall}`,
        label: `Door ${wall}`,
        ownerKind: "room",
        ownerId: room.id,
        wall,
        offsetFeet: 1,
        widthFeet: 4
      }
    ],
    stations: [],
    hallways: [],
    zones: [],
    limitations: ["Synthetic narrow-room render test fixture."]
  };
}
