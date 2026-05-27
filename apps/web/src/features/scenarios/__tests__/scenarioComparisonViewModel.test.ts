import {
  CANONICAL_ER_POD_FLOORPLAN_ID,
  fourToOneScenarioSeedFixture,
  outcomeMetricPlaceholderSet
} from "@nerdeus/shared";
import {
  createDefaultScenarioComparisonInput,
  createScenarioComparisonViewModel
} from "../scenarioComparisonViewModel";

const viewModel = createScenarioComparisonViewModel();

if (viewModel.canonicalFloorplanId !== CANONICAL_ER_POD_FLOORPLAN_ID) {
  throw new Error("comparison view model must use the canonical floorplan");
}

if (viewModel.cards[0].label !== "4:1" || viewModel.cards[1].label !== "3:1") {
  throw new Error("comparison view model must show 4:1 and 3:1 side by side");
}

if (viewModel.nurseCountDifference !== 2) {
  throw new Error("comparison view model must expose nurse group difference");
}

if (!viewModel.activityPresetSummary.includes("Busy")) {
  throw new Error("comparison view model must include activity preset summary");
}

if (!viewModel.patientLoadSummary.includes("occupied rooms") || !viewModel.acuityPatternSummary.includes("acuity")) {
  throw new Error("comparison view model must include load and acuity summaries");
}

if (!viewModel.placeholderOutcomeRows.every((row) => row.status === "placeholder" && row.computed === false)) {
  throw new Error("comparison view model must keep outcome rows placeholder-only");
}

const mismatchedInput = createDefaultScenarioComparisonInput();
mismatchedInput.threeToOneScenarioSeed = {
  ...fourToOneScenarioSeedFixture,
  scenarioSeedId: "scenario-seed-drifted-floorplan",
  ratioConfigurationId: "three_to_one",
  assignmentTemplateId: "assignment-template-canonical-er-pod-3-to-1",
  canonicalFloorplanId: "default-er-layout-plan-2" as typeof CANONICAL_ER_POD_FLOORPLAN_ID
};

assertThrows(() => createScenarioComparisonViewModel(mismatchedInput), "canonical");

const computedInput = createDefaultScenarioComparisonInput();
computedInput.outcomePlaceholders = {
  ...outcomeMetricPlaceholderSet,
  metrics: [{ ...outcomeMetricPlaceholderSet.metrics[0], computed: true }]
} as unknown as typeof outcomeMetricPlaceholderSet;
assertThrows(() => createScenarioComparisonViewModel(computedInput), "computed");

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
