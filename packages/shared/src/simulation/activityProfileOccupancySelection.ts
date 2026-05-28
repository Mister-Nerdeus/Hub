import type { ActivityProfileContract } from "../scenarios/activityProfileContract.js";
import { validateRoomLoadStarterContract } from "../scenarios/roomLoadEligibility.js";
import type { RoomLoadStarterContract, RoomLoadStarterEntry } from "../scenarios/roomLoadStarterContract.js";
import type { ScenarioCapacityIntegration } from "../scenarios/scenarioCapacityIntegration.js";
import { createDeterministicWorkloadSequence, stableDryRunHash } from "./deterministicSequence.js";
import type { NeutralWorkloadSeedContract } from "./deterministicSeedContract.js";

export const ACTIVITY_PROFILE_OCCUPANCY_SELECTION_SCHEMA_VERSION = "1.0.0" as const;

export type ActivityProfileOccupancySelection = {
  schemaVersion: typeof ACTIVITY_PROFILE_OCCUPANCY_SELECTION_SCHEMA_VERSION;
  selectionId: "activity-profile-occupancy-selection-canonical-plan-1";
  canonicalScenarioSeedId: ScenarioCapacityIntegration["canonicalScenarioSeedId"];
  canonicalFloorplanId: ScenarioCapacityIntegration["canonicalFloorplanId"];
  activityProfileId: ActivityProfileContract["profileId"];
  occupancyPercent: number;
  eligibleBedPositionCount: number;
  occupancyTargetCount: number;
  selectedOccupiedBedPositionIds: readonly string[];
  unoccupiedEligibleBedPositionIds: readonly string[];
  deterministicSelectionProof: string;
  usesSelectorEligibleBedPositions: true;
  usesNeutralWorkloadSeed: true;
  usesStorageOrSupportForTasks: false;
  usesRawRoomCounts: false;
  syntheticDataOnly: true;
  optimizerStatus: "not_started";
};

export function selectOccupiedBedPositionsForActivityProfile(input: {
  capacity: ScenarioCapacityIntegration;
  activityProfile: ActivityProfileContract;
  neutralWorkloadSeed: NeutralWorkloadSeedContract;
}): ActivityProfileOccupancySelection {
  const eligibleBedPositionIds = input.capacity.assignmentEligibleBedPositionIds.filter(
    (id) => !input.capacity.excludedObjectIds.includes(id)
  );
  const occupancyTargetCount = Math.min(
    eligibleBedPositionIds.length,
    Math.ceil((eligibleBedPositionIds.length * input.activityProfile.occupancyPercent) / 100)
  );
  const sequence = createDeterministicWorkloadSequence(
    input.neutralWorkloadSeed,
    `occupancy-selection:${input.activityProfile.profileId}`,
    eligibleBedPositionIds.length
  );
  const ranked = eligibleBedPositionIds
    .map((id, index) => ({ id, orderValue: sequence[index] ?? 0 }))
    .sort((left, right) => left.orderValue - right.orderValue || left.id.localeCompare(right.id));
  const selected = ranked.slice(0, occupancyTargetCount).map((entry) => entry.id);
  const selectedSet = new Set(selected);
  const unoccupied = eligibleBedPositionIds.filter((id) => !selectedSet.has(id));
  const deterministicSelectionProof = stableDryRunHash(
    [
      input.neutralWorkloadSeed.seedId,
      input.neutralWorkloadSeed.seedValue,
      input.activityProfile.profileId,
      selected.join(",")
    ].join("|")
  ).toString(16);

  return {
    schemaVersion: ACTIVITY_PROFILE_OCCUPANCY_SELECTION_SCHEMA_VERSION,
    selectionId: "activity-profile-occupancy-selection-canonical-plan-1",
    canonicalScenarioSeedId: input.capacity.canonicalScenarioSeedId,
    canonicalFloorplanId: input.capacity.canonicalFloorplanId,
    activityProfileId: input.activityProfile.profileId,
    occupancyPercent: input.activityProfile.occupancyPercent,
    eligibleBedPositionCount: eligibleBedPositionIds.length,
    occupancyTargetCount,
    selectedOccupiedBedPositionIds: selected,
    unoccupiedEligibleBedPositionIds: unoccupied,
    deterministicSelectionProof,
    usesSelectorEligibleBedPositions: true,
    usesNeutralWorkloadSeed: true,
    usesStorageOrSupportForTasks: false,
    usesRawRoomCounts: false,
    syntheticDataOnly: true,
    optimizerStatus: "not_started"
  };
}

