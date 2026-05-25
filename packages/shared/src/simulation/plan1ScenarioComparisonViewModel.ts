import { validatePlan1Limitations, validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";
import type { Plan1ScenarioComparisonFixture, Plan1ScenarioComparisonItem } from "./plan1ScenarioComparison.js";

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
  return {
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
    syntheticDataOnly: true
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
  const parts = [
    `${PROFILE_LABELS[item.profileId] ?? item.profileId} changes task pressure by ${delta.taskPressureDelta}.`,
    `Deferred tasks change by ${delta.deferredTaskDelta}.`,
    `Walking estimate changes by ${delta.walkingBurdenDelta} feet.`,
    `Maximum queue depth changes by ${delta.maxQueueDepthDelta}.`
  ];
  if (item.warningCodes.length > 0) {
    parts.push(`Warnings represented: ${[...item.warningCodes].sort().join(", ")}.`);
  }
  return parts.join(" ");
}

function requireRow(rows: Plan1ScenarioComparisonViewModelRow[], profileId: string): Plan1ScenarioComparisonViewModelRow {
  const row = rows.find((entry) => entry.profileId === profileId);
  if (row == null) {
    throw new Error(`Plan 1 comparison view model missing ${profileId}`);
  }
  return row;
}
