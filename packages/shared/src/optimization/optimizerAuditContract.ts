import type { BaselineAssignmentOptimizerOutput } from "./baselineAssignmentOptimizer.js";

export type OptimizerAuditCandidate = {
  candidateId: string;
  assignmentSetId: string;
  simulationScoreId: string;
  operationalBurdenScore: number;
};

export type OptimizerAuditTrailContract = {
  schemaVersion: "1.0.0";
  auditTrailId: string;
  optimizerRunId: string;
  selectedOperationalCandidateId: string;
  candidates: OptimizerAuditCandidate[];
  tieBreakers: string[];
  reconstruction: {
    orderedCandidateIds: string[];
    selectedOperationalCandidateId: string;
  };
  limitations: string[];
};

const FORBIDDEN_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["safe", /\bsafe\b/i],
  ["unsafe", /\bunsafe\b/i],
  ["recommended", /\brecommended\b/i],
  ["best", /\bbest\b/i]
];

export const OPTIMIZER_AUDIT_LIMITATIONS = [
  "Operational-only audit trail for deterministic candidate reconstruction.",
  "Candidate summaries reference shared simulation score IDs.",
  "No clinical recommendation, API, persistence, or machine learning is applied."
];

export function validateOptimizerAuditTrailContract(
  value: unknown,
  optimizerOutput?: BaselineAssignmentOptimizerOutput
): OptimizerAuditTrailContract {
  const audit = requireRecord(value, "optimizerAuditTrail");
  requireExactKeys(audit, "optimizerAuditTrail", [
    "schemaVersion",
    "auditTrailId",
    "optimizerRunId",
    "selectedOperationalCandidateId",
    "candidates",
    "tieBreakers",
    "reconstruction",
    "limitations"
  ]);
  requireLiteral(audit.schemaVersion, "1.0.0", "schemaVersion");
  const auditTrailId = requireString(audit.auditTrailId, "auditTrailId");
  const optimizerRunId = requireString(audit.optimizerRunId, "optimizerRunId");
  const selectedOperationalCandidateId = requireString(
    audit.selectedOperationalCandidateId,
    "selectedOperationalCandidateId"
  );
  const candidates = requireArray(audit.candidates, "candidates").map(validateAuditCandidate);
  requireUnique(
    "audit candidate ids",
    candidates.map((candidate) => candidate.candidateId)
  );
  const tieBreakers = requireArray(audit.tieBreakers, "tieBreakers").map((tieBreaker, index) =>
    validateOperationalText(tieBreaker, `tieBreakers[${index}]`)
  );
  if (tieBreakers.length === 0) {
    throw new Error("tieBreakers requires at least one entry");
  }
  const reconstruction = validateReconstruction(audit.reconstruction);
  const expectedOrder = [...candidates].sort(compareAuditCandidates).map((candidate) => candidate.candidateId);
  if (!sameStringArray(reconstruction.orderedCandidateIds, expectedOrder)) {
    throw new Error("reconstruction.orderedCandidateIds must match audit-derived order");
  }
  if (selectedOperationalCandidateId !== expectedOrder[0]) {
    throw new Error("selectedOperationalCandidateId must match audit-derived candidate");
  }
  if (reconstruction.selectedOperationalCandidateId !== selectedOperationalCandidateId) {
    throw new Error("reconstruction selected candidate must match audit selected candidate");
  }
  const limitations = requireArray(audit.limitations, "limitations").map((limitation, index) =>
    validateOperationalText(limitation, `limitations[${index}]`)
  );
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  if (optimizerOutput != null) {
    if (optimizerRunId !== optimizerOutput.optimizerRunId) {
      throw new Error("optimizerRunId must match optimizer output");
    }
    if (selectedOperationalCandidateId !== optimizerOutput.lowestOperationalBurdenCandidateId) {
      throw new Error("audit selected candidate must match optimizer output");
    }
    const outputIds = optimizerOutput.candidates.map((candidate) => candidate.candidateId).sort();
    const auditIds = candidates.map((candidate) => candidate.candidateId).sort();
    if (!sameStringArray(outputIds, auditIds)) {
      throw new Error("every optimizer candidate must appear in audit");
    }
  }
  return {
    schemaVersion: "1.0.0",
    auditTrailId,
    optimizerRunId,
    selectedOperationalCandidateId,
    candidates,
    tieBreakers,
    reconstruction,
    limitations
  };
}

function validateAuditCandidate(value: unknown, index: number): OptimizerAuditCandidate {
  const candidate = requireRecord(value, `candidates[${index}]`);
  requireExactKeys(candidate, `candidates[${index}]`, [
    "candidateId",
    "assignmentSetId",
    "simulationScoreId",
    "operationalBurdenScore"
  ]);
  return {
    candidateId: requireString(candidate.candidateId, `candidates[${index}].candidateId`),
    assignmentSetId: requireString(candidate.assignmentSetId, `candidates[${index}].assignmentSetId`),
    simulationScoreId: requireString(candidate.simulationScoreId, `candidates[${index}].simulationScoreId`),
    operationalBurdenScore: requireNumber(
      candidate.operationalBurdenScore,
      `candidates[${index}].operationalBurdenScore`,
      0
    )
  };
}

function validateReconstruction(value: unknown): {
  orderedCandidateIds: string[];
  selectedOperationalCandidateId: string;
} {
  const reconstruction = requireRecord(value, "reconstruction");
  requireExactKeys(reconstruction, "reconstruction", [
    "orderedCandidateIds",
    "selectedOperationalCandidateId"
  ]);
  return {
    orderedCandidateIds: validateStringArray(
      reconstruction.orderedCandidateIds,
      "reconstruction.orderedCandidateIds"
    ),
    selectedOperationalCandidateId: requireString(
      reconstruction.selectedOperationalCandidateId,
      "reconstruction.selectedOperationalCandidateId"
    )
  };
}

function compareAuditCandidates(
  left: OptimizerAuditCandidate,
  right: OptimizerAuditCandidate
): number {
  const burdenDelta = left.operationalBurdenScore - right.operationalBurdenScore;
  if (burdenDelta !== 0) {
    return burdenDelta;
  }
  return left.candidateId.localeCompare(right.candidateId);
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

function requireNumber(value: unknown, label: string, min?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
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
