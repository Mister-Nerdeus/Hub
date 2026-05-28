import type {
  ActivityProfileContract,
  ActivityProfileOccupancySelection,
  CanonicalCapacityCountReport
} from "@nerdeus/shared";
import type { SimulationV0ReviewState } from "./simulationV0ReviewState";

export type SimulationV0OccupiedBedProofViewModel = {
  profileId: SimulationV0ReviewState["activityProfileId"];
  profileLabel: ActivityProfileContract["label"];
  occupancyPercent: number;
  selectedOccupiedBedCount: number;
  selectedBedPositionIds: readonly string[];
  excludedObjectCount: number;
  excludedObjectCategories: readonly string[];
  capacityNote: string;
};

export function buildSimulationV0OccupiedBedProofViewModel(input: {
  reviewState: SimulationV0ReviewState;
  activityProfile: ActivityProfileContract;
  occupancySelection: ActivityProfileOccupancySelection;
  capacityReport: CanonicalCapacityCountReport;
}): SimulationV0OccupiedBedProofViewModel {
  return {
    profileId: input.reviewState.activityProfileId,
    profileLabel: input.activityProfile.label,
    occupancyPercent: input.activityProfile.occupancyPercent,
    selectedOccupiedBedCount: input.occupancySelection.selectedOccupiedBedPositionIds.length,
    selectedBedPositionIds: input.occupancySelection.selectedOccupiedBedPositionIds,
    excludedObjectCount: input.capacityReport.excludedCount,
    excludedObjectCategories: ["storage", "support area", "hallway", "solid wall"],
    capacityNote: "Selector-derived assignment-eligible bed positions only."
  };
}
