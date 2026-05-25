import { PLAN_1_ID, roundPlan1Number } from "../assignment/plan1AssignmentCommon.js";
import { validatePlan1Limitations, validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";
import type { Plan1ShiftDryRunOutput } from "./plan1ShiftDryRun.js";

export type Plan1TimelineViewModel = {
  planId: typeof PLAN_1_ID;
  scenarioId: string;
  durationMinutes: number;
  nurseTimelineSummary: Array<{
    nurseId: string;
    assignedTaskCount: number;
    completedTaskCount: number;
    deferredTaskCount: number;
    approxBusyMinutes: number;
    approxIdleMinutes: number;
    approxWalkingFeet: number;
    maxQueueDepth: number;
    warningCodes: string[];
  }>;
  roomTimelineSummary: Array<{
    roomId: string;
    assignedTaskCount: number;
    completedTaskCount: number;
    deferredTaskCount: number;
    warningCodes: string[];
  }>;
  deferredTaskSummary: {
    totalDeferredTaskCount: number;
    roomIdsWithDeferredTasks: string[];
    nurseIdsWithDeferredTasks: string[];
  };
  queueDepthSummary: {
    maxQueueDepth: number;
    nurseIdsAtMaxQueueDepth: string[];
  };
  walkingLoadSummary: {
    totalApproxWalkingFeet: number;
    pathBasedTaskCount: number;
    fallbackTaskCount: number;
    missingRouteTaskCount: number;
    warningCodes: string[];
  };
  warningTimelineSummary: Array<{ warningCode: string; count: number; source: "nurse" | "room" | "walking" }>;
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export function buildPlan1TimelineViewModel(dryRun: Plan1ShiftDryRunOutput): Plan1TimelineViewModel {
  if (dryRun.planId !== PLAN_1_ID) {
    throw new Error("Plan 1 timeline view model only accepts Plan 1 dry-run output");
  }
  const maxQueueDepth = Math.max(...dryRun.nurseTimelineSummaries.map((summary) => summary.maxQueueDepth));
  return {
    planId: PLAN_1_ID,
    scenarioId: dryRun.scenarioId,
    durationMinutes: dryRun.durationMinutes,
    nurseTimelineSummary: dryRun.nurseTimelineSummaries.map((summary) => ({
      nurseId: summary.nurseId,
      assignedTaskCount: summary.assignedTaskCount,
      completedTaskCount: summary.completedTaskCount,
      deferredTaskCount: summary.deferredTaskCount,
      approxBusyMinutes: summary.approxBusyMinutes,
      approxIdleMinutes: summary.approxIdleMinutes,
      approxWalkingFeet: summary.approxWalkingFeet,
      maxQueueDepth: summary.maxQueueDepth,
      warningCodes: [...summary.warningCodes]
    })),
    roomTimelineSummary: dryRun.roomTimelineSummaries.map((summary) => ({
      roomId: summary.roomId,
      assignedTaskCount: summary.assignedTaskCount,
      completedTaskCount: summary.completedTaskCount,
      deferredTaskCount: summary.deferredTaskCount,
      warningCodes: [...summary.warningCodes]
    })),
    deferredTaskSummary: {
      totalDeferredTaskCount: dryRun.deferredTaskCount,
      roomIdsWithDeferredTasks: dryRun.roomTimelineSummaries
        .filter((summary) => summary.deferredTaskCount > 0)
        .map((summary) => summary.roomId)
        .sort(),
      nurseIdsWithDeferredTasks: dryRun.nurseTimelineSummaries
        .filter((summary) => summary.deferredTaskCount > 0)
        .map((summary) => summary.nurseId)
        .sort()
    },
    queueDepthSummary: {
      maxQueueDepth,
      nurseIdsAtMaxQueueDepth: dryRun.nurseTimelineSummaries
        .filter((summary) => summary.maxQueueDepth === maxQueueDepth)
        .map((summary) => summary.nurseId)
        .sort()
    },
    walkingLoadSummary: {
      totalApproxWalkingFeet: roundPlan1Number(
        dryRun.nurseTimelineSummaries.reduce((total, summary) => total + summary.approxWalkingFeet, 0)
      ),
      pathBasedTaskCount: dryRun.pathBasedTaskCount,
      fallbackTaskCount: dryRun.fallbackTaskCount,
      missingRouteTaskCount: dryRun.missingRouteTaskCount,
      warningCodes: [...dryRun.walkingWarningCodes]
    },
    warningTimelineSummary: buildWarningSummary(dryRun),
    limitations: validatePlan1Limitations(dryRun.limitations, "timeline.limitations"),
    nonClaims: validatePlan1NonClaims(dryRun.nonClaims, "timeline.nonClaims"),
    syntheticDataOnly: true
  };
}

function buildWarningSummary(dryRun: Plan1ShiftDryRunOutput): Plan1TimelineViewModel["warningTimelineSummary"] {
  const rows: Plan1TimelineViewModel["warningTimelineSummary"] = [];
  appendWarnings(rows, dryRun.nurseTimelineSummaries.flatMap((summary) => summary.warningCodes), "nurse");
  appendWarnings(rows, dryRun.roomTimelineSummaries.flatMap((summary) => summary.warningCodes), "room");
  appendWarnings(rows, dryRun.walkingWarningCodes, "walking");
  return rows.sort((left, right) => left.source.localeCompare(right.source) || left.warningCode.localeCompare(right.warningCode));
}

function appendWarnings(
  rows: Plan1TimelineViewModel["warningTimelineSummary"],
  warningCodes: string[],
  source: "nurse" | "room" | "walking"
): void {
  for (const warningCode of [...new Set(warningCodes)].sort()) {
    rows.push({
      warningCode,
      count: warningCodes.filter((candidate) => candidate === warningCode).length,
      source
    });
  }
}
