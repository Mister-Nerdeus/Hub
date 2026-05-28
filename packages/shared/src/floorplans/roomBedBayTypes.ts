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
  { objectId: "room-10", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the right pod." },
  { objectId: "room-11", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the far-right vertical bank." },
  { objectId: "room-12", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the far-right vertical bank." },
  { objectId: "room-13", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room above the right pod." },
  { objectId: "room-14", occupancyType: "storage", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient storage behind the trauma pod." },
  { objectId: "room-15", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the left-side bank." },
  { objectId: "room-16", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the left-side bank." },
  { objectId: "room-17", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room near the lower right pod." },
  { objectId: "room-19", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the bottom bank." },
  { objectId: "room-20", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the bottom bank." },
  { objectId: "room-21", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the bottom bank." },
  { objectId: "room-22", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the bottom bank." },
  { objectId: "room-23", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the bottom bank." },
  { objectId: "room-24", occupancyType: "room", physicalBayId: null, bedPositionCount: 1, roomCountEligible: true, notes: "Single operational room in the bottom bank." },
  { objectId: "station-left", occupancyType: "support_area", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient nurse station support object." },
  { objectId: "station-right", occupancyType: "support_area", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient nurse station support object." },
  { objectId: "zone-provider-pharmacy", occupancyType: "support_area", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient provider/pharmacy support area." },
  { objectId: "hallway-main", occupancyType: "hallway", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient circulation space." },
  { objectId: "hallway-ems-entry", occupancyType: "hallway", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient EMS entry circulation space." },
  { objectId: "hallway-top-horizontal", occupancyType: "hallway", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient top corridor." },
  { objectId: "hallway-left-vertical", occupancyType: "hallway", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient left corridor." },
  { objectId: "hallway-bottom-horizontal", occupancyType: "hallway", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient bottom corridor." },
  { objectId: "hallway-right-vertical", occupancyType: "hallway", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient right corridor." },
  { objectId: "hallway-right-upper", occupancyType: "hallway", physicalBayId: null, bedPositionCount: 0, roomCountEligible: false, notes: "Non-patient upper-right corridor." }
];

export function canonicalRoomBedBayEntry(objectId: string): CanonicalRoomBedBayEntry | null {
  return CANONICAL_ROOM_BED_BAY_ENTRIES.find((entry) => entry.objectId === objectId) ?? null;
}
