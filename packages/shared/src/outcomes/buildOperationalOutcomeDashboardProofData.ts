import {
  buildOperationalDeltaComparison,
  validateOperationalDeltaComparison,
  type OperationalDeltaComparisonContract
} from "./operationalDeltaComparison.js";
import {
  type OperationalMetricContract,
  validateMetricLimitations,
  validateOperationalMetricContracts,
  validateOperationalText
} from "./operationalMetricContract.js";
import {
  getOperationalMetricDefinition,
  validateMetricAgainstRegistry
} from "./operationalMetricRegistry.js";
import {
  buildRegisteredOperationalMetric,
  roundToTwo
} from "./outcomeMetricsBuilder.js";
import {
  buildPressureBandingSummary,
  PRESSURE_BAND_LABELS,
  type PressureBandLabel
} from "./pressureBandingSummary.js";
import {
  buildRatioScenarioIntensityContract,
  INTENSITY_LABELS,
  RATIO_LABELS,
  type IntensityLabel,
  type RatioLabel,
  type RatioScenarioIntensityScenario
} from "./ratioScenarioIntensityContract.js";

export const OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_SCHEMA_VERSION = "1.0.0" as const;
export const OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_ID =
  "operational-outcome-dashboard-proof-data" as const;

export const OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS = [
  "nurse_walk_time",
  "patient_wait_idle_proxy",
  "task_time",
  "queue_delay",
  "unit_saturation",
  "room_turnover_pressure",
  "nurse_strain_proxy",
  "layout_friction"
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
  ratioDeltaComparison: OperationalDeltaComparisonContract;
  scenarios: OperationalOutcomeDashboardProofScenario[];
  limitations: string[];
};

type DashboardMetricFormula = {
  metricId: OperationalOutcomeDashboardMetricId;
  baseValue: number;
  ratioLoadWeight: number;
  intensityExponent: number;
};

const DASHBOARD_LIMITATIONS = [
  "Dashboard proof data is generated from shared operational builders for deterministic scenario contrast.",
  "Scenario values are derived from shared ratio and intensity assumptions, not web-local metric truth.",
  "Values are workload-pressure labels and operational metrics only."
];

const DASHBOARD_METRIC_LIMITATIONS = [
  "Operational-only dashboard proof metric generated from shared ratio and intensity assumptions."
];

const DASHBOARD_SCENARIO_ORDER: Array<[RatioLabel, IntensityLabel]> = [
  ["3_to_1", "light"],
  ["4_to_1", "light"],
  ["3_to_1", "slammed"],
  ["4_to_1", "slammed"]
];

const DASHBOARD_METRIC_FORMULAS: DashboardMetricFormula[] = [
  {
    metricId: "nurse_walk_time",
    baseValue: 20,
    ratioLoadWeight: 3,
    intensityExponent: 1.5
  },
  {
    metricId: "patient_wait_idle_proxy",
    baseValue: 11,
    ratioLoadWeight: 4,
    intensityExponent: 2.2
  },
  {
    metricId: "task_time",
    baseValue: 24,
    ratioLoadWeight: 4,
    intensityExponent: 1.4
  },
  {
    metricId: "queue_delay",
    baseValue: 8,
    ratioLoadWeight: 3,
    intensityExponent: 2.3
  },
  {
    metricId: "unit_saturation",
    baseValue: 24,
    ratioLoadWeight: 8,
    intensityExponent: 2.4
  },
  {
    metricId: "room_turnover_pressure",
    baseValue: 18,
    ratioLoadWeight: 7,
    intensityExponent: 2.1
  },
  {
    metricId: "nurse_strain_proxy",
    baseValue: 19,
    ratioLoadWeight: 6,
    intensityExponent: 2
  },
  {
    metricId: "layout_friction",
    baseValue: 12,
    ratioLoadWeight: 4,
    intensityExponent: 1.8
  }
];

export function buildOperationalOutcomeDashboardProofData(): OperationalOutcomeDashboardProofData {
  const ratioScenarios = buildRatioScenarioIntensityContract({
    intensities: ["light", "slammed"]
  }).scenarios;
  const scenarioByKey = new Map(ratioScenarios.map((scenario) => [scenario.scenarioKey, scenario]));
  const scenarios = DASHBOARD_SCENARIO_ORDER.map(([ratioLabel, intensityLabel]) => {
    const scenario = scenarioByKey.get(`${ratioLabel}_${intensityLabel}`);
    if (scenario == null) {
      throw new Error(`missing dashboard ratio scenario: ${ratioLabel} ${intensityLabel}`);
    }
    return buildDashboardScenario(scenario);
  });

  const ratioDeltaComparison = buildOperationalDeltaComparison({
    comparisonId: "outcome-dashboard-ratio-contrast",
    baselineLabel: "3:1 light",
    modifiedLabel: "4:1 light",
    baselineMetrics: requireScenario(scenarios, "3_to_1", "light").operationalMetrics,
    modifiedMetrics: requireScenario(scenarios, "4_to_1", "light").operationalMetrics,
    limitations: DASHBOARD_LIMITATIONS
  });

  return validateOperationalOutcomeDashboardProofData({
    schemaVersion: OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_SCHEMA_VERSION,
    sourceDataId: OPERATIONAL_OUTCOME_DASHBOARD_PROOF_DATA_ID,
    proofTitle: "Operational outcome dashboard proof",
    proofBadge: "Operational-only outcome contrast proof",
    ratioComparisonBaselineLabel: "3:1 light",
    ratioComparisonModifiedLabel: "4:1 light",
    intensityContrastLabel: "3:1 light vs 3:1 slammed",
    ratioDeltaComparison,
    scenarios,
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
    "ratioDeltaComparison",
    "scenarios",
    "limitations"
  ]);

  const scenarios = requireArray(raw.scenarios, "scenarios").map((scenario, index) =>
    validateScenario(scenario, index)
  );

  if (scenarios.length !== DASHBOARD_SCENARIO_ORDER.length) {
    throw new Error("scenarios must include the dashboard proof scenario set");
  }
  requireUnique(
    "scenarios scenarioKey",
    scenarios.map((scenario) => scenario.scenarioKey)
  );
  const expectedScenarioKeys = DASHBOARD_SCENARIO_ORDER.map(
    ([ratioLabel, intensityLabel]) => `${ratioLabel}_${intensityLabel}`
  ).join("|");
  const actualScenarioKeys = scenarios.map((scenario) => scenario.scenarioKey).join("|");
  if (actualScenarioKeys !== expectedScenarioKeys) {
    throw new Error("scenarios must match the dashboard proof scenario keys");
  }

  const ratioDeltaComparison = validateOperationalDeltaComparison(raw.ratioDeltaComparison);
  const deltaMetricIds = ratioDeltaComparison.deltas.map((delta) => delta.metricId).sort();
  const expectedDeltaMetricIds = [...OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS].sort();
  if (deltaMetricIds.join("|") !== expectedDeltaMetricIds.join("|")) {
    throw new Error("ratioDeltaComparison must match dashboard metric ids");
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
    ratioDeltaComparison,
    scenarios,
    limitations: validateMetricLimitations(raw.limitations, "limitations")
  };
}

