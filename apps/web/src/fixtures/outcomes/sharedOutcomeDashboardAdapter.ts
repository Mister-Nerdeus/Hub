import {
  OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS,
  operationalOutcomeDashboardProofData
} from "@nerdeus/shared";
import type {
  OperationalDeltaComparisonContract,
  OperationalMetricDirectionality,
  OperationalMetricGroup,
  OperationalOutcomeDashboardProofData,
  OperationalOutcomeDashboardProofScenario
} from "@nerdeus/shared";

type OperationalOutcomeMetricDirectionality = OperationalMetricDirectionality;

type ScenarioPressureBand = "low" | "moderate" | "high" | "critical";

type OperationalOutcomeScenarioMetric = {
  metricId: string;
  label: string;
  group: OperationalMetricGroup;
  unit: string;
  value: number;
  directionality: OperationalOutcomeMetricDirectionality;
};

export type OperationalOutcomeScenarioFixture = {
  scenarioLabel: string;
  ratioLabel: "3_to_1" | "4_to_1";
  intensityLabel: "light" | "normal" | "busy" | "slammed";
  pressureBand: ScenarioPressureBand;
  metrics: OperationalOutcomeScenarioMetric[];
};

export type OperationalOutcomeDashboardProofFixture = {
  sourcePackage: "@nerdeus/shared";
  sourceDataId: string;
  proofTitle: string;
  proofBadge: string;
  limitations: string[];
  ratioComparisonBaselineLabel: string;
  ratioComparisonModifiedLabel: string;
  intensityContrastLabel: string;
  ratioDelta: OperationalDeltaComparisonContract;
  threeToOneLight: OperationalOutcomeScenarioFixture;
  fourToOneLight: OperationalOutcomeScenarioFixture;
  threeToOneSlammed: OperationalOutcomeScenarioFixture;
  fourToOneSlammed: OperationalOutcomeScenarioFixture;
};

export function adaptSharedOutcomeDashboardProofData(
  data: OperationalOutcomeDashboardProofData = operationalOutcomeDashboardProofData
): OperationalOutcomeDashboardProofFixture {
  return {
    sourcePackage: "@nerdeus/shared",
    sourceDataId: data.sourceDataId,
    proofTitle: data.proofTitle,
    proofBadge: data.proofBadge,
    ratioComparisonBaselineLabel: data.ratioComparisonBaselineLabel,
    ratioComparisonModifiedLabel: data.ratioComparisonModifiedLabel,
    intensityContrastLabel: data.intensityContrastLabel,
    ratioDelta: data.ratioDeltaComparison,
    limitations: data.limitations,
    threeToOneLight: adaptScenario(findScenario(data, "3_to_1", "light")),
    fourToOneLight: adaptScenario(findScenario(data, "4_to_1", "light")),
    threeToOneSlammed: adaptScenario(findScenario(data, "3_to_1", "slammed")),
    fourToOneSlammed: adaptScenario(findScenario(data, "4_to_1", "slammed"))
  };
}

export const operationalOutcomeDashboardProofFixture =
  adaptSharedOutcomeDashboardProofData(operationalOutcomeDashboardProofData);

export const allOperationalOutcomeMetricIds: string[] = [
  ...OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS
];

export const operationalOutcomeMetricDirectionById: Record<
  string,
  OperationalOutcomeMetricDirectionality
> = Object.fromEntries(
  requireFirstScenario(operationalOutcomeDashboardProofData).operationalMetrics.map((metric) => [
    metric.metricId,
    metric.directionality
  ])
);

export const allOperationalOutcomeMetricDirections: Record<
  string,
  OperationalMetricDirectionality
> = operationalOutcomeMetricDirectionById;

function findScenario(
  data: OperationalOutcomeDashboardProofData,
  ratioLabel: OperationalOutcomeScenarioFixture["ratioLabel"],
  intensityLabel: OperationalOutcomeScenarioFixture["intensityLabel"]
): OperationalOutcomeDashboardProofScenario {
  const scenario = data.scenarios.find(
    (candidate) =>
      candidate.ratioLabel === ratioLabel && candidate.intensityLabel === intensityLabel
  );
  if (scenario == null) {
    throw new Error(`missing shared dashboard scenario: ${ratioLabel} ${intensityLabel}`);
  }
  return scenario;
}

function requireFirstScenario(
  data: OperationalOutcomeDashboardProofData
): OperationalOutcomeDashboardProofScenario {
  const scenario = data.scenarios[0];
  if (scenario == null) {
    throw new Error("shared dashboard proof data requires at least one scenario");
  }
  return scenario;
}

function adaptScenario(
  scenario: OperationalOutcomeDashboardProofScenario
): OperationalOutcomeScenarioFixture {
  return {
    scenarioLabel: scenario.scenarioLabel,
    ratioLabel: scenario.ratioLabel,
    intensityLabel: scenario.intensityLabel,
    pressureBand: scenario.pressureBand,
    metrics: scenario.operationalMetrics.map((metric) => ({
      metricId: metric.metricId,
      label: metric.label,
      group: metric.group,
      unit: metric.unit,
      value: metric.value,
      directionality: metric.directionality
    }))
  };
}
