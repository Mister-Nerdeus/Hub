import type {
  BasicNurseTaskAssignmentResult,
  GeneratedOperationalTaskSetContract,
  ManualAssignmentContract,
  NurseOperationalSummary,
  NurseTaskAssignmentContract,
  OperationalReportContract,
  ReportTimelineSummary,
  ReportType,
  ReportUnassignedTaskSummary,
  ReportWarningSummary,
  ShiftScenarioContract,
  TaskTimelineSummary,
  Warning
} from "../contracts.js";
import {
  validateGeneratedOperationalTaskSet,
  validateManualAssignmentContract,
  validateNurseTaskAssignmentContract,
  validateOperationalReportContract,
  validateShiftScenarioContract
} from "../contracts.js";

export type OperationalReportBuilderInput = {
  scenario: ShiftScenarioContract;
  generatedTaskSet: GeneratedOperationalTaskSetContract;
  timelineSummary: TaskTimelineSummary;
  nurseTaskAssignmentResult: BasicNurseTaskAssignmentResult;
  manualAssignmentSet: ManualAssignmentContract;
};

export const OPERATIONAL_REPORT_CREATED_AT = "2026-05-22T00:00:00Z";

export const OPERATIONAL_REPORT_LIMITATIONS = [
  "Operational-only inspection summary based on synthetic Phase 5 task workload outputs.",
  "No optimizer or workload rebalancing is applied.",
  "No task-completion simulation is performed.",
  "No walking route calculation is performed.",
  "No delay calculation is performed."
];

export function buildOperationalSummaryReport(
  input: OperationalReportBuilderInput
): OperationalReportContract {
  return buildOperationalReport(input, "operational_summary", "Operational Summary Report");
}

export function buildOperationalReport(
  input: OperationalReportBuilderInput,
  reportType: ReportType,
  title: string
): OperationalReportContract {
  const prepared = prepareOperationalReportInput(input);
  const report: OperationalReportContract = {
    schemaVersion: "1.0.0",
    reportId: `${reportType.replaceAll("_", "-")}-${prepared.generatedTaskSet.generatedTaskSetId}`,
    reportType,
    scenarioId: prepared.scenario.scenarioId,
    generatedTaskSetId: prepared.generatedTaskSet.generatedTaskSetId,
    nurseTaskAssignmentSetId: prepared.nurseTaskAssignmentSet.nurseTaskAssignmentSetId,
    createdAt: OPERATIONAL_REPORT_CREATED_AT,
    title,
    summary: {
      totalGeneratedTasks: prepared.generatedTaskSet.generatedTasks.length,
      assignedTaskCount: prepared.nurseTaskAssignmentResult.assignedTaskCount,
      unassignedTaskCount: prepared.nurseTaskAssignmentResult.unassignedTaskCount,
      totalEstimatedTaskMinutes: prepared.generatedTaskSet.generatedTasks.reduce(
        (total, task) => total + task.estimatedDurationMinutes,
        0
      ),
      nurseCount: prepared.manualAssignmentSet.nurses.length,
      warningCount: prepared.nurseTaskAssignmentResult.warnings.length
    },
    nurseSummaries: buildNurseSummaries(prepared),
    timelineSummary: summarizeTimeline(prepared.timelineSummary),
    warningSummary: summarizeWarnings(prepared.nurseTaskAssignmentResult.warnings),
    unassignedTaskSummary: summarizeUnassignedTasks(
      prepared.generatedTaskSet,
      prepared.nurseTaskAssignmentSet
    ),
    limitations: [...OPERATIONAL_REPORT_LIMITATIONS]
  };

  return validateOperationalReportContract(report, {
    scenario: prepared.scenario,
    generatedTaskSet: prepared.generatedTaskSet,
    nurseTaskAssignmentSet: prepared.nurseTaskAssignmentSet,
    manualAssignmentSet: prepared.manualAssignmentSet,
    warnings: prepared.nurseTaskAssignmentResult.warnings
  });
}

function prepareOperationalReportInput(input: OperationalReportBuilderInput): {
  scenario: ShiftScenarioContract;
  generatedTaskSet: GeneratedOperationalTaskSetContract;
  timelineSummary: TaskTimelineSummary;
  nurseTaskAssignmentResult: BasicNurseTaskAssignmentResult;
  nurseTaskAssignmentSet: NurseTaskAssignmentContract;
  manualAssignmentSet: ManualAssignmentContract;
} {
  const scenario = validateShiftScenarioContract(input.scenario);
  const manualAssignmentSet = validateManualAssignmentContract(input.manualAssignmentSet);
  const generatedTaskSet = validateGeneratedOperationalTaskSet(input.generatedTaskSet, scenario);
  const nurseTaskAssignmentSet = validateNurseTaskAssignmentContract(
    input.nurseTaskAssignmentResult.assignmentSet,
    scenario,
    manualAssignmentSet,
    generatedTaskSet
  );

  validateTimelineSummary(input.timelineSummary, scenario, generatedTaskSet);
  validateAssignmentResultCounts(input.nurseTaskAssignmentResult, nurseTaskAssignmentSet);

  return {
    scenario,
    generatedTaskSet,
    timelineSummary: input.timelineSummary,
    nurseTaskAssignmentResult: input.nurseTaskAssignmentResult,
    nurseTaskAssignmentSet,
    manualAssignmentSet
  };
}

