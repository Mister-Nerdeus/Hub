import {
  OUTCOME_METRIC_PLACEHOLDER_IDS,
  OUTCOME_PLACEHOLDER_SCHEMA_VERSION,
  OUTCOME_PLACEHOLDER_SET_ID,
  type OutcomeMetricPlaceholder,
  type OutcomeMetricPlaceholderSet
} from "./outcomeMetricPlaceholderContract.js";
import {
  assertScenarioUnique,
  requireScenarioArray,
  requireScenarioBoolean,
  requireScenarioEnum,
  requireScenarioExactKeys,
  requireScenarioLiteralTrue,
  requireScenarioRecord,
  requireScenarioString
} from "./scenarioValidationUtils.js";

const placeholderKeys = [
  "metricId",
  "label",
  "category",
  "status",
  "computed",
  "simulationRequired",
  "placeholderCopy",
  "syntheticDataOnly"
] as const;
const placeholderSetKeys = [
  "schemaVersion",
  "outcomePlaceholderSetId",
  "metrics",
  "syntheticDataOnly"
] as const;

export function validateOutcomeMetricPlaceholder(value: unknown, index = 0): OutcomeMetricPlaceholder {
  const label = `outcomePlaceholder.metrics[${index}]`;
  const record = requireScenarioRecord(value, label);
  requireScenarioExactKeys(record, label, placeholderKeys);
  if (record.status !== "placeholder") {
    throw new Error(`${label}.status must remain placeholder`);
  }
  if (requireScenarioBoolean(record.computed, `${label}.computed`) !== false) {
    throw new Error(`${label}.computed must remain false`);
  }
  if (record.simulationRequired !== true) {
    throw new Error(`${label}.simulationRequired must remain true`);
  }
  return {
    metricId: requireScenarioEnum(record.metricId, OUTCOME_METRIC_PLACEHOLDER_IDS, `${label}.metricId`),
    label: requireScenarioString(record.label, `${label}.label`),
    category: requireScenarioString(record.category, `${label}.category`),
    status: "placeholder",
    computed: false,
    simulationRequired: true,
    placeholderCopy: requireScenarioString(record.placeholderCopy, `${label}.placeholderCopy`),
    syntheticDataOnly: requireScenarioLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validateOutcomeMetricPlaceholderSet(value: unknown): OutcomeMetricPlaceholderSet {
  const record = requireScenarioRecord(value, "outcomePlaceholderSet");
  requireScenarioExactKeys(record, "outcomePlaceholderSet", placeholderSetKeys);
  if (record.schemaVersion !== OUTCOME_PLACEHOLDER_SCHEMA_VERSION) {
    throw new Error("outcomePlaceholderSet.schemaVersion is unsupported");
  }
  if (record.outcomePlaceholderSetId !== OUTCOME_PLACEHOLDER_SET_ID) {
    throw new Error("outcomePlaceholderSet.outcomePlaceholderSetId is unsupported");
  }
  const metrics = requireScenarioArray(record.metrics, "outcomePlaceholderSet.metrics").map(
    validateOutcomeMetricPlaceholder
  );
  assertScenarioUnique(metrics.map((metric) => metric.metricId), "outcome metric IDs");
  return {
    schemaVersion: OUTCOME_PLACEHOLDER_SCHEMA_VERSION,
    outcomePlaceholderSetId: OUTCOME_PLACEHOLDER_SET_ID,
    metrics,
    syntheticDataOnly: requireScenarioLiteralTrue(record.syntheticDataOnly, "outcomePlaceholderSet.syntheticDataOnly")
  };
}
