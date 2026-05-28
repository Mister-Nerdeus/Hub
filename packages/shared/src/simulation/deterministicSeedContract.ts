import type { ActivityProfileId } from "../scenarios/activityProfileContract.js";
import {
  CANONICAL_SCENARIO_SEED_ID
} from "../scenarios/canonicalScenarioSeedContract.js";
import type { RatioPresetId } from "../scenarios/ratioPresetContract.js";
import { INTERNAL_DRY_RUN_DETERMINISTIC_SEED_ID } from "./simulationRunContract.js";

export const DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION = "1.0.0" as const;
export const NEUTRAL_WORKLOAD_SEED_ID = "neutral-workload-seed-canonical-plan-1" as const;
export const FOUR_TO_ONE_RUNTIME_SEED_ID = "runtime-seed-canonical-plan-1-four-to-one" as const;
export const THREE_TO_ONE_RUNTIME_SEED_ID = "runtime-seed-canonical-plan-1-three-to-one" as const;
export const RATIO_RUNTIME_SEED_IDS = [
  FOUR_TO_ONE_RUNTIME_SEED_ID,
  THREE_TO_ONE_RUNTIME_SEED_ID
] as const;

export type DeterministicDryRunSeedContract = {
  schemaVersion: typeof DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION;
  seedId: typeof INTERNAL_DRY_RUN_DETERMINISTIC_SEED_ID;
  seedValue: string;
  canonicalScenarioSeedId: typeof CANONICAL_SCENARIO_SEED_ID;
  activityProfileId: ActivityProfileId;
  ratioPresetId: RatioPresetId;
  reproducibilityNote: "same dry-run inputs and seed produce the same synthetic sequence";
  hiddenRandomnessStatus: "forbidden";
  currentTimeDependencyStatus: "forbidden";
  syntheticDataOnly: true;
  optimizerStatus: "not_started";
};

export type NeutralWorkloadSeedContract = {
  schemaVersion: typeof DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION;
  seedId: typeof NEUTRAL_WORKLOAD_SEED_ID;
  seedValue: string;
  namespace: "workload";
  canonicalScenarioSeedId: typeof CANONICAL_SCENARIO_SEED_ID;
  activityProfileId: ActivityProfileId;
  ratioPresetBinding: "ratio_neutral";
  reproducibilityNote: "same workload seed produces the same synthetic workload across ratio presets";
  hiddenRandomnessStatus: "forbidden";
  currentTimeDependencyStatus: "forbidden";
  syntheticDataOnly: true;
  optimizerStatus: "not_started";
};

export type RatioRuntimeSeedContract = {
  schemaVersion: typeof DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION;
  seedId: typeof FOUR_TO_ONE_RUNTIME_SEED_ID | typeof THREE_TO_ONE_RUNTIME_SEED_ID;
  seedValue: string;
  namespace: "ratio_runtime";
  canonicalScenarioSeedId: typeof CANONICAL_SCENARIO_SEED_ID;
  activityProfileId: ActivityProfileId;
  ratioPresetId: RatioPresetId;
  reproducibilityNote: "same ratio runtime seed produces the same synthetic runtime sequence for that ratio";
  hiddenRandomnessStatus: "forbidden";
  currentTimeDependencyStatus: "forbidden";
  syntheticDataOnly: true;
  optimizerStatus: "not_started";
};

export const deterministicDryRunSeedContract: DeterministicDryRunSeedContract = {
  schemaVersion: DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION,
  seedId: INTERNAL_DRY_RUN_DETERMINISTIC_SEED_ID,
  seedValue: "dry-run-seed-v0-canonical-plan-1",
  canonicalScenarioSeedId: CANONICAL_SCENARIO_SEED_ID,
  activityProfileId: "typical",
  ratioPresetId: "four_to_one",
  reproducibilityNote: "same dry-run inputs and seed produce the same synthetic sequence",
  hiddenRandomnessStatus: "forbidden",
  currentTimeDependencyStatus: "forbidden",
  syntheticDataOnly: true,
  optimizerStatus: "not_started"
};

export const neutralWorkloadSeedContract: NeutralWorkloadSeedContract = {
  schemaVersion: DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION,
  seedId: NEUTRAL_WORKLOAD_SEED_ID,
  seedValue: "simulation-v0-neutral-workload-canonical-plan-1",
  namespace: "workload",
  canonicalScenarioSeedId: CANONICAL_SCENARIO_SEED_ID,
  activityProfileId: "typical",
  ratioPresetBinding: "ratio_neutral",
  reproducibilityNote: "same workload seed produces the same synthetic workload across ratio presets",
  hiddenRandomnessStatus: "forbidden",
  currentTimeDependencyStatus: "forbidden",
  syntheticDataOnly: true,
  optimizerStatus: "not_started"
};

