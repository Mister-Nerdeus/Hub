import { PLAN_1_BURDEN_SCORE_WEIGHTS } from "../assignment/assignmentBurdenScore.js";
import {
  requireArray,
  requireBoolean,
  requireExactKeys,
  requireInteger,
  requireLiteralTrue,
  requirePositiveNumber,
  requireRecord,
  requireString
} from "../assignment/plan1AssignmentCommon.js";

export const PLAN_1_SIMULATION_ASSUMPTIONS_ID = "plan-1-simulation-assumptions-v1" as const;

export const PLAN_1_SIMULATION_NON_CLAIMS = [
  "Synthetic operational modeling only.",
  "Not a clinical safety score.",
  "Not a staffing compliance recommendation.",
  "Not a legal compliance assessment.",
  "Not a patient outcome prediction.",
  "Not based on real patient, staff, EHR, or hospital data."
] as const;

export const PLAN_1_STATUS_SEMANTICS = ["passed", "info", "warning", "blocking"] as const;

export type Plan1SimulationStatus = (typeof PLAN_1_STATUS_SEMANTICS)[number];

export type Plan1SimulationAssumptionsRegister = {
  schemaVersion: string;
  assumptionsId: typeof PLAN_1_SIMULATION_ASSUMPTIONS_ID;
  planId: "default-er-layout-plan-1";
  syntheticDataOnly: true;
  burdenScoreWeights: typeof PLAN_1_BURDEN_SCORE_WEIGHTS;
  walkingAssumptions: Record<string, unknown>;
  taskDurationAssumptions: Record<string, unknown>;
  taskFrequencyAssumptions: Record<string, unknown>;
  scenarioIntensityAssumptions: Record<string, unknown>;
  queueAssumptions: Record<string, unknown>;
  handoffAssumptions: Record<string, unknown>;
  interruptionAssumptions: Record<string, unknown>;
  overloadThresholds: {
    maxQueueDepthWarning: number;
    maxBusyMinutesWarning: number;
    maxDeferredTaskRatioWarning: number;
    maxWalkingFeetWarning: number;
  };
  statusSemantics: Record<Plan1SimulationStatus, { label: string; meaning: string; blocksProgress: boolean }>;
  limitations: string[];
  nonClaims: string[];
};

const ASSUMPTIONS_KEYS = [
  "schemaVersion",
  "assumptionsId",
  "planId",
  "syntheticDataOnly",
  "burdenScoreWeights",
  "walkingAssumptions",
  "taskDurationAssumptions",
  "taskFrequencyAssumptions",
  "scenarioIntensityAssumptions",
  "queueAssumptions",
  "handoffAssumptions",
  "interruptionAssumptions",
  "overloadThresholds",
  "statusSemantics",
  "limitations",
  "nonClaims"
];

export function validatePlan1SimulationAssumptions(value: unknown): Plan1SimulationAssumptionsRegister {
  const record = requireRecord(value, "assumptionsRegister");
  requireExactKeys(record, "assumptionsRegister", ASSUMPTIONS_KEYS);
  const assumptionsId = requireString(record.assumptionsId, "assumptionsRegister.assumptionsId");
  if (assumptionsId !== PLAN_1_SIMULATION_ASSUMPTIONS_ID) {
    throw new Error("assumptionsRegister.assumptionsId must be plan-1-simulation-assumptions-v1");
  }
  const planId = requireString(record.planId, "assumptionsRegister.planId");
  if (planId !== "default-er-layout-plan-1") {
    throw new Error("assumptionsRegister.planId must be default-er-layout-plan-1");
  }
  const burdenScoreWeights = validateBurdenScoreWeights(record.burdenScoreWeights);
  const overloadThresholds = validateOverloadThresholds(record.overloadThresholds);
  const statusSemantics = validateStatusSemantics(record.statusSemantics);
  const nonClaims = validateNonClaims(record.nonClaims, "assumptionsRegister.nonClaims");
  return {
    schemaVersion: requireString(record.schemaVersion, "assumptionsRegister.schemaVersion"),
    assumptionsId,
    planId,
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, "assumptionsRegister.syntheticDataOnly"),
    burdenScoreWeights,
    walkingAssumptions: requireRecord(record.walkingAssumptions, "assumptionsRegister.walkingAssumptions"),
    taskDurationAssumptions: requireRecord(
      record.taskDurationAssumptions,
      "assumptionsRegister.taskDurationAssumptions"
    ),
    taskFrequencyAssumptions: requireRecord(
      record.taskFrequencyAssumptions,
      "assumptionsRegister.taskFrequencyAssumptions"
    ),
    scenarioIntensityAssumptions: requireRecord(
      record.scenarioIntensityAssumptions,
      "assumptionsRegister.scenarioIntensityAssumptions"
    ),
    queueAssumptions: requireRecord(record.queueAssumptions, "assumptionsRegister.queueAssumptions"),
    handoffAssumptions: requireRecord(record.handoffAssumptions, "assumptionsRegister.handoffAssumptions"),
    interruptionAssumptions: requireRecord(
      record.interruptionAssumptions,
      "assumptionsRegister.interruptionAssumptions"
    ),
    overloadThresholds,
    statusSemantics,
    limitations: validateStringArray(record.limitations, "assumptionsRegister.limitations"),
    nonClaims
  };
}

