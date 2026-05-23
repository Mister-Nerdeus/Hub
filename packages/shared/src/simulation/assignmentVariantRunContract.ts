import type { SimulationRunContract } from "./simulationRunContract.js";
import { validateSimulationRunContract } from "./simulationRunContract.js";
import type { SimulationScoreContract } from "./simulationScoringContract.js";
import { validateSimulationScoreContract } from "./simulationScoringContract.js";

export type AssignmentVariantResultContract = {
  variantId: string;
  label: string;
  assignmentSetId: string;
  simulationRun: SimulationRunContract;
  simulationScore: SimulationScoreContract;
};

export type AssignmentVariantRunContract = {
  schemaVersion: "1.0.0";
  variantRunId: string;
  scenarioId: string;
  generatedTaskSetId: string;
  variants: AssignmentVariantResultContract[];
  limitations: string[];
};

const FORBIDDEN_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["safe", /\bsafe\b/i],
  ["unsafe", /\bunsafe\b/i],
  ["recommended", /\brecommended\b/i],
  ["best", /\bbest\b/i]
];

export function validateAssignmentVariantRunContract(
  value: unknown
): AssignmentVariantRunContract {
  const run = requireRecord(value, "assignmentVariantRun");
  requireExactKeys(run, "assignmentVariantRun", [
    "schemaVersion",
    "variantRunId",
    "scenarioId",
    "generatedTaskSetId",
    "variants",
    "limitations"
  ]);
  requireLiteral(run.schemaVersion, "1.0.0", "schemaVersion");
  const variantRunId = requireString(run.variantRunId, "variantRunId");
  const scenarioId = requireString(run.scenarioId, "scenarioId");
  const generatedTaskSetId = requireString(run.generatedTaskSetId, "generatedTaskSetId");
  const variants = requireArray(run.variants, "variants").map(validateAssignmentVariantResult);
  if (variants.length === 0) {
    throw new Error("variants requires at least one entry");
  }
  requireUnique(
    "variant ids",
    variants.map((variant) => variant.variantId)
  );
  if (!sameStringArray([...variants].map((variant) => variant.variantId), [...variants].map((variant) => variant.variantId).sort())) {
    throw new Error("variants must be sorted by variantId");
  }
  for (const variant of variants) {
    if (variant.simulationRun.scenarioId !== scenarioId) {
      throw new Error("variant simulation run scenarioId must match variant run");
    }
    if (variant.simulationRun.generatedTaskSetId !== generatedTaskSetId) {
      throw new Error("variant simulation run generatedTaskSetId must match variant run");
    }
    validateSimulationScoreContract(variant.simulationScore, variant.simulationRun);
  }
  const limitations = requireArray(run.limitations, "limitations").map((limitation, index) =>
    validateOperationalText(limitation, `limitations[${index}]`)
  );
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  return {
    schemaVersion: "1.0.0",
    variantRunId,
    scenarioId,
    generatedTaskSetId,
    variants,
    limitations
  };
}

function validateAssignmentVariantResult(
  value: unknown,
  index: number
): AssignmentVariantResultContract {
  const variant = requireRecord(value, `variants[${index}]`);
  requireExactKeys(variant, `variants[${index}]`, [
    "variantId",
    "label",
    "assignmentSetId",
    "simulationRun",
    "simulationScore"
  ]);
  const simulationRun = validateSimulationRunContract(variant.simulationRun);
  const simulationScore = validateSimulationScoreContract(variant.simulationScore, simulationRun);
  return {
    variantId: requireString(variant.variantId, `variants[${index}].variantId`),
    label: validateOperationalText(variant.label, `variants[${index}].label`),
    assignmentSetId: requireString(variant.assignmentSetId, `variants[${index}].assignmentSetId`),
    simulationRun,
    simulationScore
  };
}

function validateOperationalText(value: unknown, label: string): string {
  const text = requireString(value, label);
  for (const [name, pattern] of FORBIDDEN_TEXT_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`${label} must not include ${name} language`);
    }
  }
  return text;
}

function sameStringArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
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

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireUnique(label: string, values: string[]): Set<string> {
  const valueSet = new Set(values);
  if (valueSet.size !== values.length) {
    throw new Error(`duplicate ${label} are not allowed`);
  }
  return valueSet;
}
