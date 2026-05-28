import { CANONICAL_ROOM_BED_BAY_ENTRIES } from "./roomBedBayTypes.js";
import { CANONICAL_SPLIT_BAY_CANDIDATES } from "./splitBayContract.js";
import {
  getBedCountContributionForRoomId,
  getPhysicalRoomCountContributionForRoomId,
  getSplitBayFixtureOccupancyBridge
} from "./splitBayFixtureBridge.js";

export type CanonicalCapacityCountReport = {
  schemaVersion: "1.0.0";
  canonicalFloorplanId: "default-er-layout-plan-1";
  source: "semantic_selectors";
  physicalRoomCount: number;
  bedPositionCount: number;
  splitBayCount: number;
  ordinaryPatientRoomCount: number;
  storageCount: number;
  supportAreaCount: number;
  hallwayCorridorCount: number;
  solidWallCount: number;
  ratioEligibleCount: number;
  assignmentEligibleCount: number;
  excludedCount: number;
  excludedByType: {
    storage: number;
    supportArea: number;
    hallway: number;
    solidWall: number;
  };
  selectorNotes: readonly string[];
};

export function buildCanonicalCapacityCountReport(): CanonicalCapacityCountReport {
  const entries = CANONICAL_ROOM_BED_BAY_ENTRIES;
  const patientEntries = entries.filter((entry) => ["room", "bed_position"].includes(entry.occupancyType));
  const ordinaryPatientRoomCount = entries.filter((entry) => entry.occupancyType === "room").length;
  const physicalRoomCount = patientEntries.reduce(
    (sum, entry) => sum + getPhysicalRoomCountContributionForRoomId(entry.objectId),
    0
  );
  const bedPositionCount = patientEntries.reduce(
    (sum, entry) => sum + getBedCountContributionForRoomId(entry.objectId),
    0
  );
  const storageCount = entries.filter((entry) => entry.occupancyType === "storage").length;
  const supportAreaCount = entries.filter((entry) => entry.occupancyType === "support_area").length;
  const hallwayCorridorCount = entries.filter((entry) => entry.occupancyType === "hallway").length;
  const solidWallCount = entries.filter((entry) => entry.occupancyType === "solid_wall").length;
  const ratioEligibleCount = entries.reduce((sum, entry) => {
    const bridge = getSplitBayFixtureOccupancyBridge(entry.objectId);
    return sum + (bridge.ratioEligible ? bridge.bedCountContribution : 0);
  }, 0);
  const assignmentEligibleCount = entries.reduce((sum, entry) => {
    const bridge = getSplitBayFixtureOccupancyBridge(entry.objectId);
    return sum + (bridge.assignmentEligible ? bridge.bedCountContribution : 0);
  }, 0);
  const excludedCount = storageCount + supportAreaCount + hallwayCorridorCount + solidWallCount;

  return {
    schemaVersion: "1.0.0",
    canonicalFloorplanId: "default-er-layout-plan-1",
    source: "semantic_selectors",
    physicalRoomCount,
    bedPositionCount,
    splitBayCount: CANONICAL_SPLIT_BAY_CANDIDATES.length,
    ordinaryPatientRoomCount,
    storageCount,
    supportAreaCount,
    hallwayCorridorCount,
    solidWallCount,
    ratioEligibleCount,
    assignmentEligibleCount,
    excludedCount,
    excludedByType: {
      storage: storageCount,
      supportArea: supportAreaCount,
      hallway: hallwayCorridorCount,
      solidWall: solidWallCount
    },
    selectorNotes: [
      "Counts are derived from occupancy and split-bay selectors, not raw room-like fixture fields.",
      "Storage, support areas, hallways, and solid walls are non-patient and excluded from assignment and ratio counts.",
      "Split bays contribute separate bed positions and paired physical-room count."
    ]
  };
}