export const fourToOneRuntimeSeedContract: RatioRuntimeSeedContract = {
  schemaVersion: DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION,
  seedId: FOUR_TO_ONE_RUNTIME_SEED_ID,
  seedValue: "simulation-v0-runtime-canonical-plan-1-four-to-one",
  namespace: "ratio_runtime",
  canonicalScenarioSeedId: CANONICAL_SCENARIO_SEED_ID,
  activityProfileId: "typical",
  ratioPresetId: "four_to_one",
  reproducibilityNote: "same ratio runtime seed produces the same synthetic runtime sequence for that ratio",
  hiddenRandomnessStatus: "forbidden",
  currentTimeDependencyStatus: "forbidden",
  syntheticDataOnly: true,
  optimizerStatus: "not_started"
};

export const threeToOneRuntimeSeedContract: RatioRuntimeSeedContract = {
  ...fourToOneRuntimeSeedContract,
  seedId: THREE_TO_ONE_RUNTIME_SEED_ID,
  seedValue: "simulation-v0-runtime-canonical-plan-1-three-to-one",
  ratioPresetId: "three_to_one"
};

export const ratioRuntimeSeedContracts = [
  fourToOneRuntimeSeedContract,
  threeToOneRuntimeSeedContract
] as const;

export function validateDeterministicDryRunSeedContract(
  value: unknown
): DeterministicDryRunSeedContract {
  const contract = requireRecord(value, "deterministicDryRunSeed");
  requireExactKeys(contract, "deterministicDryRunSeed", [
    "schemaVersion",
    "seedId",
    "seedValue",
    "canonicalScenarioSeedId",
    "activityProfileId",
    "ratioPresetId",
    "reproducibilityNote",
    "hiddenRandomnessStatus",
    "currentTimeDependencyStatus",
    "syntheticDataOnly",
    "optimizerStatus"
  ]);
  return {
    schemaVersion: requireLiteral(
      contract.schemaVersion,
      DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION,
      "schemaVersion"
    ),
    seedId: requireLiteral(contract.seedId, INTERNAL_DRY_RUN_DETERMINISTIC_SEED_ID, "seedId"),
    seedValue: requireString(contract.seedValue, "seedValue"),
    canonicalScenarioSeedId: requireLiteral(
      contract.canonicalScenarioSeedId,
      CANONICAL_SCENARIO_SEED_ID,
      "canonicalScenarioSeedId"
    ),
    activityProfileId: requireEnum(contract.activityProfileId, ["typical", "busy", "slammed"], "activityProfileId"),
    ratioPresetId: requireEnum(contract.ratioPresetId, ["four_to_one", "three_to_one"], "ratioPresetId"),
    reproducibilityNote: requireLiteral(
      contract.reproducibilityNote,
      "same dry-run inputs and seed produce the same synthetic sequence",
      "reproducibilityNote"
    ),
    hiddenRandomnessStatus: requireLiteral(
      contract.hiddenRandomnessStatus,
      "forbidden",
      "hiddenRandomnessStatus"
    ),
    currentTimeDependencyStatus: requireLiteral(
      contract.currentTimeDependencyStatus,
      "forbidden",
      "currentTimeDependencyStatus"
    ),
    syntheticDataOnly: requireBooleanLiteral(contract.syntheticDataOnly, true, "syntheticDataOnly"),
    optimizerStatus: requireLiteral(contract.optimizerStatus, "not_started", "optimizerStatus")
  };
}

