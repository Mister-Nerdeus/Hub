import {
  DRY_RUN_COMPARISON_PROOF_SCHEMA_VERSION,
  type DryRunComparisonProof,
  type DryRunComparisonRunSummary
} from "./dryRunComparisonProof.js";

export function validateDryRunComparisonProof(value: unknown): DryRunComparisonProof {
  const proof = requireRecord(value, "dryRunComparisonProof");
  requireExactKeys(proof, "dryRunComparisonProof", [
    "schemaVersion",
    "proofId",
    "sharedInputs",
    "runs",
    "limitationCopy",
    "dryRunStatus",
    "optimizerStatus",
    "assignmentRecommendationStatus",
    "clinicalSafetyClaim",
    "staffingComplianceClaim",
    "patientOutcomeClaim",
    "syntheticDataOnly"
  ]);
  const sharedInputs = validateSharedInputs(proof.sharedInputs);
  const runs = requireArray(proof.runs, "runs").map(validateRunSummary);
  if (runs.length !== 2) throw new Error("dry-run comparison proof requires exactly two run summaries");
  const ratioPresetIds = runs.map((run) => run.ratioPresetId).sort();
  if (ratioPresetIds.join("|") !== "four_to_one|three_to_one") {
    throw new Error("dry-run comparison proof must include 4:1 and 3:1 runs");
  }
  for (const run of runs) {
    if (run.canonicalScenarioSeedId !== sharedInputs.canonicalScenarioSeedId) {
      throw new Error("dry-run comparison runs must share the canonical scenario seed");
    }
    if (run.activityProfileId !== sharedInputs.activityProfileId) {
      throw new Error("dry-run comparison runs must share the activity profile");
    }
    if (run.neutralWorkloadSeedId !== sharedInputs.neutralWorkloadSeedId) {
      throw new Error("dry-run comparison runs must share the neutral workload seed");
    }
    if (!sharedInputs.ratioRuntimeSeedIds.includes(run.ratioRuntimeSeedId)) {
      throw new Error("dry-run comparison runs must use declared ratio runtime seeds");
    }
  }
  return {
    schemaVersion: requireLiteral(proof.schemaVersion, DRY_RUN_COMPARISON_PROOF_SCHEMA_VERSION, "schemaVersion"),
    proofId: requireLiteral(
      proof.proofId,
      "dry-run-ratio-comparison-proof-canonical-plan-1",
      "proofId"
    ),
    sharedInputs,
    runs: runs as unknown as DryRunComparisonProof["runs"],
    limitationCopy: validateStringArray(proof.limitationCopy, "limitationCopy"),
    dryRunStatus: requireLiteral(proof.dryRunStatus, "internal_dry_run_shell_only", "dryRunStatus"),
    optimizerStatus: requireLiteral(proof.optimizerStatus, "not_started", "optimizerStatus"),
    assignmentRecommendationStatus: requireLiteral(
      proof.assignmentRecommendationStatus,
      "not_started",
      "assignmentRecommendationStatus"
    ),
    clinicalSafetyClaim: requireBooleanLiteral(proof.clinicalSafetyClaim, false, "clinicalSafetyClaim"),
    staffingComplianceClaim: requireBooleanLiteral(proof.staffingComplianceClaim, false, "staffingComplianceClaim"),
    patientOutcomeClaim: requireBooleanLiteral(proof.patientOutcomeClaim, false, "patientOutcomeClaim"),
    syntheticDataOnly: requireBooleanLiteral(proof.syntheticDataOnly, true, "syntheticDataOnly")
  };
}

function validateSharedInputs(value: unknown): DryRunComparisonProof["sharedInputs"] {
  const shared = requireRecord(value, "sharedInputs");
  requireExactKeys(shared, "sharedInputs", [
    "canonicalScenarioSeedId",
    "canonicalFloorplanId",
    "capacityReportReference",
    "roomLoadContractId",
    "activityProfileId",
    "neutralWorkloadSeedId",
    "ratioRuntimeSeedIds",
    "taskTemplateIds",
    "usesCanonicalCapacityReport",
    "usesSplitBayFixtureBridge",
    "usesRawRoomCounts",
    "usesStorageOrSupportForTasks",
    "sharedWorkloadGeneration"
  ]);
  return {
    canonicalScenarioSeedId: requireLiteral(
      shared.canonicalScenarioSeedId,
      "scenario-seed-canonical-plan-1-foundation",
      "canonicalScenarioSeedId"
    ),
    canonicalFloorplanId: requireLiteral(shared.canonicalFloorplanId, "default-er-layout-plan-1", "canonicalFloorplanId"),
    capacityReportReference: requireLiteral(
      shared.capacityReportReference,
      "docs/verification/canonical-capacity-count-report.json",
      "capacityReportReference"
    ),
    roomLoadContractId: requireLiteral(shared.roomLoadContractId, "room-load-starter-canonical-plan-1", "roomLoadContractId"),
    activityProfileId: requireLiteral(shared.activityProfileId, "typical", "activityProfileId"),
    neutralWorkloadSeedId: requireLiteral(
      shared.neutralWorkloadSeedId,
      "neutral-workload-seed-canonical-plan-1",
      "neutralWorkloadSeedId"
    ),
    ratioRuntimeSeedIds: validateRatioRuntimeSeedIds(shared.ratioRuntimeSeedIds),
    taskTemplateIds: validateStringArray(shared.taskTemplateIds, "taskTemplateIds"),
    usesCanonicalCapacityReport: requireBooleanLiteral(shared.usesCanonicalCapacityReport, true, "usesCanonicalCapacityReport"),
    usesSplitBayFixtureBridge: requireBooleanLiteral(shared.usesSplitBayFixtureBridge, true, "usesSplitBayFixtureBridge"),
    usesRawRoomCounts: requireBooleanLiteral(shared.usesRawRoomCounts, false, "usesRawRoomCounts"),
    usesStorageOrSupportForTasks: requireBooleanLiteral(
      shared.usesStorageOrSupportForTasks,
      false,
      "usesStorageOrSupportForTasks"
    ),
    sharedWorkloadGeneration: requireLiteral(
      shared.sharedWorkloadGeneration,
      "ratio_neutral",
      "sharedWorkloadGeneration"
    )
  };
}

