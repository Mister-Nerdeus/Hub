import type {
  ManualAssignmentScenarioBridgeInput
} from "../scenarios/manualAssignmentScenarioBridge.js";
import type { RatioPresetContract } from "../scenarios/ratioPresetContract.js";
import type { ScenarioCapacityIntegration } from "../scenarios/scenarioCapacityIntegration.js";

export const NURSE_RUNTIME_STATE_SCHEMA_VERSION = "1.0.0" as const;
export const NURSE_AVAILABILITY_STATES = ["available", "busy_placeholder", "queued_placeholder"] as const;
export type NurseAvailabilityState = (typeof NURSE_AVAILABILITY_STATES)[number];

export type NurseRuntimeState = {
  syntheticNurseId: string;
  syntheticNurseLabel: string;
  assignedBedPositionIds: readonly string[];
  activePlaceholderTaskIds: readonly string[];
  queuedPlaceholderTaskIds: readonly string[];
  availabilityState: NurseAvailabilityState;
  ratioPresetId: RatioPresetContract["presetId"];
  dryRunStatus: "internal_dry_run_shell_only";
  syntheticDataOnly: true;
};

export type NurseRuntimeStateSet = {
  schemaVersion: typeof NURSE_RUNTIME_STATE_SCHEMA_VERSION;
  runtimeStateSetId: "nurse-runtime-state-canonical-plan-1";
  manualAssignmentBridgeId: ManualAssignmentScenarioBridgeInput["bridgeId"];
  states: readonly NurseRuntimeState[];
  recommendationStatus: "not_started";
  optimizerStatus: "not_started";
  staffingComplianceClaim: false;
  clinicalSafetyClaim: false;
  syntheticDataOnly: true;
};

export function buildNurseRuntimeStatesFromManualBridge(
  bridge: ManualAssignmentScenarioBridgeInput,
  context: { ratioPreset: RatioPresetContract }
): NurseRuntimeStateSet {
  return {
    schemaVersion: NURSE_RUNTIME_STATE_SCHEMA_VERSION,
    runtimeStateSetId: "nurse-runtime-state-canonical-plan-1",
    manualAssignmentBridgeId: bridge.bridgeId,
    states: bridge.assignmentGroups.map((group, index) => ({
      syntheticNurseId: `synthetic-nurse-${String(index + 1).padStart(2, "0")}`,
      syntheticNurseLabel: group.syntheticNurseLabel,
      assignedBedPositionIds: [...group.assignedBedPositionIds],
      activePlaceholderTaskIds: [],
      queuedPlaceholderTaskIds: [],
      availabilityState: "available",
      ratioPresetId: context.ratioPreset.presetId,
      dryRunStatus: "internal_dry_run_shell_only",
      syntheticDataOnly: true
    })),
    recommendationStatus: "not_started",
    optimizerStatus: "not_started",
    staffingComplianceClaim: false,
    clinicalSafetyClaim: false,
    syntheticDataOnly: true
  };
}

export function validateNurseRuntimeStateSet(
  value: unknown,
  context: { capacity: ScenarioCapacityIntegration }
): NurseRuntimeStateSet {
  const set = requireRecord(value, "nurseRuntimeStateSet");
  requireExactKeys(set, "nurseRuntimeStateSet", [
    "schemaVersion",
    "runtimeStateSetId",
    "manualAssignmentBridgeId",
    "states",
    "recommendationStatus",
    "optimizerStatus",
    "staffingComplianceClaim",
    "clinicalSafetyClaim",
    "syntheticDataOnly"
  ]);
  const states = requireArray(set.states, "states").map((state) =>
    validateNurseRuntimeState(state, context)
  );
  requireUnique(
    "synthetic nurse ids",
    states.map((state) => state.syntheticNurseId)
  );
  return {
    schemaVersion: requireLiteral(set.schemaVersion, NURSE_RUNTIME_STATE_SCHEMA_VERSION, "schemaVersion"),
    runtimeStateSetId: requireLiteral(
      set.runtimeStateSetId,
      "nurse-runtime-state-canonical-plan-1",
      "runtimeStateSetId"
    ),
    manualAssignmentBridgeId: requireLiteral(
      set.manualAssignmentBridgeId,
      "manual-assignment-scenario-bridge-canonical-plan-1",
      "manualAssignmentBridgeId"
    ),
    states,
    recommendationStatus: requireLiteral(set.recommendationStatus, "not_started", "recommendationStatus"),
    optimizerStatus: requireLiteral(set.optimizerStatus, "not_started", "optimizerStatus"),
    staffingComplianceClaim: requireBooleanLiteral(
      set.staffingComplianceClaim,
      false,
      "staffingComplianceClaim"
    ),
    clinicalSafetyClaim: requireBooleanLiteral(set.clinicalSafetyClaim, false, "clinicalSafetyClaim"),
    syntheticDataOnly: requireBooleanLiteral(set.syntheticDataOnly, true, "syntheticDataOnly")
  };
}

