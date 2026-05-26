import { createDeveloperEvidenceViewModel } from "../developerEvidenceViewModel";

const operator = createDeveloperEvidenceViewModel("operator");
if (operator.developerEvidence.length !== 0 || operator.operatorSummary.rawProofDetailsVisible) {
  throw new Error("operator mode must hide developer evidence");
}

const reviewer = createDeveloperEvidenceViewModel("reviewer");
if (reviewer.developerEvidence.length !== 0 || reviewer.reviewerArtifacts.length !== 4) {
  throw new Error("reviewer mode must show safe artifacts only");
}

const developer = createDeveloperEvidenceViewModel("developer");
if (developer.developerEvidence.length !== 4 || !developer.operatorSummary.rawProofDetailsVisible) {
  throw new Error("developer mode must show raw evidence details");
}
