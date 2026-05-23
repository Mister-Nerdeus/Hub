import { useEffect, useState } from "react";

import {
  listSimulationRuns,
  SimulationRunRetrievalApiError
} from "./simulationRunRetrievalApi";
import {
  createSimulationRunRetrievalViewModel,
  type SimulationRunRetrievalViewModel
} from "./simulationRunRetrievalViewModel";

type SimulationRunRetrievalProofProps = {
  apiBaseUrl: string;
};

export function SimulationRunRetrievalProof({ apiBaseUrl }: SimulationRunRetrievalProofProps) {
  const [viewModel, setViewModel] = useState<SimulationRunRetrievalViewModel>(() =>
    createSimulationRunRetrievalViewModel({ status: "loading" })
  );

  function loadRuns() {
    setViewModel(createSimulationRunRetrievalViewModel({ status: "loading" }));
    void listSimulationRuns(apiBaseUrl, 5)
      .then((response) =>
        setViewModel(
          createSimulationRunRetrievalViewModel({
            status: "ready",
            runs: response.simulationRuns,
            pagination: response.pagination
          })
        )
      )
      .catch((error: unknown) => {
        if (error instanceof SimulationRunRetrievalApiError) {
          setViewModel(
            createSimulationRunRetrievalViewModel({
              status: "error",
              code: error.code,
              message: error.message
            })
          );
          return;
        }
        setViewModel(
          createSimulationRunRetrievalViewModel({
            status: "error",
            message: error instanceof Error ? error.message : "Simulation run retrieval failed"
          })
        );
      });
  }

  useEffect(() => {
    loadRuns();
  }, [apiBaseUrl]);

  return (
    <section className="retrieval-proof" id="simulation-retrieval-proof" aria-labelledby="retrieval-proof-title">
      <div className="retrieval-proof__header">
        <div>
          <p className="eyebrow">Simulation retrieval proof</p>
          <h2 id="retrieval-proof-title">Simulation Runs</h2>
        </div>
        <button type="button" className="retrieval-proof__refresh" onClick={loadRuns}>
          Refresh
        </button>
      </div>

      <div className="retrieval-proof__status" data-status={viewModel.status}>
        <strong>{viewModel.statusText}</strong>
        <span>{viewModel.paginationText}</span>
      </div>

      {viewModel.status === "error" ? (
        <div className="retrieval-proof__error" role="status">
          {viewModel.errorCode == null ? null : <strong>{viewModel.errorCode}</strong>}
          <span>{viewModel.errorMessage}</span>
        </div>
      ) : null}

      {viewModel.status === "ready" ? (
        <div className="retrieval-proof__table" role="table" aria-label="Simulation run summaries">
          <div className="retrieval-proof__row retrieval-proof__row--head" role="row">
            <span role="columnheader">Run</span>
            <span role="columnheader">Scenario</span>
            <span role="columnheader">Updated</span>
          </div>
          {viewModel.rows.map((row) => (
            <div className="retrieval-proof__row" role="row" key={row.id}>
              <strong role="cell">{row.simulationRunId}</strong>
              <span role="cell">{row.scenarioId}</span>
              <time role="cell">{row.updatedAt}</time>
            </div>
          ))}
        </div>
      ) : null}

      {viewModel.status === "empty" ? (
        <div className="retrieval-proof__empty" role="status">
          No persisted simulation run summaries are available.
        </div>
      ) : null}

      <section className="retrieval-proof__panel" aria-labelledby="retrieval-limitations-title">
        <h3 id="retrieval-limitations-title">Limitations</h3>
        <ul className="retrieval-proof__limitations">
          {viewModel.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