function validateNurseRuntimeState(
  value: unknown,
  context: { capacity: ScenarioCapacityIntegration }
): NurseRuntimeState {
  const state = requireRecord(value, "nurseRuntimeState");
  requireExactKeys(state, "nurseRuntimeState", [
    "syntheticNurseId",
    "syntheticNurseLabel",
    "assignedBedPositionIds",
    "activePlaceholderTaskIds",
    "queuedPlaceholderTaskIds",
    "availabilityState",
    "ratioPresetId",
    "dryRunStatus",
    "syntheticDataOnly"
  ]);
  const syntheticNurseId = requireString(state.syntheticNurseId, "syntheticNurseId");
  const syntheticNurseLabel = requireString(state.syntheticNurseLabel, "syntheticNurseLabel");
  if (!/^synthetic-nurse-\d{2}$/u.test(syntheticNurseId)) {
    throw new Error("nurse runtime state must use synthetic nurse ids only");
  }
  if (!/^Synthetic Nurse [A-Z]$/u.test(syntheticNurseLabel)) {
    throw new Error("nurse runtime state must use synthetic nurse labels only");
  }
  const assignedBedPositionIds = validateBedPositionIds(state.assignedBedPositionIds, context);
  return {
    syntheticNurseId,
    syntheticNurseLabel,
    assignedBedPositionIds,
    activePlaceholderTaskIds: validateStringArray(state.activePlaceholderTaskIds, "activePlaceholderTaskIds"),
    queuedPlaceholderTaskIds: validateStringArray(state.queuedPlaceholderTaskIds, "queuedPlaceholderTaskIds"),
    availabilityState: requireEnum(state.availabilityState, NURSE_AVAILABILITY_STATES, "availabilityState"),
    ratioPresetId: requireEnum(state.ratioPresetId, ["four_to_one", "three_to_one"], "ratioPresetId"),
    dryRunStatus: requireLiteral(state.dryRunStatus, "internal_dry_run_shell_only", "dryRunStatus"),
    syntheticDataOnly: requireBooleanLiteral(state.syntheticDataOnly, true, "syntheticDataOnly")
  };
}

function validateBedPositionIds(value: unknown, context: { capacity: ScenarioCapacityIntegration }): string[] {
  const values = validateStringArray(value, "assignedBedPositionIds");
  for (const id of values) {
    if (!context.capacity.assignmentEligibleBedPositionIds.includes(id)) {
      throw new Error("nurse runtime state assigned positions must be selector-eligible");
    }
    if (context.capacity.excludedObjectIds.includes(id)) {
      throw new Error("nurse runtime state assigned positions must exclude storage and support spaces");
    }
  }
  return values;
}

function validateStringArray(value: unknown, label: string): string[] {
  const values = requireArray(value, label).map((item, index) => requireString(item, `${label}[${index}]`));
  requireUnique(label, values);
  return values;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not allowed`);
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) throw new Error(`${label} must be ${expected}`);
  return expected;
}

function requireBooleanLiteral<T extends boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) throw new Error(`${label} must be ${String(expected)}`);
  return expected;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  return value as T;
}

function requireUnique(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${label} are not allowed`);
}
