import type { RatioPresetContract } from "./ratioPresetContract.js";
import type { ScenarioCapacityIntegration } from "./scenarioCapacityIntegration.js";

export const MANUAL_ASSIGNMENT_SCENARIO_BRIDGE_SCHEMA_VERSION = "1.0.0" as const;

export type ManualAssignmentScenarioGroup = {
  assignmentGroupId: string;
  syntheticNurseLabel: string;
  assignedBedPositionIds: readonly string[];
  syntheticDataOnly: true;
};

export type ManualAssignmentScenarioBridgeInput = {
  schemaVersion: typeof MANUAL_ASSIGNMENT_SCENARIO_BRIDGE_SCHEMA_VERSION;
  bridgeId: "manual-assignment-scenario-bridge-canonical-plan-1";
  assignmentGroups: readonly ManualAssignmentScenarioGroup[];
  ratioPreset: RatioPresetContract;
  capacity: ScenarioCapacityIntegration;
  recommendationStatus: "not_started";
  optimizerStatus: "not_started";
  fullShiftSimulationStatus: "not_started";
  syntheticDataOnly: true;
};

export type ManualAssignmentScenarioBridgeSummary = {
  bridgeId: ManualAssignmentScenarioBridgeInput["bridgeId"];
  coveredEligibleBedPositionIds: readonly string[];
  uncoveredEligibleBedPositionIds: readonly string[];
  ignoredExcludedObjectIds: readonly string[];
  ratioReadiness: {
    ratioPresetId: RatioPresetContract["presetId"];
    patientsPerNurse: RatioPresetContract["patientsPerNurse"];
    groupCount: number;
    capacityForAssignedGroups: number;
    assignedEligibleCount: number;
    overCapacityPlaceholder: boolean;
  };
  recommendationStatus: "not_started";
  optimizerStatus: "not_started";
  fullShiftSimulationStatus: "not_started";
  syntheticDataOnly: true;
};

export function buildManualAssignmentScenarioBridgeInput(
  capacity: ScenarioCapacityIntegration,
  ratioPreset: RatioPresetContract
): ManualAssignmentScenarioBridgeInput {
  const groupSize = ratioPreset.patientsPerNurse;
  const groupCount = Math.ceil(capacity.assignmentEligibleBedPositionIds.length / groupSize);
  const labels = Array.from({ length: groupCount }, (_, index) => String.fromCharCode(65 + index));
  const assignmentGroups = labels
    .map((label, index) => {
      const assignedBedPositionIds = capacity.assignmentEligibleBedPositionIds.slice(
        index * groupSize,
        index * groupSize + groupSize
      );
      return {
        assignmentGroupId: `synthetic-group-${label.toLowerCase()}`,
        syntheticNurseLabel: `Synthetic Nurse ${label}`,
        assignedBedPositionIds,
        syntheticDataOnly: true as const
      };
    })
    .filter((group) => group.assignedBedPositionIds.length > 0);

  return {
    schemaVersion: MANUAL_ASSIGNMENT_SCENARIO_BRIDGE_SCHEMA_VERSION,
    bridgeId: "manual-assignment-scenario-bridge-canonical-plan-1",
    assignmentGroups,
    ratioPreset,
    capacity,
    recommendationStatus: "not_started",
    optimizerStatus: "not_started",
    fullShiftSimulationStatus: "not_started",
    syntheticDataOnly: true
  };
}
