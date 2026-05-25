import {
  PLAN_1_SIMULATION_NON_CLAIMS,
  validatePlan1SimulationAssumptions,
  type Plan1SimulationAssumptionsRegister
} from "./plan1SimulationAssumptions.js";

export type Plan1AssumptionSectionId =
  | "burden-score-weights"
  | "walking-assumptions"
  | "task-duration-assumptions"
  | "task-frequency-assumptions"
  | "scenario-intensity-assumptions"
  | "queue-assumptions"
  | "handoff-assumptions"
  | "interruption-assumptions"
  | "overload-thresholds"
  | "status-semantics"
  | "limitations-and-non-claims";

export type Plan1AssumptionViewModelSection = {
  sectionId: Plan1AssumptionSectionId;
  label: string;
  entries: Array<{ label: string; value: string }>;
};

export type Plan1AssumptionViewModel = {
  planId: "default-er-layout-plan-1";
  assumptionsId: string;
  mode: "read_only_proof";
  sections: Plan1AssumptionViewModelSection[];
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export function buildPlan1AssumptionViewModel(value: unknown): Plan1AssumptionViewModel {
  const assumptions = validatePlan1SimulationAssumptions(value);
  return {
    planId: "default-er-layout-plan-1",
    assumptionsId: assumptions.assumptionsId,
    mode: "read_only_proof",
    sections: [
      section("burden-score-weights", "Burden score weights", entriesFromRecord(assumptions.burdenScoreWeights)),
      section("walking-assumptions", "Walking assumptions", entriesFromRecord(assumptions.walkingAssumptions)),
      section("task-duration-assumptions", "Task duration assumptions", entriesFromRecord(assumptions.taskDurationAssumptions)),
      section("task-frequency-assumptions", "Task frequency assumptions", entriesFromRecord(assumptions.taskFrequencyAssumptions)),
      section("scenario-intensity-assumptions", "Scenario intensity assumptions", entriesFromRecord(assumptions.scenarioIntensityAssumptions)),
      section("queue-assumptions", "Queue assumptions", entriesFromRecord(assumptions.queueAssumptions)),
      section("handoff-assumptions", "Handoff assumptions", entriesFromRecord(assumptions.handoffAssumptions)),
      section("interruption-assumptions", "Interruption assumptions", entriesFromRecord(assumptions.interruptionAssumptions)),
      section("overload-thresholds", "Overload thresholds", entriesFromRecord(assumptions.overloadThresholds)),
      section("status-semantics", "Status semantics", entriesFromStatusSemantics(assumptions)),
      section("limitations-and-non-claims", "Limitations and non-claims", [
        ...assumptions.limitations.map((value, index) => ({ label: `Limitation ${index + 1}`, value })),
        ...assumptions.nonClaims.map((value, index) => ({ label: `Non-claim ${index + 1}`, value }))
      ])
    ],
    limitations: [...assumptions.limitations],
    nonClaims: [...assumptions.nonClaims],
    syntheticDataOnly: true
  };
}

export function assertPlan1AssumptionViewModelComplete(viewModel: Plan1AssumptionViewModel): void {
  const required: Plan1AssumptionSectionId[] = [
    "burden-score-weights",
    "walking-assumptions",
    "task-duration-assumptions",
    "task-frequency-assumptions",
    "scenario-intensity-assumptions",
    "queue-assumptions",
    "handoff-assumptions",
    "interruption-assumptions",
    "overload-thresholds",
    "status-semantics",
    "limitations-and-non-claims"
  ];
  const actual = new Set(viewModel.sections.map((section) => section.sectionId));
  for (const sectionId of required) {
    if (!actual.has(sectionId)) {
      throw new Error(`Plan 1 assumptions view model missing ${sectionId}`);
    }
  }
  for (const requiredNonClaim of PLAN_1_SIMULATION_NON_CLAIMS) {
    if (!viewModel.nonClaims.includes(requiredNonClaim)) {
      throw new Error(`Plan 1 assumptions view model missing non-claim ${requiredNonClaim}`);
    }
  }
}

function section(
  sectionId: Plan1AssumptionSectionId,
  label: string,
  entries: Array<{ label: string; value: string }>
): Plan1AssumptionViewModelSection {
  return { sectionId, label, entries };
}

function entriesFromRecord(record: Record<string, unknown>): Array<{ label: string; value: string }> {
  return Object.entries(record)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, value: stringifyValue(value) }));
}

function entriesFromStatusSemantics(
  assumptions: Plan1SimulationAssumptionsRegister
): Array<{ label: string; value: string }> {
  return Object.entries(assumptions.statusSemantics).map(([status, value]) => ({
    label: status,
    value: `${value.label}: ${value.meaning}; blocks progress: ${value.blocksProgress ? "yes" : "no"}`
  }));
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}
