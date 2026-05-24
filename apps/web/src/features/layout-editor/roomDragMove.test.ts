import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { moveRoomByDeltaFeet, snapSizeForRoomMove } from "./roomDragMove";

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
  },
  throws(fn: () => void, pattern: RegExp): void {
    try {
      fn();
    } catch (error) {
      if (error instanceof Error && pattern.test(error.message)) {
        return;
      }
      throw error;
    }
    throw new Error(`Expected function to throw ${pattern}`);
  }
};

const originalLayout = layoutEditorProofFixture;
const originalSnapshot = JSON.stringify(originalLayout);
const originalRoom = originalLayout.rooms.find((room) => room.id === "room-01");
if (originalRoom == null) {
  throw new Error("proof fixture must include room-01");
}

assert.equal(snapSizeForRoomMove("default"), 1);
assert.equal(snapSizeForRoomMove("fine"), 0.5);

const movedDefault = moveRoomByDeltaFeet({
  layout: originalLayout,
  roomId: "room-01",
  delta: { deltaXFeet: 1.2, deltaYFeet: -0.4 },
  snapMode: "default"
});
const defaultRoom = movedDefault.rooms.find((room) => room.id === "room-01");
if (defaultRoom == null) {
  throw new Error("moved layout must keep room-01");
}
assert.equal(defaultRoom.xFeet, originalRoom.xFeet + 1);
assert.equal(defaultRoom.yFeet, originalRoom.yFeet);
assert.equal(defaultRoom.widthFeet, originalRoom.widthFeet);
assert.equal(defaultRoom.heightFeet, originalRoom.heightFeet);
assert.equal(defaultRoom.roomNumber, originalRoom.roomNumber);
assert.equal(defaultRoom.roomType, originalRoom.roomType);
assert.equal(defaultRoom.capacityType, originalRoom.capacityType);
assert.equal(defaultRoom.isHallBed, originalRoom.isHallBed);
assert.equal(defaultRoom.isTraumaAdjacent, originalRoom.isTraumaAdjacent);

const movedFine = moveRoomByDeltaFeet({
  layout: originalLayout,
  roomId: "room-01",
  delta: { deltaXFeet: 1.24, deltaYFeet: -1.25 },
  snapMode: "fine"
});
const fineRoom = movedFine.rooms.find((room) => room.id === "room-01");
if (fineRoom == null) {
  throw new Error("fine moved layout must keep room-01");
}
assert.equal(fineRoom.xFeet, originalRoom.xFeet + 1);
assert.equal(fineRoom.yFeet, originalRoom.yFeet - 1.5);

const unchangedLayoutParts = {
  schemaVersion: movedFine.schemaVersion,
  layoutId: movedFine.layoutId,
  units: movedFine.units,
  doors: movedFine.doors,
  stations: movedFine.stations,
  hallways: movedFine.hallways,
  zones: movedFine.zones,
  limitations: movedFine.limitations
};
assert.deepEqual(unchangedLayoutParts, {
  schemaVersion: originalLayout.schemaVersion,
  layoutId: originalLayout.layoutId,
  units: originalLayout.units,
  doors: originalLayout.doors,
  stations: originalLayout.stations,
  hallways: originalLayout.hallways,
  zones: originalLayout.zones,
  limitations: originalLayout.limitations
});
assert.equal(JSON.stringify(originalLayout), originalSnapshot);

assert.throws(
  () =>
    moveRoomByDeltaFeet({
      layout: originalLayout,
      roomId: "station-primary",
      delta: { deltaXFeet: 1, deltaYFeet: 1 }
    }),
  /unknown room/
);
