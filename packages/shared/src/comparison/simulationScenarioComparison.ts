import type { SimulationOperationalReportContract } from "../reports/simulationOperationalReport.js";
import { validateSimulationOperationalReportContract } from "../reports/simulationOperationalReport.js";

export type SimulationScenarioComparisonItem = {
  reportId: string;
  simulationRunId: string;
  scenarioId: string;
  isBaseline: boolean;
  completedTaskCount: number;
  delayedTaskCount: number;
  missedTaskCount: number;
  unassignedTaskCount: number;
  queueWaitMinutes: number;
  travelMinutes: number;
  operationalBurdenScore: number;
};

export type SimulationScenarioComparisonSummary = {
  reportCount: number;
  baselineReportId: string;
  maxDelayedTaskCount: number;
  maxMissedTaskCount: number;
  maxUnassignedTaskCount: number;
  maxQueueWaitMinutes: number;
  maxTravelMinutes: number;
  maxOperationalBurdenScore: number;
};

export type SimulationScenarioComparisonContract = {
  schemaVersion: "1.0.0";
  comparisonId: string;
  comparisonType: "simulation_report_comparison";
  baselineReportId: string;
  reportIds: string[];
  items: SimulationScenarioComparisonItem[];
  summary: SimulationScenarioComparisonSummary;
  limitations: string[];
};

export type BuildSimulationScenarioComparisonInput = {
  comparisonId: string;
  baselineReportId: string;
  reports: SimulationOperationalReportContract[];
};

export const SIMULATION_SCENARIO_COMPARISON_LIMITATIONS = [
  "Operational-only comparison of simulation-derived reports.",
  "Baseline report remains first for deterministic review.",
  "No optimizer, scenario recommendation, or clinical claim is applied."
];

const FORBIDDEN_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["safe", /\bsafe\b/i],
  ["unsafe", /\bunsafe\b/i],
  ["recommended", /\brecommended\b/i],
  ["best", /\bbest\b/i]
];

export function buildSimulationScenarioComparison(
  input: BuildSimulationScenarioComparisonInput
): SimulationScenarioComparisonContract {
  if (input.reports.length === 0) {
    throw new Error("reports requires at least one simulation operational report");
  }
  const reports = input.reports.map((report) => validateSimulationOperationalReportContract(report));
  const baseline = reports.find((report) => report.reportId === input.baselineReportId);
  if (baseline == null) {
    throw new Error("baselineReportId must reference an included report");
  }
  const orderedReports = [
    baseline,
    ...reports
      .filter((report) => report.reportId !== baseline.reportId)
      .sort((left, right) => left.reportId.localeCompare(right.reportId))
  ];
  const items = orderedReports.map((report) => buildItem(report, report.reportId === baseline.reportId));
  return validateSimulationScenarioComparisonContract(
    {
      schemaVersion: "1.0.0",
      comparisonId: input.comparisonId,
      comparisonType: "simulation_report_comparison",
      baselineReportId: baseline.reportId,
      reportIds: orderedReports.map((report) => report.reportId),
      items,
      summary: summarizeItems(items, baseline.reportId),
      limitations: [...SIMULATION_SCENARIO_COMPARISON_LIMITATIONS]
    },
    { reports: orderedReports }
  );
}

export function validateSimulationScenarioComparisonContract(
  value: unknown,
  context: { reports?: SimulationOperationalReportContract[] } = {}
): SimulationScenarioComparisonContract {
  const comparison = requireRecord(value, "simulationScenarioComparison");
  requireExactKeys(comparison, "simulationScenarioComparison", [
    "schemaVersion",
    "comparisonId",
    "comparisonType",
    "baselineReportId",
    "reportIds",
    "items",
    "summary",
    "limitations"
  ]);
  requireLiteral(comparison.schemaVersion, "1.0.0", "schemaVersion");
  const comparisonId = requireString(comparison.comparisonId, "comparisonId");
  requireLiteral(comparison.comparisonType, "simulation_report_comparison", "comparisonType");
  const baselineReportId = requireString(comparison.baselineReportId, "baselineReportId");
  const reportIds = validateStringArray(comparison.reportIds, "reportIds");
  if (reportIds[0] !== baselineReportId) {
    throw new Error("baseline report must remain first");
  }
  const items = requireArray(comparison.items, "items").map(validateItem);
  if (!sameStringArray(items.map((item) => item.reportId), reportIds)) {
    throw new Error("items must match reportIds");
  }
  const summary = validateSummary(comparison.summary);
  validateSummaryAgainstItems(summary, items, baselineReportId);
  const limitations = requireArray(comparison.limitations, "limitations").map((limitation, index) =>
    validateOperationalText(limitation, `limitations[${index}]`)
  );
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  if (context.reports != null) {
    validateAgainstReports(items, context.reports);
  }
  return {
    schemaVersion: "1.0.0",
    comparisonId,
    comparisonType: "simulation_report_comparison",
    baselineReportId,
    reportIds,
    items,
    summary,
    limitations
  };
}

function buildItem(
  report: SimulationOperationalReportContract,
  isBaseline: boolean
): SimulationScenarioComparisonItem {
  return {
    reportId: report.reportId,
    simulationRunId: report.simulationRunId,
    scenarioId: report.scenarioId,
    isBaseline,
    completedTaskCount: report.summary.completedTaskCount,
    delayedTaskCount: report.summary.delayedTaskCount,
    missedTaskCount: report.summary.missedTaskCount,
    unassignedTaskCount: report.summary.unassignedTaskCount,
    queueWaitMinutes: report.summary.queueWaitMinutes,
    travelMinutes: report.summary.travelMinutes,
    operationalBurdenScore: report.summary.operationalBurdenScore
  };
}

