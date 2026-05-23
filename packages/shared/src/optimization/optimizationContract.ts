import type { NurseTaskAssignment, NurseTaskAssignmentReason } from "../contracts.js";

export type OptimizerConstraintAdapterInput = {
  generatedTaskIds: string[];
  allowedNurseIds: string[];
  baseAssignments: NurseTaskAssignment[];
  candidateAssignments: NurseTaskAssignment[];
  assignedCandidateReason?: NurseTaskAssignmentReason | "preserve";
};

export type OptimizerConstraintAdapterOutput = {
  taskAssignments: NurseTaskAssignment[];
  preservedUnassignedTaskIds: string[];
};

export type OptimizationInputContract = {
  schemaVersion: "1.0.0";
  optimizationInputId: string;
  scenarioId: string;
  generatedTaskSetId: string;
  assignmentSetIds: string[];
  assumptions: string[];
  scoringConfig: {
    scoringEngine: "simulation_score";
    simulationScoreRequired: true;
  };
  limitations: string[];
};

export type OptimizationCandidateContract = {
  candidateId: string;
  assignmentSetId: string;
  simulationRunId: string;
  simulationScoreId: string;
  limitations: string[];
};

export type OptimizationOutputShellContract = {
  schemaVersion: "1.0.0";
  optimizerBoundaryId: string;
  optimizationInputId: string;
  scenarioId: string;
  generatedTaskSetId: string;
  candidates: OptimizationCandidateContract[];
  limitations: string[];
};

const FORBIDDEN_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["safe", /\bsafe\b/i],
  ["unsafe", /\bunsafe\b/i],
  ["recommended", /\brecommended\b/i],
  ["best", /\bbest\b/i],
  ["clinically acceptable", /\bclinically acceptable\b/i]
];

export const OPTIMIZATION_BOUNDARY_LIMITATIONS = [
  "Boundary-only contract for future operational optimizer work.",
  "Candidates must reference shared simulation score IDs.",
  "No selected candidate, ranking, or clinical claim is included in this boundary shell."
];

export function validateOptimizationInputContract(value: unknown): OptimizationInputContract {
  const input = requireRecord(value, "optimizationInput");
  requireExactKeys(input, "optimizationInput", [
    "schemaVersion",
    "optimizationInputId",
    "scenarioId",
    "generatedTaskSetId",
    "assignmentSetIds",
    "assumptions",
    "scoringConfig",
    "limitations"
  ]);
  requireLiteral(input.schemaVersion, "1.0.0", "schemaVersion");
  const scoringConfig = requireRecord(input.scoringConfig, "scoringConfig");
  requireExactKeys(scoringConfig, "scoringConfig", ["scoringEngine", "simulationScoreRequired"]);
  requireLiteral(scoringConfig.scoringEngine, "simulation_score", "scoringConfig.scoringEngine");
  requireLiteral(scoringConfig.simulationScoreRequired, true, "scoringConfig.simulationScoreRequired");
  const limitations = validateTextArray(input.limitations, "limitations");
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  return {
    schemaVersion: "1.0.0",
    optimizationInputId: requireString(input.optimizationInputId, "optimizationInputId"),
    scenarioId: requireString(input.scenarioId, "scenarioId"),
    generatedTaskSetId: requireString(input.generatedTaskSetId, "generatedTaskSetId"),
    assignmentSetIds: validateStringArray(input.assignmentSetIds, "assignmentSetIds"),
    assumptions: validateTextArray(input.assumptions, "assumptions"),
    scoringConfig: {
      scoringEngine: "simulation_score",
      simulationScoreRequired: true
    },
    limitations
  };
}

export function validateOptimizationOutputShellContract(
  value: unknown
): OptimizationOutputShellContract {
  const output = requireRecord(value, "optimizationOutputShell");
  requireExactKeys(output, "optimizationOutputShell", [
    "schemaVersion",
    "optimizerBoundaryId",
    "optimizationInputId",
    "scenarioId",
    "generatedTaskSetId",
    "candidates",
    "limitations"
  ]);
  requireLiteral(output.schemaVersion, "1.0.0", "schemaVersion");
  const candidates = requireArray(output.candidates, "candidates").map(validateCandidate);
  requireUnique(
    "optimization candidate ids",
    candidates.map((candidate) => candidate.candidateId)
  );
  const limitations = validateTextArray(output.limitations, "limitations");
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  return {
    schemaVersion: "1.0.0",
    optimizerBoundaryId: requireString(output.optimizerBoundaryId, "optimizerBoundaryId"),
    optimizationInputId: requireString(output.optimizationInputId, "optimizationInputId"),
    scenarioId: requireString(output.scenarioId, "scenarioId"),
    generatedTaskSetId: requireString(output.generatedTaskSetId, "generatedTaskSetId"),
    candidates,
    limitations
  };
}

function validateCandidate(value: unknown, index: number): OptimizationCandidateContract {
  const candidate = requireRecord(value, `candidates[${index}]`);
  requireExactKeys(candidate, `candidates[${index}]`, [
    "candidateId",
    "assignmentSetId",
    "simulationRunId",
    "simulationScoreId",
    "limitations"
  ]);
  const simulationScoreId = requireString(candidate.simulationScoreId, `candidates[${index}].simulationScoreId`);
  if (simulationScoreId.length === 0) {
    throw new Error(`candidates[${index}].simulationScoreId is required`);
  }
  return {
    candidateId: requireString(candidate.candidateId, `candidates[${index}].candidateId`),
    assignmentSetId: requireString(candidate.assignmentSetId, `candidates[${index}].assignmentSetId`),
    simulationRunId: requireString(candidate.simulationRunId, `candidates[${index}].simulationRunId`),
    simulationScoreId,
    limitations: validateTextArray(candidate.limitations, `candidates[${index}].limitations`)
  };
}

function validateTextArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((item, index) =>
    validateOperationalText(item, `${label}[${index}]`)
  );
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

function validateStringArray(value: unknown, label: string): string[] {
  const values = requireArray(value, label).map((item, index) =>
    requireString(item, `${label}[${index}]`)
  );
  requireUnique(label, values);
  return values;
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

function requireLiteral<T extends string | boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${String(expected)}`);
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
