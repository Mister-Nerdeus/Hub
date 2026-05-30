import { evaluateDoorCandidateEligibility } from "../dist/index.js";

const baseDoor = {
  objectType: "door",
  id: "door-01",
  label: "Door 01",
  ownerKind: "room",
  ownerId: "owner",
  wall: "north",
  offsetFeet: 1,
  widthFeet: 3
};

const layout = {
  schemaVersion: "1.0.0",
  layoutId: "door-candidate-eligibility-test",
  units: "feet",
  rooms: [
    room("owner", "Owner", "standard", 0, 10),
    room("target", "Target", "standard", 0, 0),
    room("solid", "Solid", "solid_wall", 14, 0),
    room("storage", "Storage", "storage", 28, 0),
    room("provider", "Provider Pharmacy", "provider_pharmacy", 42, 0)
  ],
  doors: [baseDoor],
  supportAccessPoints: [],
  stations: [],
  hallways: [],
  zones: [],
  limitations: ["Synthetic operational fixture for door candidate eligibility."]
};

expectEligible("target");
expectBlocked("solid", /solid wall/i);
expectBlocked("storage", /storage\/support-only/i);
expectBlocked("provider", /support access/i);

const placeholder = evaluateDoorCandidateEligibility({
  layout,
  door: baseDoor,
  candidate: { roomId: "missing", wall: "north", previewOffsetFeet: 1 }
});
if (placeholder.status !== "blocked") {
  throw new Error("missing adjacent targets must be blocked");
}

const invalidOffset = evaluateDoorCandidateEligibility({
  layout,
  door: baseDoor,
  candidate: { roomId: "target", wall: "north", previewOffsetFeet: Number.NaN }
});
if (invalidOffset.status !== "blocked") {
  throw new Error("non-finite candidate offsets must be blocked");
}

function expectEligible(roomId) {
  const result = evaluateDoorCandidateEligibility({
    layout,
    door: baseDoor,
    candidate: { roomId, wall: "north", previewOffsetFeet: 1 }
  });
  if (result.status !== "eligible") {
    throw new Error(`${roomId} should be eligible`);
  }
}

function expectBlocked(roomId, pattern) {
  const result = evaluateDoorCandidateEligibility({
    layout,
    door: baseDoor,
    candidate: { roomId, wall: "north", previewOffsetFeet: 1 }
  });
  if (result.status !== "blocked" || !pattern.test(result.reason)) {
    throw new Error(`${roomId} should be blocked with expected reason`);
  }
}

function room(id, label, roomType, xFeet, yFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType,
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 12,
    heightFeet: 10
  };
}
