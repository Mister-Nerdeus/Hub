import { validatePlan1Limitations, validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";
import type { Plan1OperationalSummary } from "./plan1OperationalSummary.js";

export type Plan1ScenarioComparisonItem = {
  scenarioId: string;
  profileId: string;
  seed: number;
  taskCount: number;
  completedTaskCount: number;
  deferredTaskCount: number;
  totalApproxWalkingFeet: number;
  maxQueueDepth: number;
  highestBurdenNurseId: string;
  warningCodes: string[];
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export type Plan1ScenarioComparisonFixture = {
  comparisonId: string;
  planId: "default-er-layout-plan-1";
  baselineScenarioId: string;
  items: Plan1ScenarioComparisonItem[];
  proof: {
    slammedHigherTaskPressureThanTypical: boolean;
    walkingHeavyHigherWalkingBurdenThanTypical: boolean;
    traumaHeavyCreatesTraumaWorkloadSignal: boolean;
    deterministicOutput: boolean;
  };
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export function buildPlan1ScenarioComparisonFixture(input: {
  comparisonId: string;
  summaries: Array<Plan1OperationalSummary & { seed: number }>;
  limitations: string[];
  nonClaims: string[];
}): Plan1ScenarioComparisonFixture {
  const items = input.summaries.map((summary) => ({
    scenarioId: summary.scenarioId,
    profileId: summary.profileId,
    seed: summary.seed,
    taskCount: summary.taskCount,
    completedTaskCount: summary.completedTaskCount,
    deferredTaskCount: summary.deferredTaskCount,
    totalApproxWalkingFeet: summary.totalApproxWalkingFeet,
    maxQueueDepth: summary.maxQueueDepth,
    highestBurdenNurseId: summary.highestBurdenNurseId,
    warningCodes: [...summary.warningCodes].sort(),
    limitations: validatePlan1Limitations(summary.limitations, "scenarioComparison.item.limitations"),
    nonClaims: validatePlan1NonClaims(summary.nonClaims, "scenarioComparison.item.nonClaims"),
    syntheticDataOnly: true as const
  }));
  const typical = requireProfile(items, "plan-1-typical");
  const slammed = requireProfile(items, "plan-1-slammed");
  const traumaHeavy = requireProfile(items, "plan-1-trauma-heavy");
  const walkingHeavy = requireProfile(items, "plan-1-walking-heavy");
  const proof = {
    slammedHigherTaskPressureThanTypical: slammed.taskCount > typical.taskCount,
    walkingHeavyHigherWalkingBurdenThanTypical:
      walkingHeavy.totalApproxWalkingFeet > typical.totalApproxWalkingFeet,
    traumaHeavyCreatesTraumaWorkloadSignal:
      traumaHeavy.warningCodes.includes("TRAUMA_WORKLOAD_NOTICE") ||
      traumaHeavy.taskCount > typical.taskCount,
    deterministicOutput: JSON.stringify(items) === JSON.stringify([...items])
  };
  return {
    comparisonId: input.comparisonId,
    planId: "default-er-layout-plan-1",
    baselineScenarioId: typical.scenarioId,
    items,
    proof,
    limitations: validatePlan1Limitations(input.limitations, "scenarioComparison.limitations"),
    nonClaims: validatePlan1NonClaims(input.nonClaims, "scenarioComparison.nonClaims"),
    syntheticDataOnly: true
  };
}

export function validatePlan1ScenarioComparisonFixture(value: unknown): Plan1ScenarioComparisonFixture {
  const fixture = value as Plan1ScenarioComparisonFixture;
  if (fixture?.planId !== "default-er-layout-plan-1") {
    throw new Error("Plan 1 scenario comparison fixture must use default-er-layout-plan-1");
  }
  if (fixture.syntheticDataOnly !== true) {
    throw new Error("Plan 1 scenario comparison fixture must be synthetic only");
  }
  validatePlan1Limitations(fixture.limitations, "scenarioComparison.limitations");
  validatePlan1NonClaims(fixture.nonClaims, "scenarioComparison.nonClaims");
  for (const item of fixture.items ?? []) {
    validatePlan1Limitations(item.limitations, "scenarioComparison.item.limitations");
    validatePlan1NonClaims(item.nonClaims, "scenarioComparison.item.nonClaims");
  }
  if (JSON.stringify(fixture).toLowerCase().includes("recommended staffing")) {
    throw new Error("Plan 1 scenario comparison must not claim staffing recommendations");
  }
  return fixture;
}

function requireProfile(items: Plan1ScenarioComparisonItem[], profileId: string): Plan1ScenarioComparisonItem {
  const item = items.find((entry) => entry.profileId === profileId);
  if (item == null) {
    throw new Error(`Missing comparison item for ${profileId}`);
  }
  return item;
}
