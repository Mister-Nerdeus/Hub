export const CANONICAL_ROOM_BANK_IDS = [
  "left-trauma-pod",
  "right-pod",
  "far-right-vertical-bank",
  "left-side-vertical-bank",
  "bottom-bank",
  "provider-pharmacy-support-band"
] as const;

export type CanonicalRoomBankId = (typeof CANONICAL_ROOM_BANK_IDS)[number];

export type CanonicalRoomBank = {
  bankId: CanonicalRoomBankId;
  label: string;
  patientCareRoomIds: readonly string[];
  supportObjectIds: readonly string[];
};

export const CANONICAL_ROOM_BANKS: readonly CanonicalRoomBank[] = [
  {
    bankId: "left-trauma-pod",
    label: "Left trauma pod",
    patientCareRoomIds: ["room-level-1-trauma", "room-02", "room-03", "room-04", "room-05"],
    supportObjectIds: ["room-14", "station-left"]
  },
  {
    bankId: "right-pod",
    label: "Right pod",
    patientCareRoomIds: ["room-06", "room-07", "room-08", "room-09", "room-10", "room-13"],
    supportObjectIds: ["station-right"]
  },
  {
    bankId: "far-right-vertical-bank",
    label: "Far-right vertical bank",
    patientCareRoomIds: ["room-11", "room-12"],
    supportObjectIds: []
  },
  {
    bankId: "left-side-vertical-bank",
    label: "Left-side vertical bank",
    patientCareRoomIds: ["room-15", "room-16", "room-17"],
    supportObjectIds: []
  },
  {
    bankId: "bottom-bank",
    label: "Bottom bank",
    patientCareRoomIds: ["room-19", "room-20", "room-21", "room-22", "room-23", "room-24"],
    supportObjectIds: []
  },
  {
    bankId: "provider-pharmacy-support-band",
    label: "Provider/pharmacy support band",
    patientCareRoomIds: [],
    supportObjectIds: ["zone-provider-pharmacy"]
  }
];

export function roomBankForPatientCareRoom(roomId: string): CanonicalRoomBank | null {
  return CANONICAL_ROOM_BANKS.find((bank) => bank.patientCareRoomIds.includes(roomId)) ?? null;
}
