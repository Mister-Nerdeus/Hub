import {
  OPERATIONAL_METRIC_SCHEMA_VERSION,
  OPERATIONAL_METRIC_DIRECTIONALITY,
  type OperationalMetricContract,
  type OperationalMetricGroup,
  type OperationalMetricScope,
  type OperationalMetricSource,
  type OperationalMetricUnit,
  validateMetricLimitations,
  validateOperationalMetricContract
} from "./operationalMetricContract.js";
import {
  getOperationalMetricDefinition,
  validateMetricAgainstRegistry
} from "./operationalMetricRegistry.js";

export type OperationalMetricBuilderInput = {
  metricId: string;
  label: string;
  group: OperationalMetricGroup;
  unit: OperationalMetricUnit;
  value: number;
  directionality: (typeof OPERATIONAL_METRIC_DIRECTIONALITY)[number];
  source: OperationalMetricSource;
  scope: OperationalMetricScope;
  limitations?: string[];
};

export type RegisteredOperationalMetricBuilderInput = {
  metricId: string;
  value: number;
  label?: string;
  limitations?: string[];
};

export const OPERATIONAL_OUTCOME_LIMITATIONS = [
  "Operational metric is operational-only and derived from validated simulation outputs.",
  "No PHI, person identity field, external-system inference, or care-quality conclusion is represented.",
  "Assumptions are visible where derived aggregates include normalization or weighting."
];

export function buildOperationalMetric(
  input: OperationalMetricBuilderInput
): OperationalMetricContract {
  return validateOperationalMetricContract({
    schemaVersion: OPERATIONAL_METRIC_SCHEMA_VERSION,
    metricId: input.metricId,
    label: input.label,
    group: input.group,
    unit: input.unit,
    value: input.value,
    directionality: input.directionality,
    source: input.source,
    scope: input.scope,
    limitations: input.limitations ?? OPERATIONAL_OUTCOME_LIMITATIONS
  });
}

export function buildRegisteredOperationalMetric(
  input: RegisteredOperationalMetricBuilderInput
): OperationalMetricContract {
  const definition = getRequiredOperationalMetricDefinition(input.metricId);
  if (isDynamicMetricId(input.metricId, definition.canonicalMetricId)) {
    throw new Error(`registered operational metric must use a canonical metric ID or alias, not dynamic metric ${input.metricId}`);
  }
  return buildMetricFromDefinition({
    metricId: definition.canonicalMetricId,
    label: input.label ?? definition.label,
    value: input.value,
    limitations: input.limitations
  });
}

export function buildDynamicOperationalMetric(
  input: RegisteredOperationalMetricBuilderInput
): OperationalMetricContract {
  const definition = getRequiredOperationalMetricDefinition(input.metricId);
  if (!isDynamicMetricId(input.metricId, definition.canonicalMetricId)) {
    throw new Error(`dynamic operational metric must use a registered dynamic prefix for ${input.metricId}`);
  }
  return buildMetricFromDefinition({
    metricId: input.metricId,
    label: input.label,
    value: input.value,
    limitations: input.limitations
  });
}

export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sortedEntries(record: Record<string, number>): Array<[string, number]> {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

export function clampPercent(value: number): number {
  return Math.max(-100, Math.min(1000, roundToTwo(value)));
}

export function validateLimitationsSet(limitations: string[] | undefined): string[] {
  if (limitations != null && limitations.length > 0) {
    return validateMetricLimitations(limitations, "limitations");
  }
  return OPERATIONAL_OUTCOME_LIMITATIONS;
}

function buildMetricFromDefinition(
  input: RegisteredOperationalMetricBuilderInput
): OperationalMetricContract {
  const definition = getRequiredOperationalMetricDefinition(input.metricId);
  const metric = buildOperationalMetric({
    metricId: input.metricId,
    label: input.label ?? definition.label,
    group: definition.group,
    unit: definition.unit,
    value: input.value,
    directionality: definition.directionality,
    source: definition.source,
    scope: definition.scope,
    limitations: input.limitations
  });
  validateMetricAgainstRegistry(metric);
  return metric;
}

function getRequiredOperationalMetricDefinition(metricId: string) {
  const definition = getOperationalMetricDefinition(metricId);
  if (definition == null) {
    throw new Error(`registered operational metric is required for ${metricId}`);
  }
  return definition;
}

function isDynamicMetricId(metricId: string, canonicalMetricId: string): boolean {
  return metricId !== canonicalMetricId && metricId.startsWith(`${canonicalMetricId}_`);
}
