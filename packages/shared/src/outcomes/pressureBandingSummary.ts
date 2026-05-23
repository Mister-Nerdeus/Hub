import {
  buildOperationalMetric,
  roundToTwo
} from "./outcomeMetricsBuilder.js";
import {
  OPERATIONAL_METRIC_GROUPS,
  OPERATIONAL_METRIC_SCOPES,
  validateMetricLimitations,
  validateOperationalMetricContracts,
  validateOperationalText,
  type OperationalMetricContract,
  type OperationalMetricGroup,
  type OperationalMetricScope
} from "./operationalMetricContract.js";

export const PRESSURE_BANDING_SCHEMA_VERSION = "1.0.0" as const;
export const PRESSURE_BAND_LABELS = ["low", "watch", "elevated", "compressed"] as const;

export type PressureBandLabel = (typeof PRESSURE_BAND_LABELS)[number];

export type PressureBandThreshold = {
  bandLabel: PressureBandLabel;
  bandValue: number;
  minInclusive: number;
  maxExclusive: number | null;
};

export type PressureBandedMetric = {
  metricId: string;
  label: string;
  sourceMetricId: string;
  group: OperationalMetricGroup;
  scope: OperationalMetricScope;
  sourceValue: number;
  bandLabel: PressureBandLabel;
  bandValue: number;
  thresholdMinInclusive: number;
  thresholdMaxExclusive: number | null;
};

export type PressureBandingSummary = {
  schemaVersion: typeof PRESSURE_BANDING_SCHEMA_VERSION;
  summaryLabel: string;
  thresholds: PressureBandThreshold[];
  bandedMetrics: PressureBandedMetric[];
  metrics: OperationalMetricContract[];
  limitations: string[];
};

type BuildPressureBandingSummaryInput = {
  metrics: OperationalMetricContract[];
  thresholds?: PressureBandThreshold[];
  limitations?: string[];
};

export const DEFAULT_PRESSURE_BAND_THRESHOLDS: PressureBandThreshold[] = [
  {
    bandLabel: "low",
    bandValue: 1,
    minInclusive: 0,
    maxExclusive: 25
  },
  {
    bandLabel: "watch",
    bandValue: 2,
    minInclusive: 25,
    maxExclusive: 50
  },
  {
    bandLabel: "elevated",
    bandValue: 3,
    minInclusive: 50,
    maxExclusive: 75
  },
  {
    bandLabel: "compressed",
    bandValue: 4,
    minInclusive: 75,
    maxExclusive: null
  }
];

const PRESSURE_BANDING_LIMITATIONS = [
  "Pressure bands are deterministic operational groupings based on numeric metric values.",
  "Band thresholds are explicit and applied without simulation execution.",
  "Band output is a comparison aid and does not alter source metric values."
];

