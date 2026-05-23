import "./BundleAuditProof.css";

import type {
  BundleAuditProofViewModel,
  BundleAuditResultViewModel
} from "./bundleAuditViewModel";

type BundleAuditProofProps = {
  viewModel: BundleAuditProofViewModel;
};

export function BundleAuditProof({ viewModel }: BundleAuditProofProps) {
  return (
    <section
      id="bundle-audit-proof"
      className="bundle-audit-proof"
      aria-labelledby="bundle-audit-proof-title"
    >
      <div className="bundle-audit-proof__header">
        <div>
          <p className="eyebrow">Phase 9 local proof</p>
          <h2 id="bundle-audit-proof-title">{viewModel.label}</h2>
        </div>
        <span className="bundle-audit-proof__badge">{viewModel.localProofLabel}</span>
      </div>

      <div className="bundle-audit-proof__grid">
        <AuditPanel titleId="bundle-audit-valid-title" title="Valid Bundle Audit" audit={viewModel.validAudit} />
        <AuditPanel
          titleId="bundle-audit-invalid-title"
          title="Invalid JSON Path"
          audit={viewModel.invalidAudit}
        />
      </div>

      <div className="bundle-audit-proof__grid bundle-audit-proof__grid--wide">
        <AuditPanelStepList
          titleId="bundle-audit-valid-steps-title"
          title="Valid Bundle Review Steps"
          audit={viewModel.validAudit}
        />
        <AuditPanelStepList
          titleId="bundle-audit-invalid-steps-title"
          title="Invalid JSON Review Steps"
          audit={viewModel.invalidAudit}
        />

        <section
          className="bundle-audit-proof__panel"
          aria-labelledby="bundle-audit-limitations-title"
        >
          <h3 id="bundle-audit-limitations-title">Limitations</h3>
          <ul className="bundle-audit-proof__limitations">
            {viewModel.validAudit.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      </div>

      <section
        className="bundle-audit-proof__panel"
        aria-labelledby="bundle-audit-invalid-details-title"
      >
        <h3 id="bundle-audit-invalid-details-title">Invalid JSON Failure Path</h3>
        <p className="bundle-audit-proof__error">{viewModel.invalidAudit.failureMessage}</p>
      </section>
    </section>
  );
}

function AuditPanel({
  title,
  titleId,
  audit
}: {
  title: string;
  titleId: string;
  audit: BundleAuditResultViewModel;
}) {
  return (
    <section className="bundle-audit-proof__panel" aria-labelledby={titleId}>
      <h3 id={titleId}>{title}</h3>
      <dl className="bundle-audit-proof__metrics">
        <div>
          <dt>Status</dt>
          <dd>{audit.statusLabel}</dd>
        </div>
        <div>
          <dt>Validation</dt>
          <dd>{audit.validationStatus}</dd>
        </div>
        <div>
          <dt>Export</dt>
          <dd>{audit.exportId}</dd>
        </div>
        <div>
          <dt>Hash</dt>
          <dd>{audit.hash}</dd>
        </div>
        <div>
          <dt>Reports</dt>
          <dd>{audit.reportCount}</dd>
        </div>
        <div>
          <dt>Comparison</dt>
          <dd>{audit.hasComparison ? audit.comparisonId : "None"}</dd>
        </div>
      </dl>
      {audit.ok ? (
        <div className="bundle-audit-proof__id-list">
          <span>{audit.scenarioIds.join(", ")}</span>
          <span>{audit.reportIds.join(", ")}</span>
        </div>
      ) : (
        <p className="bundle-audit-proof__error">{audit.failureMessage}</p>
      )}
    </section>
  );
}

function AuditPanelStepList({
  title,
  titleId,
  audit
}: {
  title: string;
  titleId: string;
  audit: BundleAuditResultViewModel;
}) {
  return (
    <section className="bundle-audit-proof__panel" aria-labelledby={titleId}>
      <h3 id={titleId}>{title}</h3>
      <ol className="bundle-audit-proof__steps">
        {audit.reviewSteps.map((step) => (
          <li key={step.id}>
            <strong>{step.label}</strong>
            <span>{step.status}</span>
            <p>{step.message}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
