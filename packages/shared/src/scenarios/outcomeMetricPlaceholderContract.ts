export const OUTCOME_PLACEHOLDER_SCHEMA_VERSION = "1.0.0" as const;
export const OUTCOME_PLACEHOLDER_SET_ID = "scenario-ratio-outcome-placeholders" as const;
export const OUTCOME_METRIC_PLACEHOLDER_IDS = [
  "nurse_workload_index",
  "room_coverage_burden",
  "walking_spread_burden",
  "high_acuity_concentration",
  "unassigned_occupied_rooms",
  "ratio_pressure_warning_count",
  "activity_pressure_score_placeholder"
] as const;

export type OutcomeMetricPlaceholderId = (typeof OUTCOME_METRIC_PLACEHOLDER_IDS)[number];

export type OutcomeMetricPlaceholder = {
  metricId: OutcomeMetricPlaceholderId;
  label: string;
  category: string;
  status: "placeholder";
  computed: false;
  simulationRequired: true;
  placeholderCopy: string;
  syntheticDataOnly: true;
};

export type OutcomeMetricPlaceholderSet = {
  schemaVersion: typeof OUTCOME_PLACEHOLDER_SCHEMA_VERSION;
  outcomePlaceholderSetId: typeof OUTCOME_PLACEHOLDER_SET_ID;
  metrics: OutcomeMetricPlaceholder[];
  syntheticDataOnly: true;
};
