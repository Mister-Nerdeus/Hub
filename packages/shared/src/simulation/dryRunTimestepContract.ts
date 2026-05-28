export const DRY_RUN_TIMESTEP_SCHEMA_VERSION = "1.0.0" as const;

export type DryRunTimestepContract = {
  schemaVersion: typeof DRY_RUN_TIMESTEP_SCHEMA_VERSION;
  timestepContractId: "dry-run-timestep-shell-canonical-plan-1";
  stepDurationMinutes: number;
  maxDurationMinutes: number;
  maxStepCount: number;
  boundedWindow: true;
  deterministicOrdering: true;
  realTimeAccuracyClaim: false;
  clinicalTimingClaim: false;
  syntheticDataOnly: true;
  optimizerStatus: "not_started";
};

export type DryRunTimestep = {
  tickIndex: number;
  syntheticMinuteOffset: number;
  stepDurationMinutes: number;
  dryRunStatus: "internal_dry_run_shell_only";
};

export const dryRunTimestepContract: DryRunTimestepContract = {
  schemaVersion: DRY_RUN_TIMESTEP_SCHEMA_VERSION,
  timestepContractId: "dry-run-timestep-shell-canonical-plan-1",
  stepDurationMinutes: 15,
  maxDurationMinutes: 240,
  maxStepCount: 16,
  boundedWindow: true,
  deterministicOrdering: true,
  realTimeAccuracyClaim: false,
  clinicalTimingClaim: false,
  syntheticDataOnly: true,
  optimizerStatus: "not_started"
};

export function buildDryRunTimesteps(
  contract: DryRunTimestepContract = dryRunTimestepContract
): DryRunTimestep[] {
  const validated = validateDryRunTimestepContract(contract);
  return Array.from({ length: validated.maxStepCount }, (_, tickIndex) => ({
    tickIndex,
    syntheticMinuteOffset: tickIndex * validated.stepDurationMinutes,
    stepDurationMinutes: validated.stepDurationMinutes,
    dryRunStatus: "internal_dry_run_shell_only"
  }));
}

export function validateDryRunTimestepContract(value: unknown): DryRunTimestepContract {
  const contract = requireRecord(value, "dryRunTimestep");
  requireExactKeys(contract, "dryRunTimestep", [
    "schemaVersion",
    "timestepContractId",
    "stepDurationMinutes",
    "maxDurationMinutes",
    "maxStepCount",
    "boundedWindow",
    "deterministicOrdering",
    "realTimeAccuracyClaim",
    "clinicalTimingClaim",
    "syntheticDataOnly",
    "optimizerStatus"
  ]);
  const stepDurationMinutes = requireInteger(contract.stepDurationMinutes, "stepDurationMinutes", 1);
  const maxDurationMinutes = requireInteger(contract.maxDurationMinutes, "maxDurationMinutes", 1);
  const maxStepCount = requireInteger(contract.maxStepCount, "maxStepCount", 1);
  if (stepDurationMinutes * maxStepCount > maxDurationMinutes) {
    throw new Error("dry-run timestep window must be bounded by maxDurationMinutes");
  }
  return {
    schemaVersion: requireLiteral(contract.schemaVersion, DRY_RUN_TIMESTEP_SCHEMA_VERSION, "schemaVersion"),
    timestepContractId: requireLiteral(
      contract.timestepContractId,
      "dry-run-timestep-shell-canonical-plan-1",
      "timestepContractId"
    ),
    stepDurationMinutes,
    maxDurationMinutes,
    maxStepCount,
    boundedWindow: requireBooleanLiteral(contract.boundedWindow, true, "boundedWindow"),
    deterministicOrdering: requireBooleanLiteral(
      contract.deterministicOrdering,
      true,
      "deterministicOrdering"
    ),
    realTimeAccuracyClaim: requireBooleanLiteral(
      contract.realTimeAccuracyClaim,
      false,
      "realTimeAccuracyClaim"
    ),
    clinicalTimingClaim: requireBooleanLiteral(
      contract.clinicalTimingClaim,
      false,
      "clinicalTimingClaim"
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

function requireInteger(value: unknown, label: string, min: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (value < min) throw new Error(`${label} must be greater than or equal to ${min}`);
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
