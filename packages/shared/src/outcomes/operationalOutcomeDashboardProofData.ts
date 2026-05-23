import {
  INTENSITY_LABELS,
  RATIO_LABELS,
  type IntensityLabel,
  type RatioLabel
} from "./ratioScenarioIntensityContract.js";
import {
  PRESSURE_BAND_LABELS,
  type PressureBandLabel
} from "./pressureBandingSummary.js";
import {
  type OperationalMetricContract,
  type OperationalMetricDirectionality,
  type OperationalMetricGroup,
  type OperationalMetricUnit,
  validateMetricLimitations,
  validateOperationalMetricContracts,
  validateOperationalText
} from "./operationalMetricContract.js";
import { buildOperationalMetric } from "./outcomeMetricsBuilder.js";

export const OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_SCHEMA_VERSION = "1.0.0" as const;
export const OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_ID =
  "operational-outcome-dashboard-proof-data" as const;

export const OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS = [
  "nurse-walk-time",
  "patient-wait-idle-proxy",
  "task-time",
  "queue-delay",
  "unit-saturation",
  "room-turnover-pressure",
  "nurse-strain-proxy",
  "layout-friction"
] as const;

export type OperationalOutcomeDashboardMetricId =
  (typeof OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS)[number];

export type OperationalOutcomeDashboardProofScenario = {
  scenarioKey: string;
  scenarioLabel: string;
  ratioLabel: RatioLabel;
  intensityLabel: IntensityLabel;
  pressureBand: PressureBandLabel;
  operationalMetrics: OperationalMetricContract[];
};

export type OperationalOutcomeDashboardProofData = {
  schemaVersion: typeof OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_SCHEMA_VERSION;
  sourceDataId: typeof OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_ID;
  proofTitle: string;
  proofBadge: string;
  ratioComparisonBaselineLabel: string;
  ratioComparisonModifiedLabel: string;
  intensityContrastLabel: string;
  scenarios: OperationalOutcomeDashboardProofScenario[];
  limitations: string[];
};

type MetricDefinition = {
  metricId: OperationalOutcomeDashboardMetricId;
  label: string;
  group: OperationalMetricGroup;
  unit: OperationalMetricUnit;
  directionality: OperationalMetricDirectionality;
};

type ScenarioDefinition = {
  scenarioLabel: string;
  ratioLabel: RatioLabel;
  intensityLabel: IntensityLabel;
  pressureBand: PressureBandLabel;
  values: Record<OperationalOutcomeDashboardMetricId, number>;
};

const DASHBOARD_LIMITATIONS = [
  "Dashboard proof data is synthetic operational data for deterministic scenario contrast.",
  "Scenario values are shared package fixture values, not web-local metric truth.",
  "Values are workload-pressure labels and operational metrics only."
];

const DASHBOARD_METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    metricId: "nurse-walk-time",
    label: "Nurse Walk Time",
    group: "nurse",
    unit: "minutes",
    directionality: "lower_is_better"
  },
  {
    metricId: "patient-wait-idle-proxy",
    label: "Patient Wait / Idle Proxy",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better"
  },
  {
    metricId: "task-time",
    label: "Task Time",
    group: "task",
    unit: "minutes",
    directionality: "lower_is_better"
  },
  {
    metricId: "queue-delay",
    label: "Queue Delay",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better"
  },
  {
    metricId: "unit-saturation",
    label: "Unit Saturation",
    group: "unit",
    unit: "percent",
    directionality: "lower_is_better"
  },
  {
    metricId: "room-turnover-pressure",
    label: "Room Turnover Pressure",
    group: "room",
    unit: "score",
    directionality: "lower_is_better"
  },
  {
    metricId: "nurse-strain-proxy",
    label: "Nurse Strain Proxy",
    group: "nurse",
    unit: "score",
    directionality: "lower_is_better"
  },
  {
    metricId: "layout-friction",
    label: "Layout Friction",
    group: "layout",
    unit: "score",
    directionality: "lower_is_better"
  }
];

