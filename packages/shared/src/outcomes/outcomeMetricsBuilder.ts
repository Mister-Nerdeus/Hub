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

export const OPERATIONAL_OUTCOME_LIMITATIONS = [
  "Operational metric is operational-only and derived from validated simulation outputs.",
  "No clinical safety claim, clinical recommendation, PHI, patient identity, or EHR inference is represented.",
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
