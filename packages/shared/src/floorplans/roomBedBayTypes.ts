export const LAYOUT_OCCUPANCY_TYPES = [
  "room",
  "bed_position",
  "split_bay",
  "storage",
  "support_area",
  "hallway",
  "solid_wall"
] as const;

export type LayoutOccupancyType = (typeof LAYOUT_OCCUPANCY_TYPES)[number];

export type CanonicalRoomBedBayEntry = {
  objectId: string;
  occupancyType: LayoutOccupancyType;
  physicalBayId: string | null;
  bedPositionCount: number;
  roomCountEligible: boolean;
  notes: string;
};

export const CANONICAL_ROOM_BED_BAY_ENTRIES: readonly CanonicalRoomBedBayEntry[] = [
  { objectId: "room-level-1-trauma", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Trauma exception room." },
  { objectId: "room-02", occupancyType: "bed_position", physicalBayId: "split-bay-02-03", bedPositionCount: 1, roomCountEligible: false, notes: "Candidate split-bay bed position." },
  { objectId: "room-03", occupancyType: "bed_position", physicalBayId: "split-bay-02-03", bedPositionCount: 1, roomCountEligible: false, notes: "Candidate split-bay bed position." },
  { objectId: "room-04", occupancyType: "bed_position", physicalBayId: "split-bay-04-05", bedPositionCount: 1, roomCountEligible: false, notes: "Candidate split-bay bed position." },
  { objectId: "room-05", occupancyType: "bed_position", physicalBayId: "split-bay-04-05", bedPositionCount: 1, roomCountEligible: false, notes: "Candidate split-bay bed position." },
  { objectId: "room-06", occupancyType: "bed_position", physicalBayId: "split-bay-06-07", bedPositionCount: 1, roomCountEligible: false, notes: "Candidate split-bay bed position." },
  { objectId: "room-07", occupancyType: "bed_position", physicalBayId: "split-bay-06-07", bedPositionCount: 1, roomCountEligible: false, notes: "Candidate split-bay bed position." },
  { objectId: "room-08", occupancyType: "bed_position", physicalBayId: "split-bay-08-09", bedPositionCount: 1, roomCountEligible: false, notes: "Candidate split-bay bed position." },
  { objectId: "room-09", occupancyType: "bed_position", physicalBayId: "split-bay-08-09", bedPositionCount: 1, roomCountEligible: false, notes: "Candidate split-bay bed position." },
  { objectId: "room-14", occupancyType: "storage", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient storage behind the trauma pod." }
];

export function canonicalRoomBedBayEntry(objectId: string): CanonicalRoomBedBayEntry | null {
  return CANONICAL_ROOM_BED_BAY_ENTRIES.find((entry) => entry.objectId === objectId) ?? null;
}
