import {
  OPERATIONAL_METRIC_DIRECTIONALITY,
  validateMetricLimitations,
  validateOperationalMetricContracts,
  validateOperationalText,
  type OperationalMetricContract,
  type OperationalMetricDirectionality
} from "./operationalMetricContract.js";
import { roundToTwo } from "./outcomeMetricsBuilder.js";

export const OPERATIONAL_DELTA_COMPARISON_SCHEMA_VERSION = "1.0.0" as const;

export const OPERATIONAL_DELTA_DIRECTIONS = ["improved", "worse", "unchanged"] as const;

export type OperationalDeltaComparisonDirection = (typeof OPERATIONAL_DELTA_DIRECTIONS)[number];

export type OperationalMetricDelta = {
  metricId: string;
  directionality: OperationalMetricDirectionality;
  baselineValue: number;
  modifiedValue: number;
  absoluteChange: number;
  percentChange: number;
  direction: OperationalDeltaComparisonDirection;
};

export type OperationalDeltaComparisonContract = {
  schemaVersion: typeof OPERATIONAL_DELTA_COMPARISON_SCHEMA_VERSION;
  comparisonId: string;
  baselineLabel: string;
  modifiedLabel: string;
  deltas: OperationalMetricDelta[];
  limitations: string[];
};

type BuildOperationalDeltaComparisonInput = {
  comparisonId: string;
  baselineLabel: string;
  modifiedLabel: string;
  baselineMetrics: unknown[];
  modifiedMetrics: unknown[];
  limitations?: string[];
};

const OPERATIONAL_DELTA_LIMITATIONS = [
  "Operational delta comparison is deterministic across named baseline and modified metric sets.",
  "Comparison output uses signed absolute and percentage deltas with deterministic zero-baseline behavior.",
  "Directions are derived from Issue 117 metric directionality and value movement."
];

export function buildOperationalDeltaComparison(
  input: BuildOperationalDeltaComparisonInput
): OperationalDeltaComparisonContract {
  const baseline = validateOperationalMetricContracts(input.baselineMetrics);
  const modified = validateOperationalMetricContracts(input.modifiedMetrics);
  const baselineById = mapMetricsById(baseline);
  const modifiedById = mapMetricsById(modified);

  const baselineIds = [...baselineById.keys()];
  const modifiedIds = [...modifiedById.keys()];
  if (baselineIds.length !== modifiedIds.length) {
    throw new Error("metricIds must match between baseline and modified sets");
  }
  for (const metricId of baselineIds) {
    if (!modifiedById.has(metricId)) {
      throw new Error(`metricId mismatch: ${metricId} missing in modified metrics`);
    }
  }
  for (const metric of modified) {
    if (!baselineById.has(metric.metricId)) {
      throw new Error(`metricId mismatch: ${metric.metricId} missing in baseline metrics`);
    }
  }

  const deltas = baselineIds
    .sort()
    .map((metricId) => {
      const baseMetric = baselineById.get(metricId);
      const modifiedMetric = modifiedById.get(metricId);
      if (baseMetric == null || modifiedMetric == null) {
        throw new Error(`metricId mismatch for ${metricId}`);
      }
      if (baseMetric.directionality !== modifiedMetric.directionality) {
        throw new Error(`metric directionality must match for ${metricId}`);
      }

      return buildOperationalMetricDelta(baseMetric, modifiedMetric);
    })
    .sort((left, right) => left.metricId.localeCompare(right.metricId));

  return validateOperationalDeltaComparison({
    schemaVersion: OPERATIONAL_DELTA_COMPARISON_SCHEMA_VERSION,
    comparisonId: validateOperationalText(input.comparisonId, "comparisonId"),
    baselineLabel: validateOperationalText(input.baselineLabel, "baselineLabel"),
    modifiedLabel: validateOperationalText(input.modifiedLabel, "modifiedLabel"),
    deltas,
    limitations: validateMetricLimitations(input.limitations ?? OPERATIONAL_DELTA_LIMITATIONS, "limitations")
  });
}

function buildOperationalMetricDelta(
  baselineMetric: OperationalMetricContract,
  modifiedMetric: OperationalMetricContract
): OperationalMetricDelta {
  if (baselineMetric.directionality !== modifiedMetric.directionality) {
    throw new Error(`directionality mismatch for ${baselineMetric.metricId}`);
  }

  const absoluteChange = roundToTwo(modifiedMetric.value - baselineMetric.value);
  const percentChange = calculatePercentChange(
    baselineMetric.value,
    modifiedMetric.value
  );

  return {
    metricId: baselineMetric.metricId,
    directionality: baselineMetric.directionality,
    baselineValue: baselineMetric.value,
    modifiedValue: modifiedMetric.value,
    absoluteChange,
    percentChange,
    direction: determineDirection(
      absoluteChange,
      baselineMetric.directionality
    )
  };
}

