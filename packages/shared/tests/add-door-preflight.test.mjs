import { preflightAddDoor } from "../dist/index.js";

const layout = {
  schemaVersion: "1.0.0",
  layoutId: "add-door-preflight-test",
  units: "feet",
  rooms: [
    room("patient", "Patient", "standard", 12, 10),
    room("storage", "Storage", "storage", 12, 10),
    room("provider", "Provider Pharmacy", "provider_pharmacy", 12, 10),
    room("solid", "Solid", "solid_wall", 12, 10),
    room("narrow", "Narrow", "standard", 1, 10)
  ],
  doors: [],
  supportAccessPoints: [],
  stations: [],
  hallways: [],
  zones: [],
  limitations: ["Synthetic operational fixture for add-door preflight."]
};

const patient = preflightAddDoor({
  layout,
  roomId: "patient",
  wall: "south",
  offsetFeet: 999,
  widthFeet: 20
});
if (patient.status !== "allowed") {
  throw new Error("patient room add-door preflight must allow valid targets");
}
if (patient.widthFeet !== 12 || patient.offsetFeet !== 0) {
  throw new Error("patient room add-door preflight must clamp width and offset to wall");
}

expectBlocked("solid", /solid wall/i);
expectBlocked("storage", /storage\/support-only/i);
expectBlocked("provider", /support access point/i);
expectBlocked("missing", /missing/i);
expectBlocked("narrow", /too short/i);

const missingSelection = preflightAddDoor({ layout, roomId: null });
if (missingSelection.status !== "blocked" || !/select a patient room/i.test(missingSelection.reason)) {
  throw new Error("missing selection must block add-door preflight");
}

const badOffset = preflightAddDoor({
  layout,
  roomId: "patient",
  offsetFeet: Number.NaN
});
if (badOffset.status !== "blocked" || !/offset/i.test(badOffset.reason)) {
  throw new Error("non-finite offsets must block add-door preflight");
}

function expectBlocked(roomId, pattern) {
  const result = preflightAddDoor({ layout, roomId });
  if (result.status !== "blocked" || !pattern.test(result.reason)) {
    throw new Error(`${roomId} should be blocked by add-door preflight`);
  }
}

function room(id, label, roomType, widthFeet, heightFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType,
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet: 0,
    yFeet: 0,
    widthFeet,
    heightFeet
  };
}
