export const OPERATIONAL_METRIC_SCHEMA_VERSION = "1.0.0" as const;

export const OPERATIONAL_METRIC_GROUPS = [
  "nurse",
  "patient_flow",
  "task",
  "room",
  "layout",
  "ratio",
  "unit",
  "comparison"
] as const;

export const OPERATIONAL_METRIC_UNITS = [
  "minutes",
  "feet",
  "count",
  "percent",
  "score",
  "band"
] as const;

export const OPERATIONAL_METRIC_DIRECTIONALITY = [
  "lower_is_better",
  "higher_is_better",
  "neutral"
] as const;

export const OPERATIONAL_METRIC_SOURCES = [
  "task_event",
  "nurse_event",
  "queue_event",
  "travel_event",
  "simulation_score",
  "scenario_assumption",
  "derived_proxy",
  "comparison_delta"
] as const;

export const OPERATIONAL_METRIC_SCOPES = [
  "simulation",
  "nurse",
  "task",
  "scenario",
  "layout",
  "comparison",
  "room"
] as const;

export type OperationalMetricGroup = (typeof OPERATIONAL_METRIC_GROUPS)[number];
export type OperationalMetricUnit = (typeof OPERATIONAL_METRIC_UNITS)[number];
export type OperationalMetricDirectionality = (typeof OPERATIONAL_METRIC_DIRECTIONALITY)[number];
export type OperationalMetricSource = (typeof OPERATIONAL_METRIC_SOURCES)[number];
export type OperationalMetricScope = (typeof OPERATIONAL_METRIC_SCOPES)[number];

export type OperationalMetricContract = {
  schemaVersion: typeof OPERATIONAL_METRIC_SCHEMA_VERSION;
  metricId: string;
  label: string;
  group: OperationalMetricGroup;
  unit: OperationalMetricUnit;
  value: number;
  directionality: OperationalMetricDirectionality;
  source: OperationalMetricSource;
  scope: OperationalMetricScope;
  limitations: string[];
};

const FORBIDDEN_PROVENANCE_WORDS = [
  "patient satisfaction",
  "nurse satisfaction",
  "clinical outcome",
  "safe staffing",
  "unsafe staffing",
  "diagnosis",
  "ehr",
  "patient identity",
  "patient safety",
  "clinical safety",
  "recommendation",
  "best layout",
  "unsafe",
  "safe"
];

export function validateOperationalMetricContract(
  value: unknown,
  _context: { metricIdPrefix?: string } = {}
): OperationalMetricContract {
  const raw = requireRecord(value, "operationalMetric");
  requireExactKeys(raw, "operationalMetric", [
    "schemaVersion",
    "metricId",
    "label",
    "group",
    "unit",
    "value",
    "directionality",
    "source",
    "scope",
    "limitations"
  ]);

  const contract: OperationalMetricContract = {
    schemaVersion: requireLiteral(raw.schemaVersion, OPERATIONAL_METRIC_SCHEMA_VERSION, "schemaVersion"),
    metricId: requireString(raw.metricId, "metricId"),
    label: validateOperationalText(raw.label, "label"),
    group: requireEnum(raw.group, OPERATIONAL_METRIC_GROUPS, "group"),
    unit: requireEnum(raw.unit, OPERATIONAL_METRIC_UNITS, "unit"),
    value: requireFiniteNumber(raw.value, "value"),
    directionality: requireEnum(raw.directionality, OPERATIONAL_METRIC_DIRECTIONALITY, "directionality"),
    source: requireEnum(raw.source, OPERATIONAL_METRIC_SOURCES, "source"),
    scope: requireEnum(raw.scope, OPERATIONAL_METRIC_SCOPES, "scope"),
    limitations: requireArray(raw.limitations, "limitations").map((limitation, index) =>
      validateOperationalText(limitation, `limitations[${index}]`)
    )
  };

  if (contract.limitations.length === 0) {
    throw new Error("limitations requires at least one value");
  }

  return contract;
}

export function validateOperationalMetricContracts(
  value: unknown
): OperationalMetricContract[] {
  const metrics = requireArray(value, "operationalMetrics");
  const normalized = metrics.map((metric) => validateOperationalMetricContract(metric));
  const metricIds = normalized.map((metric) => metric.metricId);
  if (new Set(metricIds).size !== metricIds.length) {
    throw new Error("operationalMetrics metricId must be unique");
  }
  return normalized;
}

export function validateMetricLimitations(value: unknown, label: string): string[] {
  const limitations = requireArray(value, label).map((item, index) =>
    validateOperationalText(item, `${label}[${index}]`)
  );
  if (limitations.length === 0) {
    throw new Error(`${label} requires at least one limitation`);
  }
  return limitations;
}

export function validateOperationalText(value: unknown, label: string): string {
  const text = requireString(value, label);
  const normalized = text.toLowerCase();
  if (FORBIDDEN_PROVENANCE_WORDS.some((word) => normalized.includes(word))) {
    throw new Error(`${label} must avoid operational-only forbidden wording`);
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

function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string
): T {
  if (typeof value !== "string") {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  if (!allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
