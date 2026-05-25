import type {
  Plan1ScenarioComparisonViewModel,
  Plan1ScenarioComparisonViewModelRow
} from "./plan1ScenarioComparisonViewModel.js";

export type Plan1ScenarioNarrativeType =
  | "typical_vs_slammed"
  | "typical_vs_walking_heavy"
  | "typical_vs_trauma_heavy"
  | "overall_demo_summary";

export type Plan1ScenarioNarrative = {
  narrativeType: Plan1ScenarioNarrativeType;
  title: string;
  profileId: string;
  summary: string;
  evidenceSignals: {
    taskPressureDelta: number;
    deferredTaskDelta: number;
    walkingBurdenDelta: number;
    maxQueueDepthDelta: number;
    warningCodeSummary: string[];
  };
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export type Plan1ScenarioNarrativeSet = {
  comparisonId: string;
  narratives: Plan1ScenarioNarrative[];
  requiredNarratives: Record<Plan1ScenarioNarrativeType, Plan1ScenarioNarrative>;
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

const PROHIBITED_NARRATIVE_CLAIMS = [
  /\bunsafe\b/iu,
  /\bsafe\b/iu,
  /staffing compliant/iu,
  /clinically unacceptable/iu,
  /patient harm/iu,
  /predicts outcomes/iu,
  /required staffing level/iu
];

export function buildPlan1ScenarioNarratives(
  viewModel: Omit<Plan1ScenarioComparisonViewModel, "narratives">
): Plan1ScenarioNarrativeSet {
  const typicalVsSlammed = buildNarrative({
    narrativeType: "typical_vs_slammed",
    title: "Typical vs slammed",
    row: viewModel.requiredComparisons.typicalVsSlammed,
    summary: [
      `Compared with Typical, Slammed shows higher synthetic task pressure (${signed(viewModel.requiredComparisons.typicalVsSlammed.taskPressureDelta)} tasks) and more deferred synthetic work (${signed(viewModel.requiredComparisons.typicalVsSlammed.deferredTaskDelta)} tasks).`,
      `The queue-depth signal is larger (${signed(viewModel.requiredComparisons.typicalVsSlammed.maxQueueDepthDelta)}) while approximate walking load also rises (${signed(viewModel.requiredComparisons.typicalVsSlammed.walkingBurdenDelta)} feet).`,
      `This is an operational comparison only using synthetic, seeded scenario output.`
    ].join(" ")
  });

  const typicalVsWalkingHeavy = buildNarrative({
    narrativeType: "typical_vs_walking_heavy",
    title: "Typical vs walking heavy",
    row: viewModel.requiredComparisons.typicalVsWalkingHeavy,
    summary: [
      `Compared with Typical, Walking heavy shows higher approximate walking load (${signed(viewModel.requiredComparisons.typicalVsWalkingHeavy.walkingBurdenDelta)} feet).`,
      `It also carries higher synthetic task pressure (${signed(viewModel.requiredComparisons.typicalVsWalkingHeavy.taskPressureDelta)} tasks), more deferred synthetic work (${signed(viewModel.requiredComparisons.typicalVsWalkingHeavy.deferredTaskDelta)} tasks), and a larger queue-depth signal (${signed(viewModel.requiredComparisons.typicalVsWalkingHeavy.maxQueueDepthDelta)}).`,
      `This narrative is an operational comparison only, not a staffing or clinical recommendation.`
    ].join(" ")
  });

  const typicalVsTraumaHeavy = buildNarrative({
    narrativeType: "typical_vs_trauma_heavy",
    title: "Typical vs trauma heavy",
    row: viewModel.requiredComparisons.typicalVsTraumaHeavy,
    summary: [
      `Compared with Typical, Trauma heavy produces higher synthetic task pressure (${signed(viewModel.requiredComparisons.typicalVsTraumaHeavy.taskPressureDelta)} tasks) with a trauma workload notice in the warning signal set.`,
      `The same comparison shows more deferred synthetic work (${signed(viewModel.requiredComparisons.typicalVsTraumaHeavy.deferredTaskDelta)} tasks), higher approximate walking load (${signed(viewModel.requiredComparisons.typicalVsTraumaHeavy.walkingBurdenDelta)} feet), and a larger queue-depth signal (${signed(viewModel.requiredComparisons.typicalVsTraumaHeavy.maxQueueDepthDelta)}).`,
      `This is an operational comparison only and stays limited to deterministic Plan 1 demo evidence.`
    ].join(" ")
  });

  const overallDemoSummary = buildNarrative({
    narrativeType: "overall_demo_summary",
    title: "Overall demo summary",
    row: summarizeOverall(viewModel),
    summary: [
      `The Plan 1 comparison set separates synthetic workload patterns into task pressure, deferred synthetic work, approximate walking load, and queue-depth signals.`,
      `Slammed is the strongest task-pressure contrast, Walking heavy is the clearest walking-load contrast, and Trauma heavy adds the trauma workload notice without changing the proof into a recommendation.`,
      `All summaries are operational comparison only and use deterministic synthetic evidence.`
    ].join(" ")
  });

  return {
    comparisonId: viewModel.comparisonId,
    narratives: [typicalVsSlammed, typicalVsWalkingHeavy, typicalVsTraumaHeavy, overallDemoSummary],
    requiredNarratives: {
      typical_vs_slammed: typicalVsSlammed,
      typical_vs_walking_heavy: typicalVsWalkingHeavy,
      typical_vs_trauma_heavy: typicalVsTraumaHeavy,
      overall_demo_summary: overallDemoSummary
    },
    limitations: [...viewModel.limitations],
    nonClaims: [...viewModel.nonClaims],
    syntheticDataOnly: true
  };
}

export function assertPlan1ScenarioNarrativeClaims(narrative: Plan1ScenarioNarrative): void {
  assertNoProhibitedNarrativeClaims(`${narrative.title} ${narrative.summary}`);
}

function buildNarrative(input: {
  narrativeType: Plan1ScenarioNarrativeType;
  title: string;
  row: Plan1ScenarioComparisonViewModelRow;
  summary: string;
}): Plan1ScenarioNarrative {
  const narrative = {
    narrativeType: input.narrativeType,
    title: input.title,
    profileId: input.row.profileId,
    summary: input.summary,
    evidenceSignals: {
      taskPressureDelta: input.row.taskPressureDelta,
      deferredTaskDelta: input.row.deferredTaskDelta,
      walkingBurdenDelta: input.row.walkingBurdenDelta,
      maxQueueDepthDelta: input.row.maxQueueDepthDelta,
      warningCodeSummary: [...input.row.warningCodeSummary]
    },
    limitations: [...input.row.limitations],
    nonClaims: [...input.row.nonClaims],
    syntheticDataOnly: true as const
  };
  assertPlan1ScenarioNarrativeClaims(narrative);
  return narrative;
}

function summarizeOverall(viewModel: Omit<Plan1ScenarioComparisonViewModel, "narratives">): Plan1ScenarioComparisonViewModelRow {
  const rows = Object.values(viewModel.requiredComparisons);
  return {
    profileLabel: "Plan 1 comparison set",
    profileId: "plan-1-comparison-set",
    taskPressureDelta: Math.max(...rows.map((row) => row.taskPressureDelta)),
    deferredTaskDelta: Math.max(...rows.map((row) => row.deferredTaskDelta)),
    walkingBurdenDelta: Math.max(...rows.map((row) => row.walkingBurdenDelta)),
    maxQueueDepthDelta: Math.max(...rows.map((row) => row.maxQueueDepthDelta)),
    highestBurdenNurseId: rows[0]?.highestBurdenNurseId ?? "nurse-unassigned",
    warningCodeSummary: [...new Set(rows.flatMap((row) => row.warningCodeSummary))].sort(),
    plainLanguageSummary: "",
    limitations: [...viewModel.limitations],
    nonClaims: [...viewModel.nonClaims]
  };
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function assertNoProhibitedNarrativeClaims(text: string): void {
  const violation = PROHIBITED_NARRATIVE_CLAIMS.find((pattern) => pattern.test(text));
  if (violation != null) {
    throw new Error(`Plan 1 scenario narrative contains prohibited claim language: ${violation}`);
  }
}
