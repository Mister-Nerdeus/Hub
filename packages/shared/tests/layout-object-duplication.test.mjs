import { duplicateLayoutObject } from "../dist/index.js";
import { testEditableLayout, throws } from "./authoring-test-helpers.mjs";

const layoutWithZone = {
  ...testEditableLayout,
  zones: [
    {
      objectType: "zone",
      id: "zone-provider",
      label: "Provider Zone",
      zoneType: "provider_pharmacy",
      xFeet: 52,
      yFeet: 10,
      widthFeet: 10,
      heightFeet: 8
    }
  ]
};

const duplicateRoom = duplicateLayoutObject({
  layout: layoutWithZone,
  readOnly: false,
  objectType: "room",
  objectId: "room-01"
});
if (duplicateRoom.duplicatedObjectId !== "room-01-copy") {
  throw new Error("room duplicate should receive a stable unique ID");
}
const roomCopy = duplicateRoom.layout.rooms.find((room) => room.id === "room-01-copy");
if (roomCopy == null || roomCopy.xFeet !== 12 || roomCopy.yFeet !== 12) {
  throw new Error("room duplicate should be offset from the source room");
}
if (duplicateRoom.layout.doors.some((door) => door.ownerId === "room-01-copy")) {
  throw new Error("room duplication must not silently clone doors or claim adjacency repair");
}

const duplicateStation = duplicateLayoutObject({
  layout: layoutWithZone,
  readOnly: false,
  objectType: "station",
  objectId: "station-01"
});
if (!duplicateStation.layout.stations.some((station) => station.id === "station-01-copy")) {
  throw new Error("station duplicate should be added with a unique ID");
}

const duplicateZone = duplicateLayoutObject({
  layout: layoutWithZone,
  readOnly: false,
  objectType: "zone",
  objectId: "zone-provider"
});
if (!duplicateZone.layout.zones.some((zone) => zone.id === "zone-provider-copy")) {
  throw new Error("zone duplicate should be added with a unique ID");
}

const duplicateAgain = duplicateLayoutObject({
  layout: duplicateRoom.layout,
  readOnly: false,
  objectType: "room",
  objectId: "room-01"
});
if (duplicateAgain.duplicatedObjectId !== "room-01-copy-2") {
  throw new Error("duplicate IDs must stay unique when a copy already exists");
}

throws(
  () =>
    duplicateLayoutObject({
      layout: layoutWithZone,
      readOnly: true,
      objectType: "room",
      objectId: "room-01"
    }),
  /read-only/
);
throws(
  () =>
    duplicateLayoutObject({
      layout: layoutWithZone,
      readOnly: false,
      objectType: "room",
      objectId: "missing"
    }),
  /unknown room/
);
