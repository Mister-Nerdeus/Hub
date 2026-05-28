import {
  fourToOneRuntimeSeedContract,
  fourToOneRatioPreset,
  threeToOneRuntimeSeedContract,
  threeToOneRatioPreset,
  type ActivityProfileId,
  type RatioPresetContract,
  type RatioPresetId,
  type RatioRuntimeSeedContract
} from "@nerdeus/shared";
import type { SimulationV0RatioView } from "./simulationV0ReviewState";

export type SimulationV0RatioOption = {
  id: SimulationV0RatioView;
  label: "4:1 dry-run" | "3:1 dry-run" | "Side-by-side comparison";
  note: "Ratio planning assumption";
};

export const simulationV0RatioOptions: readonly SimulationV0RatioOption[] = [
  { id: "four_to_one", label: "4:1 dry-run", note: "Ratio planning assumption" },
  { id: "three_to_one", label: "3:1 dry-run", note: "Ratio planning assumption" },
  { id: "comparison", label: "Side-by-side comparison", note: "Ratio planning assumption" }
];

export function ratioPresetsForView(ratioView: SimulationV0RatioView): readonly RatioPresetContract[] {
  if (ratioView === "four_to_one") return [fourToOneRatioPreset];
  if (ratioView === "three_to_one") return [threeToOneRatioPreset];
  return [fourToOneRatioPreset, threeToOneRatioPreset];
}

export function buildRatioRuntimeSeedForReviewState(input: {
  activityProfileId: ActivityProfileId;
  ratioPresetId: RatioPresetId;
}): RatioRuntimeSeedContract {
  const base =
    input.ratioPresetId === "four_to_one" ? fourToOneRuntimeSeedContract : threeToOneRuntimeSeedContract;
  return {
    ...base,
    activityProfileId: input.activityProfileId,
    seedValue:
      input.activityProfileId === "typical"
        ? base.seedValue
        : `${base.seedValue}-${input.activityProfileId}`
  };
}
