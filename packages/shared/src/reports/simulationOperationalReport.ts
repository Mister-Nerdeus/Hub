import type { SimulationRunContract } from "../simulation/simulationRunContract.js";
import { validateSimulationRunContract } from "../simulation/simulationRunContract.js";
import type { SimulationScoreContract } from "../simulation/simulationScoringContract.js";
import { validateSimulationScoreContract } from "../simulation/simulationScoringContract.js";

export type SimulationOperationalReportSummary = {
  completedTaskCount: number;
  delayedTaskCount: number;
  missedTaskCount: number;
  unassignedTaskCount: number;
  queueWaitMinutes: number;
  travelMinutes: number;
  operationalBurdenScore: number;
};

export type SimulationOperationalReportContract = {
  schemaVersion: "1.0.0";
  reportId: string;
  reportType: "simulation_operational_report";
  simulationRunId: string;
  simulationScoreId: string;
  scenarioId: string;
  generatedTaskSetId: string;
  assignmentSetId: string;
  summary: SimulationOperationalReportSummary;
  nurseWorkload: Array<{
    nurseId: string;
    busyMinutes: number;
  }>;
  limitations: string[];
};

export type BuildSimulationOperationalReportInput = {
  reportId?: string;
  simulationRun: SimulationRunContract;
  simulationScore: SimulationScoreContract;
};

export const SIMULATION_OPERATIONAL_REPORT_LIMITATIONS = [
  "Operational-only report derived from validated simulation run and score outputs.",
  "Report values mirror the source simulation score.",
  "No independent scoring logic, optimizer, API, persistence, or clinical claim is applied."
];

const FORBIDDEN_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["safe", /\bsafe\b/i],
  ["unsafe", /\bunsafe\b/i],
  ["recommended", /\brecommended\b/i],
  ["best", /\bbest\b/i],
  ["clinically acceptable", /\bclinically acceptable\b/i]
];

export function buildSimulationOperationalReport(
  input: BuildSimulationOperationalReportInput
): SimulationOperationalReportContract {
  const run = validateSimulationRunContract(input.simulationRun);
  const score = validateSimulationScoreContract(input.simulationScore, run);
  return validateSimulationOperationalReportContract(
    {
      schemaVersion: "1.0.0",
      reportId: input.reportId ?? `simulation-operational-report-${run.simulationRunId}`,
      reportType: "simulation_operational_report",
      simulationRunId: run.simulationRunId,
      simulationScoreId: score.simulationScoreId,
      scenarioId: run.scenarioId,
      generatedTaskSetId: run.generatedTaskSetId,
      assignmentSetId: run.assignmentSetId,
      summary: {
        completedTaskCount: score.metrics.completedTaskCount,
        delayedTaskCount: score.metrics.delayedTaskCount,
        missedTaskCount: score.metrics.missedTaskCount,
        unassignedTaskCount: score.metrics.unassignedTaskCount,
        queueWaitMinutes: score.metrics.queueWaitMinutes,
        travelMinutes: score.metrics.travelMinutes,
        operationalBurdenScore: score.metrics.operationalBurdenScore
      },
      nurseWorkload: Object.entries(score.metrics.nurseBusyMinutes)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([nurseId, busyMinutes]) => ({ nurseId, busyMinutes })),
      limitations: [...SIMULATION_OPERATIONAL_REPORT_LIMITATIONS]
    },
    { simulationRun: run, simulationScore: score }
  );
}

