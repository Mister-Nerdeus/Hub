import { createOptimizerProofViewModel } from "./optimizerProofViewModel";

const viewModel = createOptimizerProofViewModel();

if (viewModel.candidates.length !== 3) {
  throw new Error("all candidates must render");
}

if (!viewModel.candidates.some((candidate) => candidate.isSelectedOperationalCandidate)) {
  throw new Error("neutral selected candidate missing");
}

if (viewModel.tieBreakers.length === 0) {
  throw new Error("tie-breakers missing");
}

if (viewModel.limitations.length === 0) {
  throw new Error("limitations missing");
}

if (viewModel.auditTrace.length !== viewModel.candidates.length) {
  throw new Error("audit trace must include every candidate");
}

const text = JSON.stringify(viewModel).toLowerCase();
for (const forbidden of [" safe ", " unsafe ", "recommended", " best "]) {
  if (text.includes(forbidden)) {
    throw new Error(`forbidden wording found: ${forbidden}`);
  }
}
