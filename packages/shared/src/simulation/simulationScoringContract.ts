import type { SimulationRunContract } from "./simulationRunContract.js";
import { validateSimulationRunContract } from "./simulationRunContract.js";

export type SimulationScoringAssumptions = {
  delayedTaskWeight: number;
  missedTaskWeight: number;
  unassignedTaskWeight: number;
  queueWaitMinuteWeight: number;
  travelMinuteWeight: number;
  nurseBusyMinuteWeight: number;
};

export type SimulationScoreMetrics = {
  completedTaskCount: number;
  delayedTaskCount: number;
  missedTaskCount: number;
  unassignedTaskCount: number;
  queueWaitMinutes: number;
  travelMinutes: number;
  nurseBusyMinutes: Record<string, number>;
  totalNurseBusyMinutes: number;
  operationalBurdenScore: number;
};

export type SimulationScoreDefinition = {
  metricId: keyof SimulationScoreMetrics | "nurseBusyMinutesByNurse";
  source: string;
};

export type SimulationScoreContract = {
  schemaVersion: "1.0.0";
  simulationScoreId: string;
  simulationRunId: string;
  scenarioId: string;
  generatedTaskSetId: string;
  assignmentSetId: string;
  metrics: SimulationScoreMetrics;
  definitions: SimulationScoreDefinition[];
  assumptions: SimulationScoringAssumptions;
  limitations: string[];
};

const FORBIDDEN_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["safe", /\bsafe\b/i],
  ["unsafe", /\bunsafe\b/i],
  ["recommended", /\brecommended\b/i],
  ["best", /\bbest\b/i],
  ["clinically acceptable", /\bclinically acceptable\b/i]
];

export function validateSimulationScoreContract(
  value: unknown,
  simulationRun?: SimulationRunContract
): SimulationScoreContract {
  const score = requireRecord(value, "simulationScore");
  requireExactKeys(score, "simulationScore", [
    "schemaVersion",
    "simulationScoreId",
    "simulationRunId",
    "scenarioId",
    "generatedTaskSetId",
    "assignmentSetId",
    "metrics",
    "definitions",
    "assumptions",
    "limitations"
  ]);
  requireLiteral(score.schemaVersion, "1.0.0", "schemaVersion");
  const simulationScoreId = requireString(score.simulationScoreId, "simulationScoreId");
  const simulationRunId = requireString(score.simulationRunId, "simulationRunId");
  const scenarioId = requireString(score.scenarioId, "scenarioId");
  const generatedTaskSetId = requireString(score.generatedTaskSetId, "generatedTaskSetId");
  const assignmentSetId = requireString(score.assignmentSetId, "assignmentSetId");
  const metrics = validateSimulationScoreMetrics(score.metrics);
  const definitions = requireArray(score.definitions, "definitions").map(validateDefinition);
  if (definitions.length === 0) {
    throw new Error("definitions requires at least one entry");
  }
  const assumptions = validateAssumptions(score.assumptions);
  const limitations = requireArray(score.limitations, "limitations").map((limitation, index) =>
    validateOperationalText(limitation, `limitations[${index}]`)
  );
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }

  if (simulationRun != null) {
    const run = validateSimulationRunContract(simulationRun);
    if (simulationRunId !== run.simulationRunId) {
      throw new Error("simulationScore.simulationRunId must match simulation run");
    }
    if (scenarioId !== run.scenarioId) {
      throw new Error("simulationScore.scenarioId must match simulation run");
    }
    if (generatedTaskSetId !== run.generatedTaskSetId) {
      throw new Error("simulationScore.generatedTaskSetId must match simulation run");
    }
    if (assignmentSetId !== run.assignmentSetId) {
      throw new Error("simulationScore.assignmentSetId must match simulation run");
    }
    validateMetricsAgainstRun(metrics, run);
  }

  return {
    schemaVersion: "1.0.0",
    simulationScoreId,
    simulationRunId,
    scenarioId,
    generatedTaskSetId,
    assignmentSetId,
    metrics,
    definitions,
    assumptions,
    limitations
  };
}

