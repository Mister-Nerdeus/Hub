import type {
  OperationalMetricDirectionality
} from "@nerdeus/shared";

type OperationalOutcomeMetricDirectionality = OperationalMetricDirectionality;

type ScenarioPressureBand = "low" | "moderate" | "high" | "critical";

type OperationalOutcomeScenarioMetric = {
  metricId: string;
  label: string;
  group: string;
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
  proofTitle: string;
  proofBadge: string;
  limitations: string[];
  ratioComparisonBaselineLabel: string;
  ratioComparisonModifiedLabel: string;
  intensityContrastLabel: string;
  threeToOneLight: OperationalOutcomeScenarioFixture;
  fourToOneLight: OperationalOutcomeScenarioFixture;
  threeToOneSlammed: OperationalOutcomeScenarioFixture;
  fourToOneSlammed: OperationalOutcomeScenarioFixture;
};

const sharedMetricTemplate: OperationalOutcomeScenarioMetric[] = [
  {
    metricId: "nurse-walk-time",
    label: "Nurse Walk Time",
    group: "nurse",
    unit: "minutes",
    value: 0,
    directionality: "lower_is_better"
  },
  {
    metricId: "patient-wait-idle-proxy",
    label: "Patient Wait / Idle Proxy",
    group: "patient_flow",
    unit: "minutes",
    value: 0,
    directionality: "lower_is_better"
  },
  {
    metricId: "task-time",
    label: "Task Time",
    group: "task",
    unit: "minutes",
    value: 0,
    directionality: "lower_is_better"
  },
  {
    metricId: "queue-delay",
    label: "Queue Delay",
    group: "patient_flow",
    unit: "minutes",
    value: 0,
    directionality: "lower_is_better"
  },
  {
    metricId: "unit-saturation",
    label: "Unit Saturation",
    group: "unit",
    value: 0,
    unit: "percent",
    directionality: "lower_is_better"
  },
  {
    metricId: "room-turnover-pressure",
    label: "Room Turnover Pressure",
    group: "room",
    unit: "score",
    value: 0,
    directionality: "lower_is_better"
  },
  {
    metricId: "nurse-strain-proxy",
    label: "Nurse Strain Proxy",
    group: "nurse",
    unit: "score",
    value: 0,
    directionality: "lower_is_better"
  },
  {
    metricId: "layout-friction",
    label: "Layout Friction",
    group: "layout",
    unit: "score",
    value: 0,
    directionality: "lower_is_better"
  }
];

const metricValues = {
  "3_to_1": {
    light: [28, 8, 30, 4, 34, 22, 26, 16],
    slammed: [44, 20, 60, 17, 68, 61, 45, 33]
  },
  "4_to_1": {
    light: [32, 12, 34, 5, 46, 39, 30, 19],
    slammed: [48, 23, 68, 20, 74, 73, 58, 42]
  }
} as const;

function makeScenario(
  scenarioLabel: string,
  ratioLabel: "3_to_1" | "4_to_1",
  intensityLabel: "light" | "normal" | "busy" | "slammed",
  pressureBand: ScenarioPressureBand,
  values: readonly number[]
): OperationalOutcomeScenarioFixture {
  const metrics = sharedMetricTemplate.map((metric, index) => ({
    ...metric,
    value: values[index] ?? 0
  }));

  return {
    scenarioLabel,
    ratioLabel,
    intensityLabel,
    pressureBand,
    metrics
  };
}

export const operationalOutcomeDashboardProofFixture: OperationalOutcomeDashboardProofFixture = {
  proofTitle: "Operational outcome dashboard proof",
  proofBadge: "Operational-only outcome contrast proof",
  ratioComparisonBaselineLabel: "3:1 light",
  ratioComparisonModifiedLabel: "4:1 light",
  intensityContrastLabel: "3:1 light vs 3:1 slammed",
  limitations: [
    "Operational-only dashboard proof for deterministic scenario pressure contrasts.",
    "Card values are synthetic operational outputs from local fixtures and do not represent live patients.",
    "Dashboard visibility and labels are operational only and avoid care outcome claims."
  ],
  threeToOneLight: makeScenario(
    "3:1 Light",
    "3_to_1",
    "light",
    "low",
    metricValues["3_to_1"].light
  ),
  fourToOneLight: makeScenario(
    "4:1 Light",
    "4_to_1",
    "light",
    "low",
    metricValues["4_to_1"].light
  ),
  threeToOneSlammed: makeScenario(
    "3:1 Slammed",
    "3_to_1",
    "slammed",
    "critical",
    metricValues["3_to_1"].slammed
  ),
  fourToOneSlammed: makeScenario(
    "4:1 Slammed",
    "4_to_1",
    "slammed",
    "critical",
    metricValues["4_to_1"].slammed
  )
};

export const operationalOutcomeMetricDirectionById: Record<string, OperationalOutcomeMetricDirectionality> =
  Object.fromEntries(sharedMetricTemplate.map((metric) => [metric.metricId, metric.directionality]));

export const allOperationalOutcomeMetricIds: string[] = sharedMetricTemplate.map((metric) => metric.metricId);

export const allOperationalOutcomeMetricDirections: Record<string, OperationalMetricDirectionality> =
  {
    "nurse-walk-time": "lower_is_better",
    "patient-wait-idle-proxy": "lower_is_better",
    "task-time": "lower_is_better",
    "queue-delay": "lower_is_better",
    "unit-saturation": "lower_is_better",
    "room-turnover-pressure": "lower_is_better",
    "nurse-strain-proxy": "lower_is_better",
    "layout-friction": "lower_is_better"
  };
