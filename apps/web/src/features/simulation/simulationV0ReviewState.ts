import type { ActivityProfileId } from "@nerdeus/shared";

export type SimulationV0RatioView = "four_to_one" | "three_to_one" | "comparison";

export type SimulationV0ReviewState = {
  activityProfileId: ActivityProfileId;
  ratioView: SimulationV0RatioView;
};

export const simulationV0DefaultReviewState: SimulationV0ReviewState = {
  activityProfileId: "typical",
  ratioView: "comparison"
};

export const simulationV0ActivityProfileIds = ["typical", "busy", "slammed"] as const;
export const simulationV0RatioViews = ["four_to_one", "three_to_one", "comparison"] as const;

export function updateSimulationV0ActivityProfile(
  state: SimulationV0ReviewState,
  activityProfileId: ActivityProfileId
): SimulationV0ReviewState {
  if (!simulationV0ActivityProfileIds.includes(activityProfileId)) {
    throw new Error("Simulation v0 activity profile must be typical, busy, or slammed");
  }
  return { ...state, activityProfileId };
}

export function updateSimulationV0RatioView(
  state: SimulationV0ReviewState,
  ratioView: SimulationV0RatioView
): SimulationV0ReviewState {
  if (!simulationV0RatioViews.includes(ratioView)) {
    throw new Error("Simulation v0 ratio view must be 4:1, 3:1, or comparison");
  }
  return { ...state, ratioView };
}
