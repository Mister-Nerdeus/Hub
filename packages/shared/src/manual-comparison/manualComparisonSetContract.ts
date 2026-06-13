import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";
import { validateAssignmentLabelNoOverclaim } from "../assignments/assignmentLabelNoOverclaim.js";

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
  const scenarioIds = requireScenarioIdArray(set.scenarioIds, "manualComparisonSet.scenarioIds");
  const comparisonSetId = requireString(set.comparisonSetId, "manualComparisonSet.comparisonSetId");
  if (!comparisonSetId.startsWith("manual-comparison-set:")) {
    throw new Error("manualComparisonSet.comparisonSetId must use manual-comparison-set prefix");
  }
  const label = requireAllowedLabel(set.label, "manualComparisonSet.label");
  return {
    comparisonSetId,
    label,
    scenarioIds,
    createdAtIso: requireIso(set.createdAtIso, "manualComparisonSet.createdAtIso"),
    updatedAtIso: requireIso(set.updatedAtIso, "manualComparisonSet.updatedAtIso"),
    mode: "manual_comparison"
  };
}

export function validateManualComparisonSets(input: {
  comparisonSets: readonly unknown[];
  scenarioIds?: readonly string[];
}): ManualComparisonSetContract[] {
  const scenarioIds = input.scenarioIds == null ? null : new Set(input.scenarioIds);
  const comparisonSetIds = new Set<string>();
  return input.comparisonSets.map((candidate, index) => {
    const set = validateManualComparisonSetContract(candidate);
    if (comparisonSetIds.has(set.comparisonSetId)) {
      throw new Error(`manualComparisonSets[${index}].comparisonSetId must be unique`);
    }
    comparisonSetIds.add(set.comparisonSetId);
    if (scenarioIds != null) {
      for (const scenarioId of set.scenarioIds) {
        if (!scenarioIds.has(scenarioId)) {
          throw new Error(`manualComparisonSets[${index}].scenarioIds must reference existing scenarios`);
        }
      }
    }
    return set;
  });
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

function requireScenarioIdArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  const items = value.map((entry, index) => requireString(entry, `${label}[${index}]`));
  if (items.length < 2) throw new Error(`${label} must include at least two manual scenarios`);
  const unique = new Set(items);
  if (unique.size !== items.length) throw new Error(`${label} must not contain duplicate entries`);
  for (const item of items) {
    if (!item.startsWith("manual-scenario:")) {
      throw new Error(`${label} entries must use manual-scenario prefix`);
    }
  }
  return items;
}

function requireIso(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO date string`);
  }
  return text;
}

function requireAllowedLabel(value: unknown, label: string): string {
  const text = requireString(value, label);
  validateOperationalRuntimeText(text, label);
  validateAssignmentLabelNoOverclaim(text, label);
  const forbidden = [
    /\bscore\b/i,
    /\brank(?:ed|ing)?\b/i,
    /\brecommend(?:ed|ation|ations)?\b/i,
    /\bsimulation\b/i,
    /\bbetter\b/i,
    /\bworse\b/i,
    /\boptimal\b/i,
    /\boptimized\b/i,
    /\bsafe\b/i,
    /\bunsafe\b/i,
    /\bquality\b/i,
    /\bsafety\b/i,
    /\bcompliance\b/i,
    /\boutcome\b/i,
    /\bclinical\b/i,
    /\bstaffing\b/i,
    /\bgo-live\b/i,
    /\boperational(?:ly)?\s+ready\b/i
  ];
  if (forbidden.some((pattern) => pattern.test(text))) {
    throw new Error(`${label} contains blocked comparison language`);
  }
  return text;
}
