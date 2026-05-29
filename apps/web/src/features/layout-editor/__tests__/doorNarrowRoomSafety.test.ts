import { validateEditableLayoutGeometryContract, validateDoorPlacement } from "@nerdeus/shared";

import { buildDoorPlacementValidityViewModel } from "../doorPlacementValidityViewModel";
import { buildDoorShapeViewModel } from "../doorShapeViewModel";
import { buildLayoutObjectRenderPipeline } from "../layoutObjectRenderPipeline";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
  },
  ok(value: unknown, message: string): void {
    if (!value) throw new Error(message);
  },
  throws(callback: () => void, pattern: RegExp): void {
    try {
      callback();
    } catch (error) {
      if (pattern.test(error instanceof Error ? error.message : String(error))) return;
      throw error;
    }
    throw new Error("Expected callback to throw");
  }
};

const viewport = { pixelsPerFoot: 12, zoom: 1, panXFeet: 0, panYFeet: 0 };
const room = {
  objectType: "room" as const,
  id: "room-narrow",
  label: "Room Narrow",
  roomNumber: "N1",
  roomType: "standard" as const,
  capacityType: "single" as const,
  isHallBed: false,
  isTraumaAdjacent: false,
  xFeet: 4,
  yFeet: 4,
  widthFeet: 4,
  heightFeet: 4
};
const invalidDoor = {
  objectType: "door" as const,
  id: "door-invalid",
  label: "Invalid Door",
  ownerKind: "room" as const,
  ownerId: room.id,
  wall: "north" as const,
  offsetFeet: 3,
  widthFeet: 6
};
const layout = {
  schemaVersion: "1.0.0" as const,
  layoutId: "door-narrow-room-safety",
  units: "feet" as const,
  rooms: [room],
  doors: [invalidDoor],
  stations: [],
  hallways: [],
  zones: [],
  limitations: ["Synthetic invalid-door render test fixture."]
};

const renderItems = buildLayoutObjectRenderPipeline({ layout, viewport });
const doorItem = renderItems.find((item) => item.objectType === "door");
assert.ok(doorItem, "invalid narrow-room door still renders");
assert.equal(doorItem?.geometryStatus, "clamped");
assert.equal(doorItem?.displayRectFeet.widthFeet, 4);
const doorShape = buildDoorShapeViewModel(doorItem!);
assert.equal(doorShape.invalid, true);

const validity = buildDoorPlacementValidityViewModel({
  door: invalidDoor,
  rooms: [room],
  hallways: []
});
assert.equal(validity.status, "invalid");
assert.ok(validity.warnings.some((warning) => /clamped|offset|width/i.test(warning)), "invalid door warning is visible");

assert.throws(
  () => validateEditableLayoutGeometryContract(layout),
  /remain within the referenced wall length/
);

const solidWallLayout = {
  ...layout,
  rooms: [{ ...room, roomType: "solid_wall" as const }]
};
const solidWallValidity = validateDoorPlacement({
  layout: solidWallLayout,
  door: invalidDoor
});
assert.equal(solidWallValidity.status, "invalid");
assert.ok(solidWallValidity.reasonCodes.includes("owner_room_door_ineligible"), "solid wall remains door-ineligible");