function buildDashboardScenario(
  scenario: RatioScenarioIntensityScenario
): OperationalOutcomeDashboardProofScenario {
  const operationalMetrics = DASHBOARD_METRIC_FORMULAS.map((formula) =>
    buildRegisteredOperationalMetric({
      metricId: formula.metricId,
      value: deriveDashboardMetricValue(formula, scenario),
      limitations: DASHBOARD_METRIC_LIMITATIONS
    })
  );

  return {
    scenarioKey: scenario.scenarioKey,
    scenarioLabel: formatScenarioLabel(scenario.ratioLabel, scenario.intensityLabel),
    ratioLabel: scenario.ratioLabel,
    intensityLabel: scenario.intensityLabel,
    pressureBand: deriveOverallPressureBand(operationalMetrics),
    operationalMetrics
  };
}

function deriveDashboardMetricValue(
  formula: DashboardMetricFormula,
  scenario: RatioScenarioIntensityScenario
): number {
  const ratioLoad = scenario.targetOccupiedRoomsPerNurse - 3;
  const rawValue =
    (formula.baseValue + ratioLoad * formula.ratioLoadWeight) *
    Math.pow(scenario.compositeIntensityWeight, formula.intensityExponent);
  const boundedValue = formula.metricId === "unit_saturation" ? Math.min(rawValue, 100) : rawValue;
  return roundToTwo(boundedValue);
}

function deriveOverallPressureBand(metrics: OperationalMetricContract[]): PressureBandLabel {
  const summary = buildPressureBandingSummary({
    metrics,
    limitations: [
      "Dashboard proof pressure bands are generated with shared operational band thresholds."
    ]
  });
  const overall = summary.metrics.find((metric) => metric.metricId === "overall_pressure_band");
  if (overall == null) {
    throw new Error("pressure banding summary must include overall pressure band");
  }
  const threshold = summary.thresholds.find((candidate) => candidate.bandValue === overall.value);
  if (threshold == null) {
    throw new Error("overall pressure band must map to a configured threshold");
  }
  return threshold.bandLabel;
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
  for (const metric of operationalMetrics) {
    const validation = validateMetricAgainstRegistry(metric);
    if (!validation.isRegistered || validation.canonicalMetricId !== metric.metricId) {
      throw new Error(`scenarios[${index}].operationalMetrics must use canonical registry metric ids`);
    }
    const definition = getOperationalMetricDefinition(metric.metricId);
    if (definition == null || definition.label !== metric.label) {
      throw new Error(`scenarios[${index}].operationalMetrics must use registry labels`);
    }
  }

  const pressureBand = requireEnum(
    scenario.pressureBand,
    PRESSURE_BAND_LABELS,
    `scenarios[${index}].pressureBand`
  );
  if (pressureBand !== deriveOverallPressureBand(operationalMetrics)) {
    throw new Error(`scenarios[${index}].pressureBand must match shared pressure banding summary`);
  }

  return {
    scenarioKey,
    scenarioLabel: validateOperationalText(scenario.scenarioLabel, `scenarios[${index}].scenarioLabel`),
    ratioLabel,
    intensityLabel,
    pressureBand,
    operationalMetrics
  };
}

function formatScenarioLabel(ratioLabel: RatioLabel, intensityLabel: IntensityLabel): string {
  const ratio = ratioLabel.replace("_to_", ":");
  const intensity = `${intensityLabel.charAt(0).toUpperCase()}${intensityLabel.slice(1)}`;
  return `${ratio} ${intensity}`;
}

function requireScenario(
  scenarios: OperationalOutcomeDashboardProofScenario[],
  ratioLabel: RatioLabel,
  intensityLabel: IntensityLabel
): OperationalOutcomeDashboardProofScenario {
  const scenario = scenarios.find(
    (candidate) => candidate.ratioLabel === ratioLabel && candidate.intensityLabel === intensityLabel
  );
  if (scenario == null) {
    throw new Error(`missing dashboard scenario: ${ratioLabel} ${intensityLabel}`);
  }
  return scenario;
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
