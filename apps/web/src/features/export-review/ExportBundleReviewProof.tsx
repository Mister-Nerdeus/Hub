import "./ExportBundleReviewProof.css";

import type { ExportBundleReviewViewModel } from "./exportBundleReviewViewModel";

type ExportBundleReviewProofProps = {
  viewModel: ExportBundleReviewViewModel;
};

export function ExportBundleReviewProof({ viewModel }: ExportBundleReviewProofProps) {
  const validReview = viewModel.validReview;
  const invalidReview = viewModel.invalidReview;

  return (
    <section
      id="export-review-proof"
      className="export-review-proof"
      aria-labelledby="export-review-proof-title"
    >
      <div className="export-review-proof__header">
        <div>
          <p className="eyebrow">Phase 8 local proof</p>
          <h2 id="export-review-proof-title">{viewModel.label}</h2>
        </div>
        <span className="export-review-proof__badge">{viewModel.operationalOnlyLabel}</span>
      </div>

      <div className="export-review-proof__grid">
        <section className="export-review-proof__panel" aria-labelledby="valid-review-title">
          <h3 id="valid-review-title">Validated Bundle</h3>
          {validReview.ok ? (
            <dl className="export-review-proof__metrics">
              <div>
                <dt>Status</dt>
                <dd>Valid</dd>
              </div>
              <div>
                <dt>Reports</dt>
                <dd>{validReview.summary.reportCount}</dd>
              </div>
              <div>
                <dt>Comparison</dt>
                <dd>{validReview.summary.hasComparison ? "Present" : "None"}</dd>
              </div>
              <div>
                <dt>Export</dt>
                <dd>{validReview.summary.exportId}</dd>
              </div>
              <div>
                <dt>Comparison ID</dt>
                <dd>{validReview.summary.comparisonId ?? "None"}</dd>
              </div>
            </dl>
          ) : (
            <p className="export-review-proof__error">{validReview.error}</p>
          )}
        </section>

        <section className="export-review-proof__panel" aria-labelledby="invalid-review-title">
          <h3 id="invalid-review-title">Invalid Bundle Path</h3>
          <dl className="export-review-proof__metrics">
            <div>
              <dt>Status</dt>
              <dd>{invalidReview.ok ? "Valid" : "Invalid"}</dd>
            </div>
            <div>
              <dt>Error</dt>
              <dd>{invalidReview.ok ? "None" : invalidReview.error}</dd>
            </div>
          </dl>
        </section>
      </div>

      {validReview.ok ? (
        <div className="export-review-proof__grid export-review-proof__grid--lists">
          <section className="export-review-proof__panel" aria-labelledby="scenario-ids-title">
            <h3 id="scenario-ids-title">Scenario IDs</h3>
            <ul className="export-review-proof__list">
              {validReview.summary.scenarioIds.map((scenarioId) => (
                <li key={scenarioId}>{scenarioId}</li>
              ))}
            </ul>
          </section>

          <section className="export-review-proof__panel" aria-labelledby="report-ids-title">
            <h3 id="report-ids-title">Report IDs</h3>
            <ul className="export-review-proof__list">
              {validReview.summary.reportIds.map((reportId) => (
                <li key={reportId}>{reportId}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {validReview.ok ? (
        <section className="export-review-proof__panel" aria-labelledby="review-limitations-title">
          <h3 id="review-limitations-title">Limitations</h3>
          <ul className="export-review-proof__limitations">
            {validReview.summary.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
