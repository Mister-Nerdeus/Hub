import {
  simulationV0DefaultReviewState,
  updateSimulationV0ActivityProfile,
  updateSimulationV0RatioView
} from "../simulationV0ReviewState";

const busyState = updateSimulationV0ActivityProfile(simulationV0DefaultReviewState, "busy");
if (busyState.activityProfileId !== "busy") {
  throw new Error("Simulation v0 activity profile selection must update shared review state");
}

const ratioState = updateSimulationV0RatioView(busyState, "three_to_one");
if (ratioState.ratioView !== "three_to_one" || ratioState.activityProfileId !== "busy") {
  throw new Error("Simulation v0 ratio selection must update shared review state without losing profile");
}

assertThrows(() => updateSimulationV0ActivityProfile(simulationV0DefaultReviewState, "custom" as never));
assertThrows(() => updateSimulationV0RatioView(simulationV0DefaultReviewState, "best" as never));

function assertThrows(fn: () => unknown) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error("Simulation v0 review state negative fixture must fail closed");
  }
}