export function buildRoomLoadStarterContractFromOccupancySelection(
  capacity: ScenarioCapacityIntegration,
  selection: ActivityProfileOccupancySelection
): RoomLoadStarterContract {
  assertOccupancySelectionUsesEligibleBeds(capacity, selection);
  const occupied = new Set(selection.selectedOccupiedBedPositionIds);
  const entries = capacity.assignmentEligibleBedPositionIds.map((loadableBedPositionId) => ({
    loadableBedPositionId,
    occupancyState: occupied.has(loadableBedPositionId) ? "occupied" : "unoccupied",
    acuityBandPlaceholder: "placeholder_medium",
    complexityBandPlaceholder: "placeholder_medium",
    supportNeedPlaceholder: "placeholder_low",
    source: "synthetic planning input",
    fullShiftSimulationStatus: "not_started",
    syntheticDataOnly: true
  })) satisfies RoomLoadStarterEntry[];

  return validateRoomLoadStarterContract(
    {
      schemaVersion: "1.0.0",
      contractId: "room-load-starter-canonical-plan-1",
      canonicalScenarioSeedId: capacity.canonicalScenarioSeedId,
      entries,
      source: "synthetic planning input",
      fullShiftSimulationStatus: "not_started",
      patientOutcomeStatus: "not_started",
      clinicalSafetyScoringStatus: "not_started",
      syntheticDataOnly: true
    },
    capacity
  );
}

function assertOccupancySelectionUsesEligibleBeds(
  capacity: ScenarioCapacityIntegration,
  selection: ActivityProfileOccupancySelection
): void {
  if (selection.usesStorageOrSupportForTasks !== false || selection.usesRawRoomCounts !== false) {
    throw new Error("occupancy selection must exclude storage/support spaces and raw room counts");
  }
  const eligible = new Set(capacity.assignmentEligibleBedPositionIds);
  const excluded = new Set(capacity.excludedObjectIds);
  for (const id of selection.selectedOccupiedBedPositionIds) {
    if (!eligible.has(id) || excluded.has(id)) {
      throw new Error("room-load starter occupancy selection must use selector-eligible bed positions only");
    }
  }
}

export function validateActivityProfileOccupancySelection(
  selection: ActivityProfileOccupancySelection,
  context: { capacity: ScenarioCapacityIntegration; activityProfile: ActivityProfileContract }
): ActivityProfileOccupancySelection {
  if (selection.schemaVersion !== ACTIVITY_PROFILE_OCCUPANCY_SELECTION_SCHEMA_VERSION) {
    throw new Error("activity profile occupancy selection schema version is unsupported");
  }
  if (selection.activityProfileId !== context.activityProfile.profileId) {
    throw new Error("occupancy selection must match the activity profile");
  }
  if (selection.usesStorageOrSupportForTasks !== false || selection.usesRawRoomCounts !== false) {
    throw new Error("occupancy selection must exclude storage/support spaces and raw room counts");
  }
  const eligible = new Set(context.capacity.assignmentEligibleBedPositionIds);
  const excluded = new Set(context.capacity.excludedObjectIds);
  for (const id of selection.selectedOccupiedBedPositionIds) {
    if (!eligible.has(id) || excluded.has(id)) {
      throw new Error("occupied selection must use selector-eligible bed positions only");
    }
  }
  if (new Set(selection.selectedOccupiedBedPositionIds).size !== selection.selectedOccupiedBedPositionIds.length) {
    throw new Error("occupied selection ids must be unique");
  }
  return selection;
}
