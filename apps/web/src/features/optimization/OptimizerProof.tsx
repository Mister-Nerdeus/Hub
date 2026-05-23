import type { OptimizerProofViewModel } from "./optimizerProofViewModel";

type OptimizerProofProps = {
  viewModel: OptimizerProofViewModel;
};

export function OptimizerProof({ viewModel }: OptimizerProofProps) {
  return (
    <section className="optimizer-proof" id="optimizer-proof" aria-labelledby="optimizer-proof-title">
      <div className="optimizer-proof__header">
        <div>
          <p className="eyebrow">Optimizer proof</p>
          <h2 id="optimizer-proof-title">Candidate Audit</h2>
        </div>
        <div className="optimizer-proof__sources">
          {viewModel.sourceIds.map((source) => (
            <span key={source.label}>
              {source.label}: <strong>{source.value}</strong>
            </span>
          ))}
        </div>
      </div>

      <section className="optimizer-proof__panel" aria-labelledby="candidate-title">
        <h3 id="candidate-title">Candidates</h3>
        <div className="optimizer-proof__table" role="table" aria-label="Optimizer candidates">
          <div className="optimizer-proof__table-row optimizer-proof__table-row--head" role="row">
            <span role="columnheader">Candidate</span>
            <span role="columnheader">Score</span>
            <span role="columnheader">Status</span>
          </div>
          {viewModel.candidates.map((candidate) => (
            <div className="optimizer-proof__table-row" role="row" key={candidate.candidateId}>
              <span role="cell">{candidate.candidateId}</span>
              <span role="cell">{candidate.operationalBurdenScore}</span>
              <span role="cell">
                {candidate.isSelectedOperationalCandidate ? "Lowest operational burden" : "Compared"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="optimizer-proof__grid">
        <section className="optimizer-proof__panel" aria-labelledby="tie-breaker-title">
          <h3 id="tie-breaker-title">Tie-Breakers</h3>
          <ol className="optimizer-proof__list">
            {viewModel.tieBreakers.map((tieBreaker) => (
              <li key={tieBreaker}>{tieBreaker}</li>
            ))}
          </ol>
        </section>

        <section className="optimizer-proof__panel" aria-labelledby="audit-trace-title">
          <h3 id="audit-trace-title">Audit Trace</h3>
          <ol className="optimizer-proof__list">
            {viewModel.auditTrace.map((trace) => (
              <li key={trace}>{trace}</li>
            ))}
          </ol>
        </section>

        <section className="optimizer-proof__panel" aria-labelledby="optimizer-limitations-title">
          <h3 id="optimizer-limitations-title">Limitations</h3>
          <ul className="optimizer-proof__limitations">
            {viewModel.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