const DASHBOARD_SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    scenarioLabel: "3:1 Light",
    ratioLabel: "3_to_1",
    intensityLabel: "light",
    pressureBand: "low",
    values: {
      "nurse-walk-time": 28,
      "patient-wait-idle-proxy": 8,
      "task-time": 30,
      "queue-delay": 4,
      "unit-saturation": 34,
      "room-turnover-pressure": 22,
      "nurse-strain-proxy": 26,
      "layout-friction": 16
    }
  },
  {
    scenarioLabel: "4:1 Light",
    ratioLabel: "4_to_1",
    intensityLabel: "light",
    pressureBand: "low",
    values: {
      "nurse-walk-time": 32,
      "patient-wait-idle-proxy": 12,
      "task-time": 34,
      "queue-delay": 5,
      "unit-saturation": 46,
      "room-turnover-pressure": 39,
      "nurse-strain-proxy": 30,
      "layout-friction": 19
    }
  },
  {
    scenarioLabel: "3:1 Slammed",
    ratioLabel: "3_to_1",
    intensityLabel: "slammed",
    pressureBand: "critical",
    values: {
      "nurse-walk-time": 44,
      "patient-wait-idle-proxy": 20,
      "task-time": 60,
      "queue-delay": 17,
      "unit-saturation": 68,
      "room-turnover-pressure": 61,
      "nurse-strain-proxy": 45,
      "layout-friction": 33
    }
  },
  {
    scenarioLabel: "4:1 Slammed",
    ratioLabel: "4_to_1",
    intensityLabel: "slammed",
    pressureBand: "critical",
    values: {
      "nurse-walk-time": 48,
      "patient-wait-idle-proxy": 23,
      "task-time": 68,
      "queue-delay": 20,
      "unit-saturation": 74,
      "room-turnover-pressure": 73,
      "nurse-strain-proxy": 58,
      "layout-friction": 42
    }
  }
];

export function buildOperationalOutcomeDashboardProofData(): OperationalOutcomeDashboardProofData {
  return validateOperationalOutcomeDashboardProofData({
    schemaVersion: OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_SCHEMA_VERSION,
    sourceDataId: OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_ID,
    proofTitle: "Operational outcome dashboard proof",
    proofBadge: "Operational-only outcome contrast proof",
    ratioComparisonBaselineLabel: "3:1 light",
    ratioComparisonModifiedLabel: "4:1 light",
    intensityContrastLabel: "3:1 light vs 3:1 slammed",
    scenarios: DASHBOARD_SCENARIO_DEFINITIONS.map(buildScenario),
    limitations: DASHBOARD_LIMITATIONS
  });
}

export const operationalOutcomeDashboardProofData = buildOperationalOutcomeDashboardProofData();

