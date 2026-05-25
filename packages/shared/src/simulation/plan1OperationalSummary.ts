import { PLAN_1_ID, roundPlan1Number } from "../assignment/plan1AssignmentCommon.js";
import { validatePlan1Limitations, validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";
import type { Plan1ShiftDryRunOutput } from "./plan1ShiftDryRun.js";

export type Plan1OperationalSummary = {
  scenarioId: string;
  profileId: string;
  taskCount: number;
  completedTaskCount: number;
  deferredTaskCount: number;
  totalApproxWalkingFeet: number;
  averageApproxBusyMinutes: number;
  maxQueueDepth: number;
  highestBurdenNurseId: string;
  warningCodes: string[];
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export function buildPlan1OperationalSummary(dryRunOutput: Plan1ShiftDryRunOutput): Plan1OperationalSummary {
  if (dryRunOutput.planId !== PLAN_1_ID) {
    throw new Error("Plan 1 operational summary only accepts Plan 1 dry-run output");
  }
  const totalCompleted = dryRunOutput.nurseTimelineSummaries.reduce(
    (total, summary) => total + summary.completedTaskCount,
    0
  );
  const totalDeferred = dryRunOutput.nurseTimelineSummaries.reduce(
    (total, summary) => total + summary.deferredTaskCount,
    0
  );
  if (totalCompleted !== dryRunOutput.completedTaskCount || totalDeferred !== dryRunOutput.deferredTaskCount) {
    throw new Error("Plan 1 operational summary totals must match dry-run totals");
  }
  const highestBurden = [...dryRunOutput.nurseTimelineSummaries].sort(
    (a, b) =>
      b.burdenScoreSnapshot.approximateOperationalBurden -
        a.burdenScoreSnapshot.approximateOperationalBurden ||
      a.nurseId.localeCompare(b.nurseId)
  )[0];
  if (highestBurden == null) {
    throw new Error("Plan 1 operational summary requires at least one nurse summary");
  }
  return {
    scenarioId: dryRunOutput.scenarioId,
    profileId: dryRunOutput.profileId,
    taskCount: dryRunOutput.taskCount,
    completedTaskCount: dryRunOutput.completedTaskCount,
    deferredTaskCount: dryRunOutput.deferredTaskCount,
    totalApproxWalkingFeet: dryRunOutput.nurseTimelineSummaries.reduce(
      (total, summary) => total + summary.approxWalkingFeet,
      0
    ),
    averageApproxBusyMinutes: roundPlan1Number(
      dryRunOutput.nurseTimelineSummaries.reduce((total, summary) => total + summary.approxBusyMinutes, 0) /
        dryRunOutput.nurseTimelineSummaries.length
    ),
    maxQueueDepth: Math.max(...dryRunOutput.nurseTimelineSummaries.map((summary) => summary.maxQueueDepth)),
    highestBurdenNurseId: highestBurden.nurseId,
    warningCodes: [...new Set(dryRunOutput.warningCodes)].sort(),
    limitations: validatePlan1Limitations(dryRunOutput.limitations, "operationalSummary.limitations"),
    nonClaims: validatePlan1NonClaims(dryRunOutput.nonClaims, "operationalSummary.nonClaims"),
    syntheticDataOnly: true
  };
}

export function assertPlan1SummaryHasNoRecommendationClaims(summary: Plan1OperationalSummary): void {
  const combined = JSON.stringify(summary).toLowerCase();
  if (/\bshould assign\b|\brecommended staffing\b|\bcertif(?:y|ies|ied)\b|\bpredicts outcome\b/u.test(combined)) {
    throw new Error("Plan 1 operational summary must not claim recommendations or certification");
  }
}
