import type { BaselineAssignmentOptimizerOutput } from "./baselineAssignmentOptimizer.js";
import {
  type OptimizerAuditTrailContract,
  OPTIMIZER_AUDIT_LIMITATIONS,
  validateOptimizerAuditTrailContract
} from "./optimizerAuditContract.js";

export function buildOptimizerAuditTrail(
  optimizerOutput: BaselineAssignmentOptimizerOutput
): OptimizerAuditTrailContract {
  const candidates = optimizerOutput.candidates.map((candidate) => ({
    candidateId: candidate.candidateId,
    assignmentSetId: candidate.assignmentSetId,
    simulationScoreId: candidate.simulationScoreId,
    operationalBurdenScore: candidate.operationalBurdenScore
  }));
  const orderedCandidateIds = [...candidates]
    .sort((left, right) => {
      const burdenDelta = left.operationalBurdenScore - right.operationalBurdenScore;
      if (burdenDelta !== 0) {
        return burdenDelta;
      }
      return left.candidateId.localeCompare(right.candidateId);
    })
    .map((candidate) => candidate.candidateId);

  return validateOptimizerAuditTrailContract(
    {
      schemaVersion: "1.0.0",
      auditTrailId: `optimizer-audit-${optimizerOutput.optimizerRunId}`,
      optimizerRunId: optimizerOutput.optimizerRunId,
      selectedOperationalCandidateId: optimizerOutput.lowestOperationalBurdenCandidateId,
      candidates,
      tieBreakers: [...optimizerOutput.tieBreakers],
      reconstruction: {
        orderedCandidateIds,
        selectedOperationalCandidateId: orderedCandidateIds[0]
      },
      limitations: [...OPTIMIZER_AUDIT_LIMITATIONS]
    },
    optimizerOutput
  );
}
