import {
  buildOperationalDeltaComparison,
  OPERATIONAL_METRIC_SCHEMA_VERSION,
  validateMetricLimitations
} from "@nerdeus/shared";
import type { OperationalDeltaComparisonContract } from "@nerdeus/shared";

import {
  allOperationalOutcomeMetricDirections,
  allOperationalOutcomeMetricIds,
  type OperationalOutcomeDashboardProofFixture,
  operationalOutcomeDashboardProofFixture
} from "../../fixtures/outcomes/operationalOutcomeDashboardProof";

type OperationalScenarioMetric = {
  metricId: string;
  label: string;
  unit: string;
  value: number;
  directionality: "lower_is_better" | "higher_is_better" | "neutral";
};

type OperationalScenarioFixture = {
  scenarioLabel: string;
  ratioLabel: "3_to_1" | "4_to_1";
  intensityLabel: "light" | "normal" | "busy" | "slammed";
  pressureBand: "low" | "moderate" | "high" | "critical";
  metrics: OperationalScenarioMetric[];
};

type OperationalMetricRow = {
  metricId: string;
  label: string;
  unit: string;
  threeToOneLight: number;
  fourToOneLight: number;
  threeToOneSlammed: number;
  fourToOneSlammed: number;
  ratioDeltaPercent: number;
  ratioDeltaDirection: OperationalDeltaComparisonContract["deltas"][number]["direction"];
  ratioDeltaAbsoluteChange: number;
};

type PressureBandTile = {
  scenario: string;
  band: "low" | "moderate" | "high" | "critical";
};

export type OperationalOutcomeDashboardViewModel = {
  proofTitle: string;
  proofBadge: string;
  ratioComparisonBaselineLabel: string;
  ratioComparisonModifiedLabel: string;
  intensityContrastLabel: string;
  metricCards: OperationalMetricRow[];
  ratioDelta: OperationalDeltaComparisonContract;
  pressureBands: PressureBandTile[];
  limitations: string[];
  jsonPreview: string;
};

export function createOperationalOutcomeDashboardViewModel(
  fixture: OperationalOutcomeDashboardProofFixture = operationalOutcomeDashboardProofFixture
): OperationalOutcomeDashboardViewModel {
  const limitations = validateMetricLimitations(fixture.limitations, "limitations");
  const ratioDelta = buildOperationalDeltaComparison({
    comparisonId: "outcome-dashboard-ratio-contrast",
    baselineLabel: fixture.ratioComparisonBaselineLabel,
    modifiedLabel: fixture.ratioComparisonModifiedLabel,
    baselineMetrics: fixture.threeToOneLight.metrics.map((metric) =>
      toOperationalMetricInput(metric, fixture.threeToOneLight.scenarioLabel)
    ),
    modifiedMetrics: fixture.fourToOneLight.metrics.map((metric) =>
      toOperationalMetricInput(metric, fixture.fourToOneLight.scenarioLabel)
    ),
    limitations
  });

  const rows = createMetricRows(
    fixture.threeToOneLight,
    fixture.fourToOneLight,
    fixture.threeToOneSlammed,
    fixture.fourToOneSlammed,
    ratioDelta
  );
  const pressureBands = [
    {
      scenario: fixture.threeToOneLight.scenarioLabel,
      band: fixture.threeToOneLight.pressureBand
    },
    {
      scenario: fixture.fourToOneLight.scenarioLabel,
      band: fixture.fourToOneLight.pressureBand
    },
    {
      scenario: fixture.threeToOneSlammed.scenarioLabel,
      band: fixture.threeToOneSlammed.pressureBand
    },
    {
      scenario: fixture.fourToOneSlammed.scenarioLabel,
      band: fixture.fourToOneSlammed.pressureBand
    }
  ];

  return {
    proofTitle: fixture.proofTitle,
    proofBadge: fixture.proofBadge,
    ratioComparisonBaselineLabel: fixture.ratioComparisonBaselineLabel,
    ratioComparisonModifiedLabel: fixture.ratioComparisonModifiedLabel,
    intensityContrastLabel: fixture.intensityContrastLabel,
    metricCards: rows,
    ratioDelta,
    pressureBands,
    limitations,
    jsonPreview: JSON.stringify({ ratioDelta, pressureBands }, null, 2)
  };
}