export function validateOperationalOutcomeDashboardProofData(
  value: unknown
): OperationalOutcomeDashboardProofData {
  const raw = requireRecord(value, "operationalOutcomeDashboardProofData");
  requireExactKeys(raw, "operationalOutcomeDashboardProofData", [
    "schemaVersion",
    "sourceDataId",
    "proofTitle",
    "proofBadge",
    "ratioComparisonBaselineLabel",
    "ratioComparisonModifiedLabel",
    "intensityContrastLabel",
    "scenarios",
    "limitations"
  ]);

  const scenarios = requireArray(raw.scenarios, "scenarios").map((scenario, index) =>
    validateScenario(scenario, index)
  );

  if (scenarios.length !== DASHBOARD_SCENARIO_DEFINITIONS.length) {
    throw new Error("scenarios must include the dashboard proof scenario set");
  }
  requireUnique(
    "scenarios scenarioKey",
    scenarios.map((scenario) => scenario.scenarioKey)
  );
  const expectedScenarioKeys = DASHBOARD_SCENARIO_DEFINITIONS.map(
    (scenario) => `${scenario.ratioLabel}_${scenario.intensityLabel}`
  ).join("|");
  const actualScenarioKeys = scenarios.map((scenario) => scenario.scenarioKey).join("|");
  if (actualScenarioKeys !== expectedScenarioKeys) {
    throw new Error("scenarios must match the dashboard proof scenario keys");
  }

  return {
    schemaVersion: requireLiteral(
      raw.schemaVersion,
      OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_SCHEMA_VERSION,
      "schemaVersion"
    ),
    sourceDataId: requireLiteral(
      raw.sourceDataId,
      OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_ID,
      "sourceDataId"
    ),
    proofTitle: validateOperationalText(raw.proofTitle, "proofTitle"),
    proofBadge: validateOperationalText(raw.proofBadge, "proofBadge"),
    ratioComparisonBaselineLabel: validateOperationalText(
      raw.ratioComparisonBaselineLabel,
      "ratioComparisonBaselineLabel"
    ),
    ratioComparisonModifiedLabel: validateOperationalText(
      raw.ratioComparisonModifiedLabel,
      "ratioComparisonModifiedLabel"
    ),
    intensityContrastLabel: validateOperationalText(raw.intensityContrastLabel, "intensityContrastLabel"),
    scenarios,
    limitations: validateMetricLimitations(raw.limitations, "limitations")
  };
}

function buildScenario(definition: ScenarioDefinition): OperationalOutcomeDashboardProofScenario {
  return {
    scenarioKey: `${definition.ratioLabel}_${definition.intensityLabel}`,
    scenarioLabel: definition.scenarioLabel,
    ratioLabel: definition.ratioLabel,
    intensityLabel: definition.intensityLabel,
    pressureBand: definition.pressureBand,
    operationalMetrics: DASHBOARD_METRIC_DEFINITIONS.map((metric) =>
      buildOperationalMetric({
        metricId: metric.metricId,
        label: metric.label,
        group: metric.group,
        unit: metric.unit,
        value: definition.values[metric.metricId],
        directionality: metric.directionality,
        source: "derived_proxy",
        scope: "scenario",
        limitations: ["Operational-only dashboard proof metric from shared source data."]
      })
    )
  };
}

function validateScenario(value: unknown, index: number): OperationalOutcomeDashboardProofScenario {
  const scenario = requireRecord(value, `scenarios[${index}]`);
  requireExactKeys(scenario, `scenarios[${index}]`, [
    "scenarioKey",
    "scenarioLabel",
    "ratioLabel",
    "intensityLabel",
    "pressureBand",
    "operationalMetrics"
  ]);

  const ratioLabel = requireEnum(scenario.ratioLabel, RATIO_LABELS, `scenarios[${index}].ratioLabel`);
  const intensityLabel = requireEnum(
    scenario.intensityLabel,
    INTENSITY_LABELS,
    `scenarios[${index}].intensityLabel`
  );
  const scenarioKey = validateOperationalText(scenario.scenarioKey, `scenarios[${index}].scenarioKey`);
  if (scenarioKey !== `${ratioLabel}_${intensityLabel}`) {
    throw new Error(`scenarios[${index}].scenarioKey must match ratioLabel and intensityLabel`);
  }

  const operationalMetrics = validateOperationalMetricContracts(scenario.operationalMetrics);
  const metricIds = operationalMetrics.map((metric) => metric.metricId);
  if (metricIds.join("|") !== OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS.join("|")) {
    throw new Error(`scenarios[${index}].operationalMetrics must match dashboard metric ids`);
  }

  return {
    scenarioKey,
    scenarioLabel: validateOperationalText(scenario.scenarioLabel, `scenarios[${index}].scenarioLabel`),
    ratioLabel,
    intensityLabel,
    pressureBand: requireEnum(
      scenario.pressureBand,
      PRESSURE_BAND_LABELS,
      `scenarios[${index}].pressureBand`
    ),
    operationalMetrics
  };
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

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireUnique(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}