function calculatePercentChange(
  baseline: number,
  modified: number
): number {
  if (baseline === 0) {
    if (modified === 0) {
      return 0;
    }
    return modified > 0 ? 100 : -100;
  }

  return roundToTwo(((modified - baseline) / baseline) * 100);
}

function determineDirection(
  absoluteChange: number,
  directionality: OperationalMetricDirectionality
): OperationalDeltaComparisonDirection {
  if (absoluteChange === 0) {
    return "unchanged";
  }

  if (directionality === "neutral") {
    return "unchanged";
  }

  if (directionality === "lower_is_better") {
    return absoluteChange < 0 ? "improved" : "worse";
  }

  return absoluteChange > 0 ? "improved" : "worse";
}

export function validateOperationalDeltaComparison(
  value: unknown
): OperationalDeltaComparisonContract {
  const raw = requireRecord(value, "operationalDeltaComparison");
  requireExactKeys(raw, "operationalDeltaComparison", [
    "schemaVersion",
    "comparisonId",
    "baselineLabel",
    "modifiedLabel",
    "deltas",
    "limitations"
  ]);

  const deltas = requireArray(raw.deltas, "deltas").map((delta, index) => validateOperationalMetricDelta(delta, index));
  const limitations = validateMetricLimitations(raw.limitations, "limitations");

  return {
    schemaVersion: requireLiteral(
      raw.schemaVersion,
      OPERATIONAL_DELTA_COMPARISON_SCHEMA_VERSION,
      "schemaVersion"
    ),
    comparisonId: validateOperationalText(raw.comparisonId, "comparisonId"),
    baselineLabel: validateOperationalText(raw.baselineLabel, "baselineLabel"),
    modifiedLabel: validateOperationalText(raw.modifiedLabel, "modifiedLabel"),
    deltas,
    limitations
  };
}

function validateOperationalMetricDelta(
  value: unknown,
  index: number
): OperationalMetricDelta {
  const metric = requireRecord(value, `deltas[${index}]`);
  requireExactKeys(metric, `deltas[${index}]`, [
    "metricId",
    "directionality",
    "baselineValue",
    "modifiedValue",
    "absoluteChange",
    "percentChange",
    "direction"
  ]);

  const direction = requireDeltaDirection(metric.direction, `deltas[${index}].direction`);
  const directionality = requireEnum(
    metric.directionality,
    OPERATIONAL_METRIC_DIRECTIONALITY,
    `deltas[${index}].directionality`
  );
  const baselineValue = requireFiniteNumber(metric.baselineValue, `deltas[${index}].baselineValue`);
  const modifiedValue = requireFiniteNumber(metric.modifiedValue, `deltas[${index}].modifiedValue`);
  const absoluteChange = requireFiniteNumber(metric.absoluteChange, `deltas[${index}].absoluteChange`);
  const percentChange = requireFiniteNumber(metric.percentChange, `deltas[${index}].percentChange`);
  const expected = roundToTwo(modifiedValue - baselineValue);
  if (absoluteChange !== expected) {
    throw new Error(`deltas[${index}].absoluteChange must equal modifiedValue - baselineValue`);
  }
  const expectedPercent = calculatePercentChange(baselineValue, modifiedValue);
  if (percentChange !== expectedPercent) {
    throw new Error(`deltas[${index}].percentChange must be derived from baselineValue and modifiedValue`);
  }

  const metricId = validateOperationalText(metric.metricId, `deltas[${index}].metricId`);
  const expectedDirection = determineDirection(absoluteChange, directionality);

  if (direction !== expectedDirection) {
    throw new Error(`deltas[${index}].direction must match directionality and value movement`);
  }

  return {
    metricId,
    directionality,
    baselineValue,
    modifiedValue,
    absoluteChange,
    percentChange,
    direction
  };
}

function mapMetricsById(metrics: OperationalMetricContract[]): Map<string, OperationalMetricContract> {
  const mapped = new Map<string, OperationalMetricContract>();
  for (const metric of metrics) {
    if (mapped.has(metric.metricId)) {
      throw new Error(`duplicate metricId ${metric.metricId} in input metrics`);
    }
    mapped.set(metric.metricId, metric);
  }
  return mapped;
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

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requireLiteral<T extends string>(
  value: unknown,
  expected: T,
  label: string
): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireDeltaDirection(
  value: unknown,
  label: string
): OperationalDeltaComparisonDirection {
  if (typeof value !== "string" || !OPERATIONAL_DELTA_DIRECTIONS.includes(value as OperationalDeltaComparisonDirection)) {
    throw new Error(`${label} must be one of ${OPERATIONAL_DELTA_DIRECTIONS.join(", ")}`);
  }
  return value as OperationalDeltaComparisonDirection;
}

function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
