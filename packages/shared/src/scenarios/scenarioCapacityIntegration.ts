import {
  buildCanonicalCapacityCountReport,
  type CanonicalCapacityCountReport
} from "../floorplans/canonicalCapacityCountReport.js";
import {
  CANONICAL_ROOM_BED_BAY_ENTRIES,
  type LayoutOccupancyType
} from "../floorplans/roomBedBayTypes.js";
import { getSplitBayFixtureOccupancyBridge } from "../floorplans/splitBayFixtureBridge.js";
import { CANONICAL_SCENARIO_FLOORPLAN_ID, CANONICAL_SCENARIO_SEED_ID } from "./canonicalScenarioSeedContract.js";

export type ScenarioCapacityIntegration = {
  schemaVersion: "1.0.0";
  canonicalScenarioSeedId: typeof CANONICAL_SCENARIO_SEED_ID;
  canonicalFloorplanId: typeof CANONICAL_SCENARIO_FLOORPLAN_ID;
  source: CanonicalCapacityCountReport["source"];
  physicalRoomCount: number;
  bedPositionCount: number;
  splitBayCount: number;
  assignmentEligibleCount: number;
  ratioEligibleCount: number;
  excludedCount: number;
  excludedByType: CanonicalCapacityCountReport["excludedByType"];
  assignmentEligibleBedPositionIds: readonly string[];
  ratioEligibleBedPositionIds: readonly string[];
  excludedObjectIds: readonly string[];
  rawFixtureRoomIterationUsed: false;
  usesCanonicalCapacityReport: true;
  usesSplitBayFixtureBridge: true;
};

export function buildScenarioCapacityIntegration(
  capacityReport: CanonicalCapacityCountReport = buildCanonicalCapacityCountReport()
): ScenarioCapacityIntegration {
  if (capacityReport.canonicalFloorplanId !== CANONICAL_SCENARIO_FLOORPLAN_ID) {
    throw new Error("scenario capacity integration requires canonical Plan 1 capacity report");
  }
  if (capacityReport.source !== "semantic_selectors") {
    throw new Error("scenario capacity integration requires selector-driven counts");
  }
  const assignmentEligibleBedPositionIds: string[] = [];
  const ratioEligibleBedPositionIds: string[] = [];
  const excludedObjectIds: string[] = [];

  for (const entry of CANONICAL_ROOM_BED_BAY_ENTRIES) {
    const bridge = getSplitBayFixtureOccupancyBridge(entry.objectId);
    if (bridge.assignmentEligible) assignmentEligibleBedPositionIds.push(entry.objectId);
    if (bridge.ratioEligible) ratioEligibleBedPositionIds.push(entry.objectId);
    if (!isPatientCareOccupancy(entry.occupancyType)) excludedObjectIds.push(entry.objectId);
  }

  return {
    schemaVersion: "1.0.0",
    canonicalScenarioSeedId: CANONICAL_SCENARIO_SEED_ID,
    canonicalFloorplanId: CANONICAL_SCENARIO_FLOORPLAN_ID,
    source: capacityReport.source,
    physicalRoomCount: capacityReport.physicalRoomCount,
    bedPositionCount: capacityReport.bedPositionCount,
    splitBayCount: capacityReport.splitBayCount,
    assignmentEligibleCount: capacityReport.assignmentEligibleCount,
    ratioEligibleCount: capacityReport.ratioEligibleCount,
    excludedCount: capacityReport.excludedCount,
    excludedByType: capacityReport.excludedByType,
    assignmentEligibleBedPositionIds,
    ratioEligibleBedPositionIds,
    excludedObjectIds,
    rawFixtureRoomIterationUsed: false,
    usesCanonicalCapacityReport: true,
    usesSplitBayFixtureBridge: true
  };
}

export function assertScenarioCapacityIntegration(value: ScenarioCapacityIntegration): ScenarioCapacityIntegration {
  if (value.rawFixtureRoomIterationUsed !== false) {
    throw new Error("scenario capacity integration must not use raw room iteration");
  }
  if (value.source !== "semantic_selectors" || !value.usesCanonicalCapacityReport || !value.usesSplitBayFixtureBridge) {
    throw new Error("scenario capacity integration must use selector-driven canonical capacity dependencies");
  }
  if (
    value.assignmentEligibleCount !== value.assignmentEligibleBedPositionIds.length ||
    value.ratioEligibleCount !== value.ratioEligibleBedPositionIds.length
  ) {
    throw new Error("scenario capacity integration eligible counts must match selector outputs");
  }
  return value;
}

export function isPatientCareOccupancy(occupancyType: LayoutOccupancyType): boolean {
  return occupancyType === "room" || occupancyType === "bed_position";
}

