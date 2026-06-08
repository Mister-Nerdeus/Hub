export type ManualComparisonSetContract = {
  comparisonSetId: string;
  label: string;
  scenarioIds: string[];
  createdAtIso: string;
  updatedAtIso: string;
  mode: "manual_comparison";
};

export function manualComparisonSetIdFor(input: { stableSeed: string }): string {
  return ["manual-comparison-set", stableIdPart(input.stableSeed)].join(":");
}

export function validateManualComparisonSetContract(value: unknown): ManualComparisonSetContract {
  const set = requireRecord(value, "manualComparisonSet");
  requireAllowedKeys(set, "manualComparisonSet", [
    "comparisonSetId",
    "label",
    "scenarioIds",
    "createdAtIso",
    "updatedAtIso",
    "mode"
  ]);
  if (set.mode !== "manual_comparison") {
    throw new Error("manualComparisonSet.mode must be manual_comparison");
  }
  const scenarioIds = requireStringArray(set.scenarioIds, "manualComparisonSet.scenarioIds");
  return {
    comparisonSetId: requireString(set.comparisonSetId, "manualComparisonSet.comparisonSetId"),
    label: requireString(set.label, "manualComparisonSet.label"),
    scenarioIds,
    createdAtIso: requireIso(set.createdAtIso, "manualComparisonSet.createdAtIso"),
    updatedAtIso: requireIso(set.updatedAtIso, "manualComparisonSet.updatedAtIso"),
    mode: "manual_comparison"
  };
}

function stableIdPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return normalized.length === 0 ? "unnamed" : normalized;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireAllowedKeys(value: Record<string, unknown>, label: string, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((entry, index) => requireString(entry, `${label}[${index}]`));
}

function requireIso(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO date string`);
  }
  return text;
}
