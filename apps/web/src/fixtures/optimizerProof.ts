import type { OptimizerAuditTrailContract } from "@nerdeus/shared";

export type OptimizerProofFixture = {
  auditTrail: OptimizerAuditTrailContract;
};

export const optimizerProofFixture: OptimizerProofFixture = {
  auditTrail: {
    schemaVersion: "1.0.0",
    auditTrailId: "optimizer-audit-baseline-optimizer-basic",
    optimizerRunId: "baseline-optimizer-basic",
    selectedOperationalCandidateId: "candidate-room-count-balanced",
    candidates: [
      {
        candidateId: "candidate-original",
        assignmentSetId: "manual-assignment-basic-candidate-original",
        simulationScoreId: "simulation-score-baseline-optimizer-basic-variant-run-candidate-original",
        operationalBurdenScore: 15.8
      },
      {
        candidateId: "candidate-room-count-balanced",
        assignmentSetId: "manual-assignment-basic-candidate-room-count-balanced",
        simulationScoreId: "simulation-score-baseline-optimizer-basic-variant-run-candidate-room-count-balanced",
        operationalBurdenScore: 12.6
      },
      {
        candidateId: "candidate-task-minute-balanced",
        assignmentSetId: "manual-assignment-basic-candidate-task-minute-balanced",
        simulationScoreId: "simulation-score-baseline-optimizer-basic-variant-run-candidate-task-minute-balanced",
        operationalBurdenScore: 12.6
      }
    ],
    tieBreakers: ["operationalBurdenScore ascending", "candidateId ascending"],
    reconstruction: {
      orderedCandidateIds: [
        "candidate-room-count-balanced",
        "candidate-task-minute-balanced",
        "candidate-original"
      ],
      selectedOperationalCandidateId: "candidate-room-count-balanced"
    },
    limitations: [
      "Operational-only audit trail for deterministic candidate reconstruction.",
      "Candidate summaries reference shared simulation score IDs.",
      "No clinical claim, API, persistence, or machine learning is applied."
    ]
  }
};