export function validateNeutralWorkloadSeedContract(value: unknown): NeutralWorkloadSeedContract {
  const contract = requireRecord(value, "neutralWorkloadSeed");
  requireExactKeys(contract, "neutralWorkloadSeed", [
    "schemaVersion",
    "seedId",
    "seedValue",
    "namespace",
    "canonicalScenarioSeedId",
    "activityProfileId",
    "ratioPresetBinding",
    "reproducibilityNote",
    "hiddenRandomnessStatus",
    "currentTimeDependencyStatus",
    "syntheticDataOnly",
    "optimizerStatus"
  ]);
  return {
    schemaVersion: requireLiteral(
      contract.schemaVersion,
      DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION,
      "schemaVersion"
    ),
    seedId: requireLiteral(contract.seedId, NEUTRAL_WORKLOAD_SEED_ID, "seedId"),
    seedValue: requireString(contract.seedValue, "seedValue"),
    namespace: requireLiteral(contract.namespace, "workload", "namespace"),
    canonicalScenarioSeedId: requireLiteral(
      contract.canonicalScenarioSeedId,
      CANONICAL_SCENARIO_SEED_ID,
      "canonicalScenarioSeedId"
    ),
    activityProfileId: requireEnum(contract.activityProfileId, ["typical", "busy", "slammed"], "activityProfileId"),
    ratioPresetBinding: requireLiteral(
      contract.ratioPresetBinding,
      "ratio_neutral",
      "ratioPresetBinding"
    ),
    reproducibilityNote: requireLiteral(
      contract.reproducibilityNote,
      "same workload seed produces the same synthetic workload across ratio presets",
      "reproducibilityNote"
    ),
    hiddenRandomnessStatus: requireLiteral(
      contract.hiddenRandomnessStatus,
      "forbidden",
      "hiddenRandomnessStatus"
    ),
    currentTimeDependencyStatus: requireLiteral(
      contract.currentTimeDependencyStatus,
      "forbidden",
      "currentTimeDependencyStatus"
    ),
    syntheticDataOnly: requireBooleanLiteral(contract.syntheticDataOnly, true, "syntheticDataOnly"),
    optimizerStatus: requireLiteral(contract.optimizerStatus, "not_started", "optimizerStatus")
  };
}

export function validateRatioRuntimeSeedContract(value: unknown): RatioRuntimeSeedContract {
  const contract = requireRecord(value, "ratioRuntimeSeed");
  requireExactKeys(contract, "ratioRuntimeSeed", [
    "schemaVersion",
    "seedId",
    "seedValue",
    "namespace",
    "canonicalScenarioSeedId",
    "activityProfileId",
    "ratioPresetId",
    "reproducibilityNote",
    "hiddenRandomnessStatus",
    "currentTimeDependencyStatus",
    "syntheticDataOnly",
    "optimizerStatus"
  ]);
  const ratioPresetId = requireEnum(contract.ratioPresetId, ["four_to_one", "three_to_one"], "ratioPresetId");
  const seedId = requireEnum(contract.seedId, RATIO_RUNTIME_SEED_IDS, "seedId");
  if (ratioPresetId === "four_to_one" && seedId !== FOUR_TO_ONE_RUNTIME_SEED_ID) {
    throw new Error("4:1 runtime seed must use the 4:1 seed id");
  }
  if (ratioPresetId === "three_to_one" && seedId !== THREE_TO_ONE_RUNTIME_SEED_ID) {
    throw new Error("3:1 runtime seed must use the 3:1 seed id");
  }
  return {
    schemaVersion: requireLiteral(
      contract.schemaVersion,
      DETERMINISTIC_DRY_RUN_SEED_SCHEMA_VERSION,
      "schemaVersion"
    ),
    seedId,
    seedValue: requireString(contract.seedValue, "seedValue"),
    namespace: requireLiteral(contract.namespace, "ratio_runtime", "namespace"),
    canonicalScenarioSeedId: requireLiteral(
      contract.canonicalScenarioSeedId,
      CANONICAL_SCENARIO_SEED_ID,
      "canonicalScenarioSeedId"
    ),
    activityProfileId: requireEnum(contract.activityProfileId, ["typical", "busy", "slammed"], "activityProfileId"),
    ratioPresetId,
    reproducibilityNote: requireLiteral(
      contract.reproducibilityNote,
      "same ratio runtime seed produces the same synthetic runtime sequence for that ratio",
      "reproducibilityNote"
    ),
    hiddenRandomnessStatus: requireLiteral(
      contract.hiddenRandomnessStatus,
      "forbidden",
      "hiddenRandomnessStatus"
    ),
    currentTimeDependencyStatus: requireLiteral(
      contract.currentTimeDependencyStatus,
      "forbidden",
      "currentTimeDependencyStatus"
    ),
    syntheticDataOnly: requireBooleanLiteral(contract.syntheticDataOnly, true, "syntheticDataOnly"),
    optimizerStatus: requireLiteral(contract.optimizerStatus, "not_started", "optimizerStatus")
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
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not allowed`);
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
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
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
