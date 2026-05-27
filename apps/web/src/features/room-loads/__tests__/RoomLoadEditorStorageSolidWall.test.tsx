import { createRoomLoadEditorViewModel, getRoomLoadDisabledReason } from "../roomLoadEditorViewModel";

const baseLoad = {
  roomId: "room-101",
  occupied: true,
  acuity: 3,
  traumaActive: false,
  isolationActive: false,
  behavioralRisk: false,
  fallRisk: false,
  sitterRequired: false,
  medicationFrequency: "medium",
  monitoringFrequency: "medium",
  procedureBurden: "low",
  expectedTurnover: "low",
  syntheticDataOnly: true
} as const;

const cards = createRoomLoadEditorViewModel(
  [
    { roomId: "room-101", label: "Patient Care Room", roomType: "standard" },
    { roomId: "room-storage", label: "Storage Room", roomType: "storage" },
    { roomId: "room-wall", label: "Solid Wall", roomType: "solid_wall" }
  ],
  [
    baseLoad,
    { ...baseLoad, roomId: "room-storage" },
    { ...baseLoad, roomId: "room-wall" }
  ]
);

const patientCare = cards.find((card) => card.roomId === "room-101");
const storage = cards.find((card) => card.roomId === "room-storage");
const solidWall = cards.find((card) => card.roomId === "room-wall");

if (patientCare?.controlsDisabled !== false || patientCare.roomLoad == null) {
  throw new Error("patient-care room-load controls must remain enabled");
}

if (storage?.controlsDisabled !== true || storage.roomLoad !== null) {
  throw new Error("storage room-load controls must be disabled and detached from load input");
}

if (storage.disabledReason !== "Storage is excluded from room-load inputs.") {
  throw new Error("storage room-load disabled reason must be user-facing and specific");
}

if (solidWall?.controlsDisabled !== true || solidWall.roomLoad !== null) {
  throw new Error("solid-wall room-load controls must be disabled and detached from load input");
}

if (solidWall.disabledReason !== "Solid wall / blocked area is excluded from room-load inputs.") {
  throw new Error("solid-wall room-load disabled reason must be user-facing and specific");
}

if (getRoomLoadDisabledReason("standard") !== null) {
  throw new Error("standard rooms must remain room-load eligible");
}
