import {
  OUTCOME_PLACEHOLDER_SCHEMA_VERSION,
  OUTCOME_PLACEHOLDER_SET_ID,
  type OutcomeMetricPlaceholder,
  type OutcomeMetricPlaceholderSet
} from "./outcomeMetricPlaceholderContract.js";

export const outcomeMetricPlaceholders: readonly OutcomeMetricPlaceholder[] = [
  {
    metricId: "nurse_workload_index",
    label: "Nurse workload index",
    category: "workload",
    status: "placeholder",
    computed: false,
    simulationRequired: true,
    placeholderCopy: "Pending future operational scenario run.",
    syntheticDataOnly: true
  },
  {
    metricId: "room_coverage_burden",
    label: "Room coverage burden",
    category: "coverage",
    status: "placeholder",
    computed: false,
    simulationRequired: true,
    placeholderCopy: "Pending future operational scenario run.",
    syntheticDataOnly: true
  },
  {
    metricId: "walking_spread_burden",
    label: "Walking/spread burden",
    category: "layout",
    status: "placeholder",
    computed: false,
    simulationRequired: true,
    placeholderCopy: "Pending future operational scenario run.",
    syntheticDataOnly: true
  },
  {
    metricId: "high_acuity_concentration",
    label: "High-acuity concentration",
    category: "acuity",
    status: "placeholder",
    computed: false,
    simulationRequired: true,
    placeholderCopy: "Pending future operational scenario run.",
    syntheticDataOnly: true
  },
  {
    metricId: "unassigned_occupied_rooms",
    label: "Unassigned occupied rooms",
    category: "coverage",
    status: "placeholder",
    computed: false,
    simulationRequired: true,
    placeholderCopy: "Pending future operational scenario run.",
    syntheticDataOnly: true
  },
  {
    metricId: "ratio_pressure_warning_count",
    label: "Ratio pressure warning count",
    category: "ratio-pressure",
    status: "placeholder",
    computed: false,
    simulationRequired: true,
    placeholderCopy: "Pending future operational scenario run.",
    syntheticDataOnly: true
  },
  {
    metricId: "activity_pressure_score_placeholder",
    label: "Activity pressure score placeholder",
    category: "activity",
    status: "placeholder",
    computed: false,
    simulationRequired: true,
    placeholderCopy: "Pending future operational scenario run.",
    syntheticDataOnly: true
  }
] as const;

export const outcomeMetricPlaceholderSet: OutcomeMetricPlaceholderSet = {
  schemaVersion: OUTCOME_PLACEHOLDER_SCHEMA_VERSION,
  outcomePlaceholderSetId: OUTCOME_PLACEHOLDER_SET_ID,
  metrics: [...outcomeMetricPlaceholders],
  syntheticDataOnly: true
};