function summarizeItems(
  items: SimulationScenarioComparisonItem[],
  baselineReportId: string
): SimulationScenarioComparisonSummary {
  return {
    reportCount: items.length,
    baselineReportId,
    maxDelayedTaskCount: Math.max(...items.map((item) => item.delayedTaskCount)),
    maxMissedTaskCount: Math.max(...items.map((item) => item.missedTaskCount)),
    maxUnassignedTaskCount: Math.max(...items.map((item) => item.unassignedTaskCount)),
    maxQueueWaitMinutes: Math.max(...items.map((item) => item.queueWaitMinutes)),
    maxTravelMinutes: Math.max(...items.map((item) => item.travelMinutes)),
    maxOperationalBurdenScore: Math.max(...items.map((item) => item.operationalBurdenScore))
  };
}

function validateItem(value: unknown, index: number): SimulationScenarioComparisonItem {
  const item = requireRecord(value, `items[${index}]`);
  requireExactKeys(item, `items[${index}]`, [
    "reportId",
    "simulationRunId",
    "scenarioId",
    "isBaseline",
    "completedTaskCount",
    "delayedTaskCount",
    "missedTaskCount",
    "unassignedTaskCount",
    "queueWaitMinutes",
    "travelMinutes",
    "operationalBurdenScore"
  ]);
  return {
    reportId: requireString(item.reportId, `items[${index}].reportId`),
    simulationRunId: requireString(item.simulationRunId, `items[${index}].simulationRunId`),
    scenarioId: requireString(item.scenarioId, `items[${index}].scenarioId`),
    isBaseline: requireBoolean(item.isBaseline, `items[${index}].isBaseline`),
    completedTaskCount: requireInteger(item.completedTaskCount, `items[${index}].completedTaskCount`, 0),
    delayedTaskCount: requireInteger(item.delayedTaskCount, `items[${index}].delayedTaskCount`, 0),
    missedTaskCount: requireInteger(item.missedTaskCount, `items[${index}].missedTaskCount`, 0),
    unassignedTaskCount: requireInteger(
      item.unassignedTaskCount,
      `items[${index}].unassignedTaskCount`,
      0
    ),
    queueWaitMinutes: requireNumber(item.queueWaitMinutes, `items[${index}].queueWaitMinutes`, 0),
    travelMinutes: requireNumber(item.travelMinutes, `items[${index}].travelMinutes`, 0),
    operationalBurdenScore: requireNumber(
      item.operationalBurdenScore,
      `items[${index}].operationalBurdenScore`,
      0
    )
  };
}

function validateSummary(value: unknown): SimulationScenarioComparisonSummary {
  const summary = requireRecord(value, "summary");
  requireExactKeys(summary, "summary", [
    "reportCount",
    "baselineReportId",
    "maxDelayedTaskCount",
    "maxMissedTaskCount",
    "maxUnassignedTaskCount",
    "maxQueueWaitMinutes",
    "maxTravelMinutes",
    "maxOperationalBurdenScore"
  ]);
  return {
    reportCount: requireInteger(summary.reportCount, "summary.reportCount", 1),
    baselineReportId: requireString(summary.baselineReportId, "summary.baselineReportId"),
    maxDelayedTaskCount: requireInteger(summary.maxDelayedTaskCount, "summary.maxDelayedTaskCount", 0),
    maxMissedTaskCount: requireInteger(summary.maxMissedTaskCount, "summary.maxMissedTaskCount", 0),
    maxUnassignedTaskCount: requireInteger(
      summary.maxUnassignedTaskCount,
      "summary.maxUnassignedTaskCount",
      0
    ),
    maxQueueWaitMinutes: requireNumber(summary.maxQueueWaitMinutes, "summary.maxQueueWaitMinutes", 0),
    maxTravelMinutes: requireNumber(summary.maxTravelMinutes, "summary.maxTravelMinutes", 0),
    maxOperationalBurdenScore: requireNumber(
      summary.maxOperationalBurdenScore,
      "summary.maxOperationalBurdenScore",
      0
    )
  };
}

function validateSummaryAgainstItems(
  summary: SimulationScenarioComparisonSummary,
  items: SimulationScenarioComparisonItem[],
  baselineReportId: string
): void {
  const expected = summarizeItems(items, baselineReportId);
  for (const key of Object.keys(expected) as Array<keyof SimulationScenarioComparisonSummary>) {
    if (summary[key] !== expected[key]) {
      throw new Error(`summary.${key} must derive from comparison items`);
    }
  }
}

function validateAgainstReports(
  items: SimulationScenarioComparisonItem[],
  reports: SimulationOperationalReportContract[]
): void {
  const reportById = new Map(
    reports.map((report) => [
      report.reportId,
      validateSimulationOperationalReportContract(report)
    ])
  );
  for (const item of items) {
    const report = reportById.get(item.reportId);
    if (report == null) {
      throw new Error("items must reference included reports");
    }
    if (item.simulationRunId !== report.simulationRunId) {
      throw new Error("item simulationRunId must match report");
    }
  }
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

function sameStringArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateStringArray(value: unknown, label: string): string[] {
  const values = requireArray(value, label).map((item, index) =>
    requireString(item, `${label}[${index}]`)
  );
  requireUnique(label, values);
  return values;
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

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireUnique(label: string, values: string[]): Set<string> {
  const valueSet = new Set(values);
  if (valueSet.size !== values.length) {
    throw new Error(`duplicate ${label} are not allowed`);
  }
  return valueSet;
}
