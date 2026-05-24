import type { EditableRoomGeometry } from "@nerdeus/shared";

import { resizeRoomByHandleDeltaFeet } from "./roomResizeGeometry";
import { ROOM_RESIZE_HANDLE_ORDER } from "./roomResizeHandlesViewModel";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  }
};

const baseRoom: EditableRoomGeometry = {
  objectType: "room",
  id: "room-14",
  label: "Room 14",
  roomNumber: "14",
  roomType: "standard",
  capacityType: "single",
  isHallBed: false,
  isTraumaAdjacent: false,
  xFeet: 10,
  yFeet: 8,
  widthFeet: 12,
  heightFeet: 10
};

assert.deepEqual([...ROOM_RESIZE_HANDLE_ORDER], [
  "north",
  "south",
  "east",
  "west",
  "northeast",
  "northwest",
  "southeast",
  "southwest"
]);

const expectations = [
  ["north", { xFeet: 10, yFeet: 6, widthFeet: 12, heightFeet: 12 }],
  ["south", { xFeet: 10, yFeet: 8, widthFeet: 12, heightFeet: 8 }],
  ["east", { xFeet: 10, yFeet: 8, widthFeet: 14, heightFeet: 10 }],
  ["west", { xFeet: 12, yFeet: 8, widthFeet: 10, heightFeet: 10 }],
  ["northeast", { xFeet: 10, yFeet: 6, widthFeet: 14, heightFeet: 12 }],
  ["northwest", { xFeet: 12, yFeet: 6, widthFeet: 10, heightFeet: 12 }],
  ["southeast", { xFeet: 10, yFeet: 8, widthFeet: 14, heightFeet: 8 }],
  ["southwest", { xFeet: 12, yFeet: 8, widthFeet: 10, heightFeet: 8 }]
] as const;

for (const [handle, expectedGeometry] of expectations) {
  const resizedRoom = resizeRoomByHandleDeltaFeet({
    room: baseRoom,
    handle,
    deltaFeet: { deltaXFeet: 1.75, deltaYFeet: -2.25 },
    snapMode: "default"
  });
  assert.deepEqual(
    {
      xFeet: resizedRoom.xFeet,
      yFeet: resizedRoom.yFeet,
      widthFeet: resizedRoom.widthFeet,
      heightFeet: resizedRoom.heightFeet
    },
    expectedGeometry
  );
  assert.equal(resizedRoom.label, baseRoom.label);
  assert.equal(resizedRoom.roomType, baseRoom.roomType);
}

const fineSnappedRoom = resizeRoomByHandleDeltaFeet({
  room: baseRoom,
  handle: "east",
  deltaFeet: { deltaXFeet: 0.25, deltaYFeet: 0 },
  snapMode: "fine"
});
assert.equal(fineSnappedRoom.widthFeet, 12.5);

const clampedWestRoom = resizeRoomByHandleDeltaFeet({
  room: baseRoom,
  handle: "west",
  deltaFeet: { deltaXFeet: 20, deltaYFeet: 0 },
  snapMode: "default",
  minimumSizeFeet: 4
});
assert.deepEqual(
  {
    xFeet: clampedWestRoom.xFeet,
    widthFeet: clampedWestRoom.widthFeet
  },
  {
    xFeet: 18,
    widthFeet: 4
  }
);

const clampedNorthRoom = resizeRoomByHandleDeltaFeet({
  room: baseRoom,
  handle: "north",
  deltaFeet: { deltaXFeet: 0, deltaYFeet: 20 },
  snapMode: "default",
  minimumSizeFeet: 4
});
assert.deepEqual(
  {
    yFeet: clampedNorthRoom.yFeet,
    heightFeet: clampedNorthRoom.heightFeet
  },
  {
    yFeet: 14,
    heightFeet: 4
  }
);

assert.equal(JSON.stringify(baseRoom).includes("12.5"), false);
assert.deepEqual(baseRoom, {
  objectType: "room",
  id: "room-14",
  label: "Room 14",
  roomNumber: "14",
  roomType: "standard",
  capacityType: "single",
  isHallBed: false,
  isTraumaAdjacent: false,
  xFeet: 10,
  yFeet: 8,
  widthFeet: 12,
  heightFeet: 10
});