function validateSimulationScoreMetrics(value: unknown): SimulationScoreMetrics {
  const metrics = requireRecord(value, "metrics");
  requireExactKeys(metrics, "metrics", [
    "completedTaskCount",
    "delayedTaskCount",
    "missedTaskCount",
    "unassignedTaskCount",
    "queueWaitMinutes",
    "travelMinutes",
    "nurseBusyMinutes",
    "totalNurseBusyMinutes",
    "operationalBurdenScore"
  ]);
  const nurseBusyMinutes = validateNumberRecord(metrics.nurseBusyMinutes, "nurseBusyMinutes");
  const totalNurseBusyMinutes = requireNumber(
    metrics.totalNurseBusyMinutes,
    "metrics.totalNurseBusyMinutes",
    0
  );
  const expectedTotalBusyMinutes = sumValues(nurseBusyMinutes);
  if (totalNurseBusyMinutes !== expectedTotalBusyMinutes) {
    throw new Error("metrics.totalNurseBusyMinutes must equal nurseBusyMinutes total");
  }
  return {
    completedTaskCount: requireInteger(
      metrics.completedTaskCount,
      "metrics.completedTaskCount",
      0
    ),
    delayedTaskCount: requireInteger(metrics.delayedTaskCount, "metrics.delayedTaskCount", 0),
    missedTaskCount: requireInteger(metrics.missedTaskCount, "metrics.missedTaskCount", 0),
    unassignedTaskCount: requireInteger(
      metrics.unassignedTaskCount,
      "metrics.unassignedTaskCount",
      0
    ),
    queueWaitMinutes: requireNumber(metrics.queueWaitMinutes, "metrics.queueWaitMinutes", 0),
    travelMinutes: requireNumber(metrics.travelMinutes, "metrics.travelMinutes", 0),
    nurseBusyMinutes,
    totalNurseBusyMinutes,
    operationalBurdenScore: requireNumber(
      metrics.operationalBurdenScore,
      "metrics.operationalBurdenScore",
      0
    )
  };
}

function validateDefinition(value: unknown, index: number): SimulationScoreDefinition {
  const definition = requireRecord(value, `definitions[${index}]`);
  requireExactKeys(definition, `definitions[${index}]`, ["metricId", "source"]);
  return {
    metricId: requireString(definition.metricId, `definitions[${index}].metricId`) as
      | keyof SimulationScoreMetrics
      | "nurseBusyMinutesByNurse",
    source: validateOperationalText(definition.source, `definitions[${index}].source`)
  };
}

function validateAssumptions(value: unknown): SimulationScoringAssumptions {
  const assumptions = requireRecord(value, "assumptions");
  requireExactKeys(assumptions, "assumptions", [
    "delayedTaskWeight",
    "missedTaskWeight",
    "unassignedTaskWeight",
    "queueWaitMinuteWeight",
    "travelMinuteWeight",
    "nurseBusyMinuteWeight"
  ]);
  return {
    delayedTaskWeight: requireNumber(assumptions.delayedTaskWeight, "delayedTaskWeight", 0),
    missedTaskWeight: requireNumber(assumptions.missedTaskWeight, "missedTaskWeight", 0),
    unassignedTaskWeight: requireNumber(assumptions.unassignedTaskWeight, "unassignedTaskWeight", 0),
    queueWaitMinuteWeight: requireNumber(
      assumptions.queueWaitMinuteWeight,
      "queueWaitMinuteWeight",
      0
    ),
    travelMinuteWeight: requireNumber(assumptions.travelMinuteWeight, "travelMinuteWeight", 0),
    nurseBusyMinuteWeight: requireNumber(
      assumptions.nurseBusyMinuteWeight,
      "nurseBusyMinuteWeight",
      0
    )
  };
}

function validateMetricsAgainstRun(metrics: SimulationScoreMetrics, run: SimulationRunContract): void {
  if (metrics.completedTaskCount !== run.summary.completedTaskCount) {
    throw new Error("metrics.completedTaskCount must match simulation run summary");
  }
  if (metrics.delayedTaskCount !== run.summary.delayedTaskCount) {
    throw new Error("metrics.delayedTaskCount must match simulation run summary");
  }
  if (metrics.missedTaskCount !== run.summary.missedTaskCount) {
    throw new Error("metrics.missedTaskCount must match simulation run summary");
  }
  if (metrics.unassignedTaskCount !== run.summary.unassignedTaskCount) {
    throw new Error("metrics.unassignedTaskCount must match simulation run summary");
  }
}

function validateNumberRecord(value: unknown, label: string): Record<string, number> {
  const record = requireRecord(value, label);
  return Object.fromEntries(
    Object.entries(record)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, requireNumber(item, `${label}.${key}`, 0)])
  );
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

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((total, value) => total + value, 0);
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