export function buildPressureBandingSummary(
  input: BuildPressureBandingSummaryInput
): PressureBandingSummary {
  const sourceMetrics = validateOperationalMetricContracts(input.metrics);
  if (sourceMetrics.length === 0) {
    throw new Error("metrics requires at least one value");
  }

  const thresholds = validatePressureBandThresholds(
    input.thresholds ?? DEFAULT_PRESSURE_BAND_THRESHOLDS
  );
  const limitations = validateMetricLimitations(
    input.limitations ?? PRESSURE_BANDING_LIMITATIONS,
    "limitations"
  );

  const bandedMetrics = sourceMetrics.map((metric) => {
    const threshold = findPressureBand(metric.value, thresholds);
    return {
      metricId: `pressure_band_${toMetricIdSuffix(metric.metricId)}`,
      label: validateOperationalText(`Pressure band for ${metric.label}`, "pressureBand.label"),
      sourceMetricId: metric.metricId,
      group: metric.group,
      scope: metric.scope,
      sourceValue: roundToTwo(metric.value),
      bandLabel: threshold.bandLabel,
      bandValue: threshold.bandValue,
      thresholdMinInclusive: threshold.minInclusive,
      thresholdMaxExclusive: threshold.maxExclusive
    };
  });

  const maxBandValue = Math.max(...bandedMetrics.map((metric) => metric.bandValue));
  const upperBandCount = bandedMetrics.filter((metric) => metric.bandValue >= 3).length;

  const metrics: OperationalMetricContract[] = bandedMetrics.map((metric) =>
    buildOperationalMetric({
      metricId: metric.metricId,
      label: metric.label,
      group: metric.group,
      unit: "band",
      value: metric.bandValue,
      directionality: "lower_is_better",
      source: "derived_proxy",
      scope: metric.scope,
      limitations
    })
  );

  metrics.push(
    buildOperationalMetric({
      metricId: "overall_pressure_band",
      label: "Overall operational pressure band",
      group: "unit",
      unit: "band",
      value: maxBandValue,
      directionality: "lower_is_better",
      source: "derived_proxy",
      scope: "simulation",
      limitations
    })
  );

  metrics.push(
    buildOperationalMetric({
      metricId: "metrics_in_upper_pressure_bands",
      label: "Metrics in upper pressure bands",
      group: "unit",
      unit: "count",
      value: upperBandCount,
      directionality: "lower_is_better",
      source: "derived_proxy",
      scope: "simulation",
      limitations
    })
  );

  return validatePressureBandingSummary({
    schemaVersion: PRESSURE_BANDING_SCHEMA_VERSION,
    summaryLabel: "Operational pressure banding summary",
    thresholds,
    bandedMetrics,
    metrics,
    limitations
  });
}

export function validatePressureBandingSummary(value: unknown): PressureBandingSummary {
  const raw = requireRecord(value, "pressureBandingSummary");
  requireExactKeys(raw, "pressureBandingSummary", [
    "schemaVersion",
    "summaryLabel",
    "thresholds",
    "bandedMetrics",
    "metrics",
    "limitations"
  ]);

  const summary: PressureBandingSummary = {
    schemaVersion: requireLiteral(
      raw.schemaVersion,
      PRESSURE_BANDING_SCHEMA_VERSION,
      "schemaVersion"
    ),
    summaryLabel: validateOperationalText(raw.summaryLabel, "summaryLabel"),
    thresholds: validatePressureBandThresholds(requireArray(raw.thresholds, "thresholds")),
    bandedMetrics: requireArray(raw.bandedMetrics, "bandedMetrics").map((metric, index) =>
      validatePressureBandedMetric(metric, index)
    ),
    metrics: validateOperationalMetricContracts(raw.metrics),
    limitations: validateMetricLimitations(raw.limitations, "limitations")
  };

  if (summary.bandedMetrics.length === 0) {
    throw new Error("bandedMetrics requires at least one value");
  }

  const bandMetricIds = new Set(summary.bandedMetrics.map((metric) => metric.metricId));
  for (const metric of summary.metrics) {
    if (
      metric.metricId.startsWith("pressure_band_")
      && !bandMetricIds.has(metric.metricId)
    ) {
      throw new Error("metrics pressure band ids must map to bandedMetrics");
    }
  }

  return summary;
}

function findPressureBand(
  value: number,
  thresholds: PressureBandThreshold[]
): PressureBandThreshold {
  const normalized = Math.max(0, value);
  const threshold = thresholds.find((candidate) => {
    if (normalized < candidate.minInclusive) {
      return false;
    }
    return candidate.maxExclusive == null || normalized < candidate.maxExclusive;
  });

  if (threshold == null) {
    const fallback = thresholds[thresholds.length - 1];
    if (fallback == null) {
      throw new Error("thresholds requires at least one value");
    }
    return fallback;
  }
  return threshold;
}