function validateTimelineSummary(
  timelineSummary: TaskTimelineSummary,
  scenario: ShiftScenarioContract,
  generatedTaskSet: GeneratedOperationalTaskSetContract
): void {
  if (timelineSummary.scenarioId !== scenario.scenarioId) {
    throw new Error("timelineSummary.scenarioId must match the scenario");
  }
  if (timelineSummary.generatedTaskSetId !== generatedTaskSet.generatedTaskSetId) {
    throw new Error("timelineSummary.generatedTaskSetId must match the generated task set");
  }
  if (timelineSummary.timestepMinutes !== scenario.timestepMinutes) {
    throw new Error("timelineSummary.timestepMinutes must match the scenario");
  }
  if (timelineSummary.shiftLengthMinutes !== scenario.shiftLengthMinutes) {
    throw new Error("timelineSummary.shiftLengthMinutes must match the scenario");
  }
  if (timelineSummary.totalTaskCount !== generatedTaskSet.generatedTasks.length) {
    throw new Error("timelineSummary.totalTaskCount must match generated tasks");
  }
  const totalEstimatedTaskMinutes = generatedTaskSet.generatedTasks.reduce(
    (total, task) => total + task.estimatedDurationMinutes,
    0
  );
  if (timelineSummary.totalEstimatedDurationMinutes !== totalEstimatedTaskMinutes) {
    throw new Error("timelineSummary.totalEstimatedDurationMinutes must match generated tasks");
  }
}

function validateAssignmentResultCounts(
  result: BasicNurseTaskAssignmentResult,
  assignmentSet: NurseTaskAssignmentContract
): void {
  const assignedTaskCount = assignmentSet.taskAssignments.filter(
    (assignment) => assignment.assignmentReason !== "unassigned"
  ).length;
  const unassignedTaskCount = assignmentSet.taskAssignments.filter(
    (assignment) => assignment.assignmentReason === "unassigned"
  ).length;
  if (result.assignedTaskCount !== assignedTaskCount) {
    throw new Error("nurseTaskAssignmentResult.assignedTaskCount must match assignmentSet");
  }
  if (result.unassignedTaskCount !== unassignedTaskCount) {
    throw new Error("nurseTaskAssignmentResult.unassignedTaskCount must match assignmentSet");
  }
}

function buildNurseSummaries(prepared: {
  manualAssignmentSet: ManualAssignmentContract;
  nurseTaskAssignmentResult: BasicNurseTaskAssignmentResult;
}): NurseOperationalSummary[] {
  return [...prepared.manualAssignmentSet.nurses]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((nurse) => ({
      nurseId: nurse.id,
      assignedTaskCount: prepared.nurseTaskAssignmentResult.perNurseTaskCounts[nurse.id] ?? 0,
      estimatedTaskMinutes:
        prepared.nurseTaskAssignmentResult.perNurseEstimatedMinutes[nurse.id] ?? 0,
      warningCount: prepared.nurseTaskAssignmentResult.warnings.filter((warning) =>
        warning.nurseIds?.includes(nurse.id)
      ).length
    }));
}

function summarizeTimeline(timelineSummary: TaskTimelineSummary): ReportTimelineSummary {
  let busiestMinute: number | null = null;
  let busiestMinuteTaskCount = 0;
  for (const bucket of [...timelineSummary.buckets].sort((left, right) => left.minute - right.minute)) {
    if (bucket.taskCount > busiestMinuteTaskCount) {
      busiestMinute = bucket.minute;
      busiestMinuteTaskCount = bucket.taskCount;
    }
  }

  return {
    bucketCount: timelineSummary.buckets.length,
    busiestMinute,
    busiestMinuteTaskCount,
    totalInterruptiveTasks: timelineSummary.buckets.reduce(
      (total, bucket) => total + bucket.interruptiveTaskCount,
      0
    )
  };
}

function summarizeWarnings(warnings: Warning[]): ReportWarningSummary {
  const warningCodes: Record<string, number> = {};
  const summary: ReportWarningSummary = {
    infoCount: 0,
    warningCount: 0,
    criticalCount: 0,
    warningCodes
  };

  for (const warning of [...warnings].sort((left, right) => left.id.localeCompare(right.id))) {
    if (warning.severity === "info") {
      summary.infoCount += 1;
    }
    if (warning.severity === "warning") {
      summary.warningCount += 1;
    }
    if (warning.severity === "critical") {
      summary.criticalCount += 1;
    }
    warningCodes[warning.code] = (warningCodes[warning.code] ?? 0) + 1;
  }

  return {
    ...summary,
    warningCodes: Object.fromEntries(
      Object.entries(warningCodes).sort(([left], [right]) => left.localeCompare(right))
    )
  };
}

function summarizeUnassignedTasks(
  generatedTaskSet: GeneratedOperationalTaskSetContract,
  assignmentSet: NurseTaskAssignmentContract
): ReportUnassignedTaskSummary {
  const generatedTaskById = new Map(generatedTaskSet.generatedTasks.map((task) => [task.id, task]));
  const taskIds = assignmentSet.taskAssignments
    .filter((assignment) => assignment.assignmentReason === "unassigned")
    .map((assignment) => assignment.taskId)
    .sort();
  const roomIds = [
    ...new Set(taskIds.map((taskId) => generatedTaskById.get(taskId)?.roomId).filter(isString))
  ].sort();

  return {
    unassignedTaskCount: taskIds.length,
    taskIds,
    roomIds
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
