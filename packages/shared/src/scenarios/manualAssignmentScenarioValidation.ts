import {
  MANUAL_ASSIGNMENT_SCENARIO_BRIDGE_SCHEMA_VERSION,
  type ManualAssignmentScenarioBridgeInput,
  type ManualAssignmentScenarioBridgeSummary
} from "./manualAssignmentScenarioBridge.js";
import { CANONICAL_SCENARIO_SEED_ID } from "./canonicalScenarioSeedContract.js";

export function bridgeManualAssignmentsToScenarioInput(
  input: ManualAssignmentScenarioBridgeInput
): ManualAssignmentScenarioBridgeSummary {
  if (input.schemaVersion !== MANUAL_ASSIGNMENT_SCENARIO_BRIDGE_SCHEMA_VERSION) {
    throw new Error("manual assignment scenario bridge schema version is unsupported");
  }
  if (
    input.recommendationStatus !== "not_started" ||
    input.optimizerStatus !== "not_started" ||
    input.fullShiftSimulationStatus !== "not_started"
  ) {
    throw new Error("manual assignment bridge must not recommend, optimize, or execute simulation");
  }
  if (
    input.ratioPreset.canonicalScenarioSeedId !== CANONICAL_SCENARIO_SEED_ID ||
    input.ratioPreset.usesRatioEligibleBedPositions !== true ||
    input.ratioPreset.usesRawRoomCount !== false
  ) {
    throw new Error("manual assignment bridge must use canonical selector-driven ratio assumptions");
  }

  const eligible = new Set(input.capacity.assignmentEligibleBedPositionIds);
  const excluded = new Set(input.capacity.excludedObjectIds);
  const covered = new Set<string>();
  const ignoredExcluded = new Set<string>();

  for (const group of input.assignmentGroups) {
    if (!group.syntheticDataOnly) {
      throw new Error("manual assignment bridge groups must be synthetic");
    }
    if (!group.syntheticNurseLabel.startsWith("Synthetic Nurse ")) {
      throw new Error("manual assignment bridge must use synthetic nurse labels only");
    }
    for (const id of group.assignedBedPositionIds) {
      if (excluded.has(id)) {
        ignoredExcluded.add(id);
      } else if (eligible.has(id)) {
        covered.add(id);
      } else {
        throw new Error("manual assignment bridge references an unsupported bed position");
      }
    }
  }

  const coveredEligibleBedPositionIds = [...covered].sort();
  const uncoveredEligibleBedPositionIds = input.capacity.assignmentEligibleBedPositionIds
    .filter((id) => !covered.has(id))
    .sort();
  const capacityForAssignedGroups = input.assignmentGroups.length * input.ratioPreset.patientsPerNurse;

  return {
    bridgeId: input.bridgeId,
    coveredEligibleBedPositionIds,
    uncoveredEligibleBedPositionIds,
    ignoredExcludedObjectIds: [...ignoredExcluded].sort(),
    ratioReadiness: {
      ratioPresetId: input.ratioPreset.presetId,
      patientsPerNurse: input.ratioPreset.patientsPerNurse,
      groupCount: input.assignmentGroups.length,
      capacityForAssignedGroups,
      assignedEligibleCount: coveredEligibleBedPositionIds.length,
      overCapacityPlaceholder: coveredEligibleBedPositionIds.length > capacityForAssignedGroups
    },
    recommendationStatus: "not_started",
    optimizerStatus: "not_started",
    fullShiftSimulationStatus: "not_started",
    syntheticDataOnly: true
  };
}
