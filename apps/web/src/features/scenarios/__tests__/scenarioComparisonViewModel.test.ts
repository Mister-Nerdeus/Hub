import {
  CANONICAL_SCENARIO_FLOORPLAN_ID
} from "@nerdeus/shared";
import {
  createDefaultScenarioComparisonInput,
  createScenarioComparisonViewModel
} from "../scenarioComparisonViewModel";

const viewModel = createScenarioComparisonViewModel();

if (viewModel.canonicalFloorplanId !== CANONICAL_SCENARIO_FLOORPLAN_ID) {
  throw new Error("comparison view model must use the canonical floorplan");
}

if (viewModel.cards[0].label !== "4:1" || viewModel.cards[1].label !== "3:1") {
  throw new Error("comparison view model must show 4:1 and 3:1 side by side");
}

if (viewModel.cards[0].planningGroupCountPlaceholder >= viewModel.cards[1].planningGroupCountPlaceholder) {
  throw new Error("comparison view model must expose readiness-level planning group comparison");
}

if (viewModel.planningGroupDifferencePlaceholder <= 0) {
  throw new Error("comparison view model must expose planning group difference placeholder");
}

if (viewModel.capacitySummary.selectorDrivenCounts !== true) {
  throw new Error("comparison view model must use selector-driven capacity counts");
}

if (!viewModel.knownLimitations.includes("No full-shift simulation output")) {
  throw new Error("comparison view model must keep simulation output absent");
}

const mismatchedInput = createDefaultScenarioComparisonInput();
mismatchedInput.canonicalFloorplanId = "default-er-layout-plan-2";

assertThrows(() => createScenarioComparisonViewModel(mismatchedInput), "canonical");

const missingReferenceProofInput = createDefaultScenarioComparisonInput();
missingReferenceProofInput.imageBackedReferenceProofReady = false;
assertThrows(() => createScenarioComparisonViewModel(missingReferenceProofInput), "image-backed");

function assertThrows(fn: () => unknown, expectedMessagePart: string) {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error && error.message.includes(expectedMessagePart)) {
      return;
    }
    throw error;
  }
  throw new Error(`expected function to throw ${expectedMessagePart}`);
}
