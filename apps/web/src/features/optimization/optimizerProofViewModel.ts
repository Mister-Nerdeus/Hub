import {
  optimizerProofFixture,
  type OptimizerProofFixture
} from "../../fixtures/optimizerProof";

export type OptimizerProofViewModel = {
  sourceIds: Array<{ label: string; value: string }>;
  candidates: Array<{
    candidateId: string;
    assignmentSetId: string;
    simulationScoreId: string;
    operationalBurdenScore: number;
    isSelectedOperationalCandidate: boolean;
  }>;
  tieBreakers: string[];
  auditTrace: string[];
  limitations: string[];
};

export function createOptimizerProofViewModel(
  fixture: OptimizerProofFixture = optimizerProofFixture
): OptimizerProofViewModel {
  const { auditTrail } = fixture;
  return {
    sourceIds: [
      { label: "Audit", value: auditTrail.auditTrailId },
      { label: "Optimizer run", value: auditTrail.optimizerRunId },
      { label: "Selected candidate", value: auditTrail.selectedOperationalCandidateId }
    ],
    candidates: auditTrail.candidates.map((candidate) => ({
      ...candidate,
      isSelectedOperationalCandidate:
        candidate.candidateId === auditTrail.selectedOperationalCandidateId
    })),
    tieBreakers: [...auditTrail.tieBreakers],
    auditTrace: auditTrail.reconstruction.orderedCandidateIds.map(
      (candidateId, index) => `${index + 1}. ${candidateId}`
    ),
    limitations: [...auditTrail.limitations]
  };
}