function toOperationalMetricInput(
  metric: OperationalScenarioMetric,
  scenarioLabel: string
) {
  return {
    schemaVersion: OPERATIONAL_METRIC_SCHEMA_VERSION,
    metricId: metric.metricId,
    label: `${metric.label} (${scenarioLabel})`,
    group: scenarioMetricGroup(metric.metricId),
    unit: metric.unit as "minutes" | "count" | "percent" | "score" | "feet" | "band",
    value: metric.value,
    directionality: metric.directionality,
    source: "derived_proxy" as const,
    scope: "comparison" as const,
    limitations: ["Operational-only dashboard contract input for deterministic contrast."]
  };
}

function scenarioMetricGroup(metricId: string): "nurse" | "patient_flow" | "task" | "unit" | "room" | "layout" {
  const lower = metricId.toLowerCase();
  if (lower.includes("nurse")) {
    return "nurse";
  }
  if (lower.includes("patient")) {
    return "patient_flow";
  }
  if (lower.includes("queue")) {
    return "task";
  }
  if (lower.includes("unit")) {
    return "unit";
  }
  if (lower.includes("room")) {
    return "room";
  }
  if (lower.includes("layout")) {
    return "layout";
  }
  return "task";
}

function createMetricRows(
  threeToOneLight: OperationalScenarioFixture,
  fourToOneLight: OperationalScenarioFixture,
  threeToOneSlammed: OperationalScenarioFixture,
  fourToOneSlammed: OperationalScenarioFixture,
  ratioDelta: OperationalDeltaComparisonContract
) {
  const rowByMetricId = new Map<string, OperationalMetricRow>();
  const light3Map = toMetricValueMap(threeToOneLight.metrics);
  const light4Map = toMetricValueMap(fourToOneLight.metrics);
  const slammed3Map = toMetricValueMap(threeToOneSlammed.metrics);
  const slammed4Map = toMetricValueMap(fourToOneSlammed.metrics);

  for (const metricId of allOperationalOutcomeMetricIds) {
    const threeToOneLightMetric = light3Map.get(metricId);
    const fourToOneLightMetric = light4Map.get(metricId);
    const threeToOneSlammedMetric = slammed3Map.get(metricId);
    const fourToOneSlammedMetric = slammed4Map.get(metricId);
    if (
      threeToOneLightMetric == null ||
      fourToOneLightMetric == null ||
      threeToOneSlammedMetric == null ||
      fourToOneSlammedMetric == null
    ) {
      throw new Error(`missing scenario metric in fixture: ${metricId}`);
    }
    const delta = ratioDelta.deltas.find((entry) => entry.metricId === metricId);
    if (delta == null) {
      throw new Error(`missing delta for metric: ${metricId}`);
    }
    rowByMetricId.set(metricId, {
      metricId,
      label: threeToOneLightMetric.label,
      unit: threeToOneLightMetric.unit,
      threeToOneLight: threeToOneLightMetric.value,
      fourToOneLight: fourToOneLightMetric.value,
      threeToOneSlammed: threeToOneSlammedMetric.value,
      fourToOneSlammed: fourToOneSlammedMetric.value,
      ratioDeltaPercent: delta.percentChange,
      ratioDeltaDirection: delta.direction,
      ratioDeltaAbsoluteChange: delta.absoluteChange
    });
  }

  return allOperationalOutcomeMetricIds
    .map((metricId) => rowByMetricId.get(metricId))
    .filter((row): row is OperationalMetricRow => row != null);
}

function toMetricValueMap(metrics: OperationalScenarioMetric[]) {
  const map = new Map<string, OperationalScenarioMetric>();
  for (const metric of metrics) {
    map.set(metric.metricId, metric);
  }
  return map;
}

export { allOperationalOutcomeMetricDirections };
