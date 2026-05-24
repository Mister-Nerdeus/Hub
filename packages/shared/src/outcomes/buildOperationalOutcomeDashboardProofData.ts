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
import { buildNurseTaskBurdenSummary } from "./nurseTaskBurdenSummary.js";
import { buildNurseWalkLayoutFrictionSummary } from "./nurseWalkLayoutFrictionSummary.js";
import { buildPatientWaitIdleProxy } from "./patientWaitIdleProxy.js";
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
import { buildRoomTurnoverBlockedTimeProxy } from "./roomTurnoverBlockedTimeProxy.js";
import { buildTaskTimeQueueSummary } from "./taskTimeQueueSummary.js";
import { type SimulationRunContract } from "../simulation/simulationRunContract.js";

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

type DashboardOutcomePipeline = {
  metricById: Map<string, OperationalMetricContract>;
};

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
  const pipeline = buildDashboardOutcomePipeline(scenario);
  const operationalMetrics = OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS.map((metricId) =>
    buildDashboardMetricFromPipeline(metricId, pipeline)
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

function buildDashboardOutcomePipeline(
  scenario: RatioScenarioIntensityScenario
): DashboardOutcomePipeline {
  const simulationRun = buildScenarioSimulationRun(scenario);
  const metricById = new Map<string, OperationalMetricContract>();
  const summaries = [
    buildNurseWalkLayoutFrictionSummary({ simulationRun }),
    buildPatientWaitIdleProxy({ simulationRun }),
    buildTaskTimeQueueSummary({ simulationRun }),
    buildRoomTurnoverBlockedTimeProxy({ simulationRun }),
    buildNurseTaskBurdenSummary({ simulationRun })
  ];

  for (const summary of summaries) {
    for (const metric of summary.metrics) {
      metricById.set(metric.metricId, metric);
    }
  }

  return {
    metricById
  };
}

function buildDashboardMetricFromPipeline(
  metricId: OperationalOutcomeDashboardMetricId,
  pipeline: DashboardOutcomePipeline
): OperationalMetricContract {
  const value = selectDashboardMetricValue(metricId, pipeline);
  return buildRegisteredOperationalMetric({
    metricId,
    value,
    limitations: DASHBOARD_METRIC_LIMITATIONS
  });
}

function selectDashboardMetricValue(
  metricId: OperationalOutcomeDashboardMetricId,
  pipeline: DashboardOutcomePipeline
): number {
  switch (metricId) {
    case "nurse_walk_time":
      return requirePipelineMetricValue(pipeline, "total_walk_minutes");
    case "patient_wait_idle_proxy":
      return requirePipelineMetricValue(pipeline, "patient_flow_wait_idle_minutes");
    case "task_time":
      return requirePipelineMetricValue(pipeline, "direct_task_minutes");
    case "queue_delay":
      return requirePipelineMetricValue(pipeline, "queue_wait_minutes");
    case "unit_saturation":
      return deriveUnitSaturationFromPipeline(pipeline);
    case "room_turnover_pressure":
      return requirePipelineMetricValue(pipeline, "room_turnover_pressure");
    case "nurse_strain_proxy":
      return deriveNurseStrainFromPipeline(pipeline);
    case "layout_friction":
      return requirePipelineMetricValue(pipeline, "layout_friction");
  }
}

function deriveUnitSaturationFromPipeline(pipeline: DashboardOutcomePipeline): number {
  const taskTime = requirePipelineMetricValue(pipeline, "direct_task_minutes");
  const queueDelay = requirePipelineMetricValue(pipeline, "queue_wait_minutes");
  const patientFlow = requirePipelineMetricValue(pipeline, "patient_flow_wait_idle_minutes");
  const turnoverPressure = requirePipelineMetricValue(pipeline, "room_turnover_pressure");
  return roundToTwo(Math.min(100, taskTime + queueDelay + patientFlow + turnoverPressure));
}

function deriveNurseStrainFromPipeline(pipeline: DashboardOutcomePipeline): number {
  const directMinutes = requirePipelineMetricValue(
    pipeline,
    "direct_task_minutes_by_nurse_dashboard-nurse"
  );
  const queueMinutes = requirePipelineMetricValue(
    pipeline,
    "queue_wait_minutes_by_nurse_dashboard-nurse"
  );
  const delayedTasks = requirePipelineMetricValue(
    pipeline,
    "delayed_task_count_by_nurse_dashboard-nurse"
  );
  const missedTasks = requirePipelineMetricValue(
    pipeline,
    "missed_task_count_by_nurse_dashboard-nurse"
  );
  return roundToTwo(directMinutes + queueMinutes + delayedTasks * 4 + missedTasks * 8);
}

function requirePipelineMetricValue(
  pipeline: DashboardOutcomePipeline,
  sourceMetricId: string
): number {
  const metric = pipeline.metricById.get(sourceMetricId);
  if (metric == null) {
    throw new Error(`dashboard outcome pipeline missing source metric ${sourceMetricId}`);
  }
  return metric.value;
}

function buildScenarioSimulationRun(
  scenario: RatioScenarioIntensityScenario
): SimulationRunContract {
  const ratioLoad = scenario.targetOccupiedRoomsPerNurse;
  const intensity = scenario.compositeIntensityWeight;
  const directTaskMinutes = roundToTwo(6 * ratioLoad * intensity);
  const queueWaitMinutes = roundToTwo(2 * ratioLoad * intensity * intensity);
  const taskDelayMinutes = roundToTwo(2.5 * ratioLoad * intensity * intensity);
  const travelMinutes = Math.max(1, Math.round(1.8 * ratioLoad * intensity));
  const travelDistanceFeet = Math.round(travelMinutes * 90);
  const waitBeforeStart = roundToTwo(1.5 * ratioLoad * intensity);
  const turnoverTaskMinutes = roundToTwo(2.5 * ratioLoad * intensity);
  const turnoverDelayMinutes = roundToTwo(1.75 * ratioLoad * intensity * intensity);
  const missedPressureMinutes = scenario.intensityLabel === "slammed"
    ? roundToTwo(6 * ratioLoad * intensity)
    : 0;
  const workStartMinute = Math.round(waitBeforeStart);
  const workCompletedMinute = Math.round(workStartMinute + directTaskMinutes);
  const turnoverStartMinute = Math.round(30 + turnoverDelayMinutes);
  const turnoverCompletedMinute = Math.round(turnoverStartMinute + turnoverTaskMinutes);
  const events: SimulationRunContract["events"] = [
    {
      eventId: `${scenario.scenarioKey}-work-ready`,
      eventType: "task",
      action: "ready",
      taskId: `${scenario.scenarioKey}-work-task`,
      nurseId: "dashboard-nurse",
      minute: 0,
      scheduledMinute: 0
    },
    {
      eventId: `${scenario.scenarioKey}-work-started`,
      eventType: "task",
      action: "started",
      taskId: `${scenario.scenarioKey}-work-task`,
      nurseId: "dashboard-nurse",
      minute: workStartMinute,
      startMinute: workStartMinute
    },
    {
      eventId: `${scenario.scenarioKey}-work-delay`,
      eventType: "task",
      action: "delayed",
      taskId: `${scenario.scenarioKey}-work-task`,
      nurseId: "dashboard-nurse",
      minute: workStartMinute,
      delayMinutes: taskDelayMinutes
    },
    {
      eventId: `${scenario.scenarioKey}-queue-start`,
      eventType: "queue",
      action: "started_from_queue",
      nurseId: "dashboard-nurse",
      taskId: `${scenario.scenarioKey}-work-task`,
      minute: workStartMinute,
      originalReadyMinute: 0,
      enteredQueueMinute: 0,
      startedMinute: workStartMinute,
      waitMinutes: queueWaitMinutes,
      orderingReason: "deterministic ratio intensity dashboard proof"
    },
    {
      eventId: `${scenario.scenarioKey}-travel`,
      eventType: "travel",
      action: "travel_calculated",
      nurseId: "dashboard-nurse",
      taskId: `${scenario.scenarioKey}-work-task`,
      minute: workStartMinute,
      originNodeId: "dashboard-origin",
      destinationNodeId: "dashboard-destination",
      routeNodeIds: ["dashboard-origin", "dashboard-destination"],
      routeEdgeIds: ["dashboard-edge"],
      travelDistanceFeet,
      travelSeconds: travelMinutes * 60,
      travelMinutes,
      warnings: []
    },
    {
      eventId: `${scenario.scenarioKey}-work-completed`,
      eventType: "task",
      action: "completed",
      taskId: `${scenario.scenarioKey}-work-task`,
      nurseId: "dashboard-nurse",
      minute: workCompletedMinute,
      completedMinute: workCompletedMinute,
      durationMinutes: directTaskMinutes
    },
    {
      eventId: `${scenario.scenarioKey}-nurse-completed`,
      eventType: "nurse",
      action: "completed_task",
      nurseId: "dashboard-nurse",
      taskId: `${scenario.scenarioKey}-work-task`,
      minute: workCompletedMinute,
      durationMinutes: directTaskMinutes
    },
    {
      eventId: `${scenario.scenarioKey}-turnover-ready`,
      eventType: "task",
      action: "ready",
      taskId: `${scenario.scenarioKey}-room-alpha-turnover`,
      nurseId: "dashboard-nurse",
      minute: 30,
      scheduledMinute: 30
    },
    {
      eventId: `${scenario.scenarioKey}-turnover-started`,
      eventType: "task",
      action: "started",
      taskId: `${scenario.scenarioKey}-room-alpha-turnover`,
      nurseId: "dashboard-nurse",
      minute: turnoverStartMinute,
      startMinute: turnoverStartMinute
    },
    {
      eventId: `${scenario.scenarioKey}-turnover-delay`,
      eventType: "task",
      action: "delayed",
      taskId: `${scenario.scenarioKey}-room-alpha-turnover`,
      nurseId: "dashboard-nurse",
      minute: 30,
      delayMinutes: turnoverDelayMinutes
    },
    {
      eventId: `${scenario.scenarioKey}-turnover-completed`,
      eventType: "task",
      action: "completed",
      taskId: `${scenario.scenarioKey}-room-alpha-turnover`,
      nurseId: "dashboard-nurse",
      minute: turnoverCompletedMinute,
      completedMinute: turnoverCompletedMinute,
      durationMinutes: turnoverTaskMinutes
    }
  ];

  if (missedPressureMinutes > 0) {
    const missedMinute = Math.round(120 + missedPressureMinutes);
    events.push({
      eventId: `${scenario.scenarioKey}-overflow-missed`,
      eventType: "task",
      action: "missed",
      taskId: `${scenario.scenarioKey}-overflow-task`,
      nurseId: "dashboard-nurse",
      minute: missedMinute,
      scheduledMinute: 120,
      missReason: "not_started_shift_window_exceeded",
      projectedStartMinute: missedMinute,
      projectedTravelMinutes: travelMinutes,
      projectedCompletionMinute: Math.round(missedMinute + directTaskMinutes),
      shiftDurationMinutes: 120
    });
  }

  return {
    schemaVersion: "1.0.0",
    simulationRunId: `dashboard-proof-${scenario.scenarioKey}`,
    scenarioId: scenario.scenarioKey,
    generatedTaskSetId: `dashboard-proof-task-set-${scenario.scenarioKey}`,
    assignmentSetId: `dashboard-proof-assignment-${scenario.scenarioKey}`,
    events,
    summary: {
      totalTasks: missedPressureMinutes > 0 ? 3 : 2,
      completedTaskCount: 2,
      delayedTaskCount: 2,
      missedTaskCount: missedPressureMinutes > 0 ? 1 : 0,
      unassignedTaskCount: 0
    },
    limitations: [
      "Dashboard proof simulation events are deterministic inputs for shared outcome builders.",
      "Events use synthetic task and nurse IDs only."
    ]
  };
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