function validateRunSummary(value: unknown): DryRunComparisonRunSummary {
  const run = requireRecord(value, "run");
  requireExactKeys(run, "run", [
    "runId",
    "ratioPresetId",
    "ratioLabel",
    "patientsPerNurse",
    "canonicalScenarioSeedId",
    "canonicalFloorplanId",
    "capacityReportReference",
    "roomLoadContractId",
    "activityProfileId",
    "neutralWorkloadSeedId",
    "ratioRuntimeSeedId",
    "taskTemplateCount",
    "generatedTaskCount",
    "syntheticNurseRuntimeGroupCount",
    "queuePlaceholderCount",
    "delayedTaskPlaceholderCount",
    "optimizerStatus",
    "assignmentRecommendationStatus",
    "syntheticDataOnly"
  ]);
  return {
    runId: requireEnum(run.runId, ["dry-run-proof-four-to-one", "dry-run-proof-three-to-one"], "runId"),
    ratioPresetId: requireEnum(run.ratioPresetId, ["four_to_one", "three_to_one"], "ratioPresetId"),
    ratioLabel: requireEnum(run.ratioLabel, ["4:1", "3:1"], "ratioLabel"),
    patientsPerNurse: requireEnum(run.patientsPerNurse, [4, 3], "patientsPerNurse"),
    canonicalScenarioSeedId: requireLiteral(
      run.canonicalScenarioSeedId,
      "scenario-seed-canonical-plan-1-foundation",
      "canonicalScenarioSeedId"
    ),
    canonicalFloorplanId: requireLiteral(run.canonicalFloorplanId, "default-er-layout-plan-1", "canonicalFloorplanId"),
    capacityReportReference: requireLiteral(
      run.capacityReportReference,
      "docs/verification/canonical-capacity-count-report.json",
      "capacityReportReference"
    ),
    roomLoadContractId: requireLiteral(run.roomLoadContractId, "room-load-starter-canonical-plan-1", "roomLoadContractId"),
    activityProfileId: requireLiteral(run.activityProfileId, "typical", "activityProfileId"),
    neutralWorkloadSeedId: requireLiteral(run.neutralWorkloadSeedId, "neutral-workload-seed-canonical-plan-1", "neutralWorkloadSeedId"),
    ratioRuntimeSeedId: requireEnum(
      run.ratioRuntimeSeedId,
      ["runtime-seed-canonical-plan-1-four-to-one", "runtime-seed-canonical-plan-1-three-to-one"],
      "ratioRuntimeSeedId"
    ),
    taskTemplateCount: requireNonNegativeInteger(run.taskTemplateCount, "taskTemplateCount"),
    generatedTaskCount: requireNonNegativeInteger(run.generatedTaskCount, "generatedTaskCount"),
    syntheticNurseRuntimeGroupCount: requireNonNegativeInteger(
      run.syntheticNurseRuntimeGroupCount,
      "syntheticNurseRuntimeGroupCount"
    ),
    queuePlaceholderCount: requireNonNegativeInteger(run.queuePlaceholderCount, "queuePlaceholderCount"),
    delayedTaskPlaceholderCount: requireNonNegativeInteger(run.delayedTaskPlaceholderCount, "delayedTaskPlaceholderCount"),
    optimizerStatus: requireLiteral(run.optimizerStatus, "not_started", "optimizerStatus"),
    assignmentRecommendationStatus: requireLiteral(
      run.assignmentRecommendationStatus,
      "not_started",
      "assignmentRecommendationStatus"
    ),
    syntheticDataOnly: requireBooleanLiteral(run.syntheticDataOnly, true, "syntheticDataOnly")
  };
}

function validateRatioRuntimeSeedIds(value: unknown): [
  "runtime-seed-canonical-plan-1-four-to-one",
  "runtime-seed-canonical-plan-1-three-to-one"
] {
  const values = validateStringArray(value, "ratioRuntimeSeedIds");
  if (
    values.length !== 2 ||
    values[0] !== "runtime-seed-canonical-plan-1-four-to-one" ||
    values[1] !== "runtime-seed-canonical-plan-1-three-to-one"
  ) {
    throw new Error("ratioRuntimeSeedIds must list 4:1 and 3:1 runtime seeds in order");
  }
  return values as [
    "runtime-seed-canonical-plan-1-four-to-one",
    "runtime-seed-canonical-plan-1-three-to-one"
  ];
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

function validateStringArray(value: unknown, label: string): string[] {
  const values = requireArray(value, label).map((item, index) => {
    if (typeof item !== "string" || item.length === 0) throw new Error(`${label}[${index}] must be a non-empty string`);
    return item;
  });
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${label} are not allowed`);
  return values;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) throw new Error(`${label} must be ${expected}`);
  return expected;
}

function requireBooleanLiteral<T extends boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) throw new Error(`${label} must be ${String(expected)}`);
  return expected;
}

function requireEnum<T extends string | number>(value: unknown, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  return value as T;
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) throw new Error(`${label} must be a non-negative integer`);
  return Number(value);
}