export function validatePlan1NonClaims(value: unknown, label = "nonClaims"): string[] {
  return validateNonClaims(value, label);
}

export function hasPlan1NonClaims(value: { nonClaims?: unknown }): boolean {
  try {
    validatePlan1NonClaims(value.nonClaims);
    return true;
  } catch {
    return false;
  }
}

export function assertPlan1SyntheticOnly(value: unknown, label: string): true {
  return requireLiteralTrue(value, `${label}.syntheticDataOnly`);
}

export function validatePlan1Limitations(value: unknown, label = "limitations"): string[] {
  const limitations = validateStringArray(value, label);
  if (limitations.length === 0) {
    throw new Error(`${label} must include at least one limitation`);
  }
  return limitations;
}

function validateBurdenScoreWeights(value: unknown): typeof PLAN_1_BURDEN_SCORE_WEIGHTS {
  const actual = JSON.stringify(value);
  const expected = JSON.stringify(PLAN_1_BURDEN_SCORE_WEIGHTS);
  if (actual !== expected) {
    throw new Error("assumptionsRegister.burdenScoreWeights must match Plan 1 burden scoring constants");
  }
  return PLAN_1_BURDEN_SCORE_WEIGHTS;
}

function validateOverloadThresholds(value: unknown): Plan1SimulationAssumptionsRegister["overloadThresholds"] {
  const record = requireRecord(value, "assumptionsRegister.overloadThresholds");
  requireExactKeys(record, "assumptionsRegister.overloadThresholds", [
    "maxQueueDepthWarning",
    "maxBusyMinutesWarning",
    "maxDeferredTaskRatioWarning",
    "maxWalkingFeetWarning"
  ]);
  return {
    maxQueueDepthWarning: requireInteger(record.maxQueueDepthWarning, "overloadThresholds.maxQueueDepthWarning", 1),
    maxBusyMinutesWarning: requireInteger(record.maxBusyMinutesWarning, "overloadThresholds.maxBusyMinutesWarning", 1),
    maxDeferredTaskRatioWarning: requirePositiveNumber(
      record.maxDeferredTaskRatioWarning,
      "overloadThresholds.maxDeferredTaskRatioWarning"
    ),
    maxWalkingFeetWarning: requireInteger(record.maxWalkingFeetWarning, "overloadThresholds.maxWalkingFeetWarning", 1)
  };
}

function validateStatusSemantics(
  value: unknown
): Plan1SimulationAssumptionsRegister["statusSemantics"] {
  const record = requireRecord(value, "assumptionsRegister.statusSemantics");
  requireExactKeys(record, "assumptionsRegister.statusSemantics", [...PLAN_1_STATUS_SEMANTICS]);
  const result = {} as Plan1SimulationAssumptionsRegister["statusSemantics"];
  for (const status of PLAN_1_STATUS_SEMANTICS) {
    const statusRecord = requireRecord(record[status], `statusSemantics.${status}`);
    requireExactKeys(statusRecord, `statusSemantics.${status}`, ["label", "meaning", "blocksProgress"]);
    result[status] = {
      label: requireString(statusRecord.label, `statusSemantics.${status}.label`),
      meaning: requireString(statusRecord.meaning, `statusSemantics.${status}.meaning`),
      blocksProgress: requireBoolean(statusRecord.blocksProgress, `statusSemantics.${status}.blocksProgress`)
    };
  }
  if (result.passed.blocksProgress || result.info.blocksProgress || result.warning.blocksProgress) {
    throw new Error("Only blocking status may block progress");
  }
  if (!result.blocking.blocksProgress) {
    throw new Error("blocking status must block progress");
  }
  return result;
}

function validateNonClaims(value: unknown, label: string): string[] {
  const nonClaims = validateStringArray(value, label);
  for (const required of PLAN_1_SIMULATION_NON_CLAIMS) {
    if (!nonClaims.includes(required)) {
      throw new Error(`${label} must include required non-claim: ${required}`);
    }
  }
  return nonClaims;
}

function validateStringArray(value: unknown, label: string): string[] {
  const array = requireArray(value, label);
  if (array.length === 0) {
    throw new Error(`${label} must not be empty`);
  }
  return array.map((entry, index) => requireString(entry, `${label}[${index}]`));
}