export function validateSimulationOperationalReportContract(
  value: unknown,
  context: {
    simulationRun?: SimulationRunContract;
    simulationScore?: SimulationScoreContract;
  } = {}
): SimulationOperationalReportContract {
  const report = requireRecord(value, "simulationOperationalReport");
  requireExactKeys(report, "simulationOperationalReport", [
    "schemaVersion",
    "reportId",
    "reportType",
    "simulationRunId",
    "simulationScoreId",
    "scenarioId",
    "generatedTaskSetId",
    "assignmentSetId",
    "summary",
    "nurseWorkload",
    "limitations"
  ]);
  requireLiteral(report.schemaVersion, "1.0.0", "schemaVersion");
  const reportId = requireString(report.reportId, "reportId");
  requireLiteral(report.reportType, "simulation_operational_report", "reportType");
  const simulationRunId = requireString(report.simulationRunId, "simulationRunId");
  const simulationScoreId = requireString(report.simulationScoreId, "simulationScoreId");
  const scenarioId = requireString(report.scenarioId, "scenarioId");
  const generatedTaskSetId = requireString(report.generatedTaskSetId, "generatedTaskSetId");
  const assignmentSetId = requireString(report.assignmentSetId, "assignmentSetId");
  const summary = validateSummary(report.summary);
  const nurseWorkload = requireArray(report.nurseWorkload, "nurseWorkload").map(
    validateNurseWorkload
  );
  const limitations = requireArray(report.limitations, "limitations").map((limitation, index) =>
    validateOperationalText(limitation, `limitations[${index}]`)
  );
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }

  if (context.simulationRun != null) {
    const run = validateSimulationRunContract(context.simulationRun);
    if (simulationRunId !== run.simulationRunId) {
      throw new Error("simulationRunId must match source simulation run");
    }
    if (scenarioId !== run.scenarioId) {
      throw new Error("scenarioId must match source simulation run");
    }
  }
  if (context.simulationScore != null) {
    const score = validateSimulationScoreContract(context.simulationScore, context.simulationRun);
    if (simulationScoreId !== score.simulationScoreId) {
      throw new Error("simulationScoreId must match source simulation score");
    }
    validateSummaryAgainstScore(summary, score);
    validateNurseWorkloadAgainstScore(nurseWorkload, score);
  }

  return {
    schemaVersion: "1.0.0",
    reportId,
    reportType: "simulation_operational_report",
    simulationRunId,
    simulationScoreId,
    scenarioId,
    generatedTaskSetId,
    assignmentSetId,
    summary,
    nurseWorkload,
    limitations
  };
}

function validateSummary(value: unknown): SimulationOperationalReportSummary {
  const summary = requireRecord(value, "summary");
  requireExactKeys(summary, "summary", [
    "completedTaskCount",
    "delayedTaskCount",
    "missedTaskCount",
    "unassignedTaskCount",
    "queueWaitMinutes",
    "travelMinutes",
    "operationalBurdenScore"
  ]);
  return {
    completedTaskCount: requireInteger(summary.completedTaskCount, "completedTaskCount", 0),
    delayedTaskCount: requireInteger(summary.delayedTaskCount, "delayedTaskCount", 0),
    missedTaskCount: requireInteger(summary.missedTaskCount, "missedTaskCount", 0),
    unassignedTaskCount: requireInteger(summary.unassignedTaskCount, "unassignedTaskCount", 0),
    queueWaitMinutes: requireNumber(summary.queueWaitMinutes, "queueWaitMinutes", 0),
    travelMinutes: requireNumber(summary.travelMinutes, "travelMinutes", 0),
    operationalBurdenScore: requireNumber(
      summary.operationalBurdenScore,
      "operationalBurdenScore",
      0
    )
  };
}

function validateNurseWorkload(value: unknown, index: number): { nurseId: string; busyMinutes: number } {
  const row = requireRecord(value, `nurseWorkload[${index}]`);
  requireExactKeys(row, `nurseWorkload[${index}]`, ["nurseId", "busyMinutes"]);
  return {
    nurseId: requireString(row.nurseId, `nurseWorkload[${index}].nurseId`),
    busyMinutes: requireNumber(row.busyMinutes, `nurseWorkload[${index}].busyMinutes`, 0)
  };
}

function validateSummaryAgainstScore(
  summary: SimulationOperationalReportSummary,
  score: SimulationScoreContract
): void {
  for (const key of Object.keys(summary) as Array<keyof SimulationOperationalReportSummary>) {
    if (summary[key] !== score.metrics[key]) {
      throw new Error(`summary.${key} must match source simulation score`);
    }
  }
}

function validateNurseWorkloadAgainstScore(
  workload: Array<{ nurseId: string; busyMinutes: number }>,
  score: SimulationScoreContract
): void {
  const expected = Object.entries(score.metrics.nurseBusyMinutes).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  if (workload.length !== expected.length) {
    throw new Error("nurseWorkload must match source simulation score");
  }
  workload.forEach((row, index) => {
    const expectedRow = expected[index];
    if (expectedRow == null) {
      throw new Error("nurseWorkload must match source simulation score");
    }
    const [nurseId, busyMinutes] = expectedRow;
    if (row.nurseId !== nurseId || row.busyMinutes !== busyMinutes) {
      throw new Error("nurseWorkload must match source simulation score");
    }
  });
}

function validateOperationalText(value: unknown, label: string): string {
  const text = requireString(value, label);
  for (const [name, pattern] of FORBIDDEN_TEXT_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`${label} must not include ${name} language`);
    }
  }
  return text;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireNumber(value: unknown, label: string, min?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  return value;
}

function requireInteger(value: unknown, label: string, min?: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}
