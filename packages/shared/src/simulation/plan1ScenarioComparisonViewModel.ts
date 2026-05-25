import { validatePlan1Limitations, validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";
import type { Plan1ScenarioComparisonFixture, Plan1ScenarioComparisonItem } from "./plan1ScenarioComparison.js";
import {
  buildPlan1ScenarioNarratives,
  type Plan1ScenarioNarrativeSet
} from "./plan1ScenarioNarratives.js";

export type Plan1ScenarioComparisonViewModelRow = {
  profileLabel: string;
  profileId: string;
  taskPressureDelta: number;
  deferredTaskDelta: number;
  walkingBurdenDelta: number;
  maxQueueDepthDelta: number;
  highestBurdenNurseId: string;
  warningCodeSummary: string[];
  plainLanguageSummary: string;
  limitations: string[];
  nonClaims: string[];
};

export type Plan1ScenarioComparisonViewModel = {
  comparisonId: string;
  baselineScenarioId: string;
  rows: Plan1ScenarioComparisonViewModelRow[];
  requiredComparisons: {
    typicalVsSlammed: Plan1ScenarioComparisonViewModelRow;
    typicalVsWalkingHeavy: Plan1ScenarioComparisonViewModelRow;
    typicalVsTraumaHeavy: Plan1ScenarioComparisonViewModelRow;
  };
  limitations: string[];
  nonClaims: string[];
  narratives: Plan1ScenarioNarrativeSet;
  syntheticDataOnly: true;
};

const PROFILE_LABELS: Record<string, string> = {
  "plan-1-typical": "Typical",
  "plan-1-busy": "Busy",
  "plan-1-slammed": "Slammed",
  "plan-1-trauma-heavy": "Trauma heavy",
  "plan-1-walking-heavy": "Walking heavy"
};

export function buildPlan1ScenarioComparisonViewModel(
  comparison: Plan1ScenarioComparisonFixture
): Plan1ScenarioComparisonViewModel {
  const baseline = comparison.items.find((item) => item.scenarioId === comparison.baselineScenarioId) ??
    comparison.items.find((item) => item.profileId === "plan-1-typical");
  if (baseline == null) {
    throw new Error("Plan 1 comparison view model requires a typical baseline item");
  }
  const rows = comparison.items.map((item) => buildRow(item, baseline));
  const viewModel = {
    comparisonId: comparison.comparisonId,
    baselineScenarioId: comparison.baselineScenarioId,
    rows,
    requiredComparisons: {
      typicalVsSlammed: requireRow(rows, "plan-1-slammed"),
      typicalVsWalkingHeavy: requireRow(rows, "plan-1-walking-heavy"),
      typicalVsTraumaHeavy: requireRow(rows, "plan-1-trauma-heavy")
    },
    limitations: validatePlan1Limitations(comparison.limitations, "comparisonViewModel.limitations"),
    nonClaims: validatePlan1NonClaims(comparison.nonClaims, "comparisonViewModel.nonClaims"),
    syntheticDataOnly: true as const
  };
  return {
    ...viewModel,
    narratives: buildPlan1ScenarioNarratives(viewModel)
  };
}

function buildRow(
  item: Plan1ScenarioComparisonItem,
  baseline: Plan1ScenarioComparisonItem
): Plan1ScenarioComparisonViewModelRow {
  const taskPressureDelta = item.taskCount - baseline.taskCount;
  const deferredTaskDelta = item.deferredTaskCount - baseline.deferredTaskCount;
  const walkingBurdenDelta = item.totalApproxWalkingFeet - baseline.totalApproxWalkingFeet;
  const maxQueueDepthDelta = item.maxQueueDepth - baseline.maxQueueDepth;
  return {
    profileLabel: PROFILE_LABELS[item.profileId] ?? item.profileId,
    profileId: item.profileId,
    taskPressureDelta,
    deferredTaskDelta,
    walkingBurdenDelta,
    maxQueueDepthDelta,
    highestBurdenNurseId: item.highestBurdenNurseId,
    warningCodeSummary: [...item.warningCodes].sort(),
    plainLanguageSummary: summarizeRow(item, { taskPressureDelta, deferredTaskDelta, walkingBurdenDelta, maxQueueDepthDelta }),
    limitations: validatePlan1Limitations(item.limitations, "comparisonViewModel.row.limitations"),
    nonClaims: validatePlan1NonClaims(item.nonClaims, "comparisonViewModel.row.nonClaims")
  };
}

function summarizeRow(
  item: Plan1ScenarioComparisonItem,
  delta: Pick<Plan1ScenarioComparisonViewModelRow, "taskPressureDelta" | "deferredTaskDelta" | "walkingBurdenDelta" | "maxQueueDepthDelta">
): string {
  const label = PROFILE_LABELS[item.profileId] ?? item.profileId;
  if (delta.taskPressureDelta === 0 && delta.deferredTaskDelta === 0 && delta.walkingBurdenDelta === 0 && delta.maxQueueDepthDelta === 0) {
    return `${label} is the baseline for operational comparison only; it anchors synthetic task pressure, deferred synthetic work, approximate walking load, and queue-depth signal.`;
  }
  const parts = [
    `${label} shows ${delta.taskPressureDelta > 0 ? "higher" : "lower or unchanged"} synthetic task pressure (${signed(delta.taskPressureDelta)} tasks).`,
    `It has ${delta.deferredTaskDelta > 0 ? "more" : "less or unchanged"} deferred synthetic work (${signed(delta.deferredTaskDelta)} tasks).`,
    `Approximate walking load changes by ${signed(delta.walkingBurdenDelta)} feet.`,
    `The queue-depth signal is ${delta.maxQueueDepthDelta > 0 ? "larger" : "unchanged or lower"} (${signed(delta.maxQueueDepthDelta)}).`
  ];
  if (item.warningCodes.length > 0) {
    parts.push(`Warnings represented: ${[...item.warningCodes].sort().join(", ")}.`);
  }
  parts.push("This is an operational comparison only.");
  return parts.join(" ");
}

function requireRow(rows: Plan1ScenarioComparisonViewModelRow[], profileId: string): Plan1ScenarioComparisonViewModelRow {
  const row = rows.find((entry) => entry.profileId === profileId);
  if (row == null) {
    throw new Error(`Plan 1 comparison view model missing ${profileId}`);
  }
  return row;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
