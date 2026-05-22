import "./OperationalReportsProof.css";

import type { ReportProofViewModel } from "./reportProofViewModel";

type OperationalReportsProofProps = {
  viewModel: ReportProofViewModel;
};

export function OperationalReportsProof({ viewModel }: OperationalReportsProofProps) {
  return (
    <section className="reports-proof" aria-labelledby="reports-proof-title">
      <div className="reports-proof__header">
        <div>
          <p className="eyebrow">Phase 6 local proof</p>
          <h2 id="reports-proof-title">{viewModel.label}</h2>
        </div>
        <span className="reports-proof__badge">Operational inspection summaries only</span>
      </div>

      <section className="reports-proof__panel" aria-labelledby="summary-report-title">
        <h3 id="summary-report-title">Operational Summary</h3>
        <dl className="reports-proof__metrics">
          {viewModel.summaryMetrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="reports-proof__grid">
        <section className="reports-proof__panel" aria-labelledby="nurse-report-title">
          <h3 id="nurse-report-title">Nurse Workload</h3>
          <div className="reports-proof__table" role="table" aria-label="Nurse workload report">
            <div className="reports-proof__table-row reports-proof__table-row--head" role="row">
              <span role="columnheader">Nurse</span>
              <span role="columnheader">Tasks</span>
              <span role="columnheader">Minutes</span>
              <span role="columnheader">Warnings</span>
            </div>
            {viewModel.nurseRows.map((row) => (
              <div className="reports-proof__table-row" role="row" key={row.nurseId}>
                <span role="cell">{row.nurseId}</span>
                <span role="cell">{row.assignedTaskCount}</span>
                <span role="cell">{row.estimatedTaskMinutes}</span>
                <span role="cell">{row.warningCount}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="reports-proof__panel" aria-labelledby="unassigned-report-title">
          <h3 id="unassigned-report-title">Unassigned Tasks</h3>
          <ul className="reports-proof__list">
            {viewModel.unassignedRows.map((row) => (
              <li key={row.taskId}>
                <span>{row.taskId}</span>
                <strong>{row.roomId}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="reports-proof__panel" aria-labelledby="warning-report-title">
          <h3 id="warning-report-title">Warnings</h3>
          <ul className="reports-proof__list">
            {viewModel.warningRows.map((row) => (
              <li key={row.code}>
                <span>{row.code}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="reports-proof__panel" aria-labelledby="limitations-title">
          <h3 id="limitations-title">Limitations</h3>
          <ul className="reports-proof__limitations">
            {viewModel.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