function validatePressureBandThresholds(value: unknown): PressureBandThreshold[] {
  const thresholds = requireArray(value, "thresholds").map((item, index) =>
    validatePressureBandThreshold(item, index)
  );
  if (thresholds.length === 0) {
    throw new Error("thresholds requires at least one value");
  }

  for (let index = 0; index < thresholds.length; index += 1) {
    const threshold = thresholds[index];
    const prior = thresholds[index - 1];
    if (threshold == null) {
      throw new Error("thresholds cannot contain empty values");
    }
    if (prior != null && threshold.minInclusive < (prior.maxExclusive ?? prior.minInclusive)) {
      throw new Error("thresholds must be sorted by minInclusive");
    }
    if (index !== thresholds.length - 1 && threshold.maxExclusive == null) {
      throw new Error("only the final threshold may omit maxExclusive");
    }
  }

  return thresholds;
}

function validatePressureBandThreshold(value: unknown, index: number): PressureBandThreshold {
  const threshold = requireRecord(value, `thresholds[${index}]`);
  requireExactKeys(threshold, `thresholds[${index}]`, [
    "bandLabel",
    "bandValue",
    "minInclusive",
    "maxExclusive"
  ]);

  const minInclusive = requireNonNegativeNumber(
    threshold.minInclusive,
    `thresholds[${index}].minInclusive`
  );
  const maxExclusive =
    threshold.maxExclusive == null
      ? null
      : requirePositiveNumber(threshold.maxExclusive, `thresholds[${index}].maxExclusive`);

  if (maxExclusive != null && maxExclusive <= minInclusive) {
    throw new Error(`thresholds[${index}].maxExclusive must be greater than minInclusive`);
  }

  return {
    bandLabel: requireEnum(threshold.bandLabel, PRESSURE_BAND_LABELS, `thresholds[${index}].bandLabel`),
    bandValue: requirePositiveNumber(threshold.bandValue, `thresholds[${index}].bandValue`),
    minInclusive,
    maxExclusive
  };
}

function validatePressureBandedMetric(value: unknown, index: number): PressureBandedMetric {
  const metric = requireRecord(value, `bandedMetrics[${index}]`);
  requireExactKeys(metric, `bandedMetrics[${index}]`, [
    "metricId",
    "label",
    "sourceMetricId",
    "group",
    "scope",
    "sourceValue",
    "bandLabel",
    "bandValue",
    "thresholdMinInclusive",
    "thresholdMaxExclusive"
  ]);

  return {
    metricId: validateOperationalText(metric.metricId, `bandedMetrics[${index}].metricId`),
    label: validateOperationalText(metric.label, `bandedMetrics[${index}].label`),
    sourceMetricId: validateOperationalText(metric.sourceMetricId, `bandedMetrics[${index}].sourceMetricId`),
    group: requireEnum(metric.group, OPERATIONAL_METRIC_GROUPS, `bandedMetrics[${index}].group`),
    scope: requireEnum(metric.scope, OPERATIONAL_METRIC_SCOPES, `bandedMetrics[${index}].scope`),
    sourceValue: requireFiniteNumber(metric.sourceValue, `bandedMetrics[${index}].sourceValue`),
    bandLabel: requireEnum(metric.bandLabel, PRESSURE_BAND_LABELS, `bandedMetrics[${index}].bandLabel`),
    bandValue: requirePositiveNumber(metric.bandValue, `bandedMetrics[${index}].bandValue`),
    thresholdMinInclusive: requireNonNegativeNumber(
      metric.thresholdMinInclusive,
      `bandedMetrics[${index}].thresholdMinInclusive`
    ),
    thresholdMaxExclusive:
      metric.thresholdMaxExclusive == null
        ? null
        : requirePositiveNumber(
            metric.thresholdMaxExclusive,
            `bandedMetrics[${index}].thresholdMaxExclusive`
          )
  };
}

function toMetricIdSuffix(metricId: string): string {
  return metricId.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
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

function requirePositiveNumber(value: unknown, label: string): number {
  const numberValue = requireNonNegativeNumber(value, label);
  if (numberValue <= 0) {
    throw new Error(`${label} must be positive`);
  }
  return numberValue;
}

function requireNonNegativeNumber(value: unknown, label: string): number {
  const numberValue = requireFiniteNumber(value, label);
  if (numberValue < 0) {
    throw new Error(`${label} must be non-negative`);
  }
  return numberValue;
}

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}
