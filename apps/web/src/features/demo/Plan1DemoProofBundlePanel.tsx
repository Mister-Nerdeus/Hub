import type { Plan1DemoProofBundle } from "@nerdeus/shared";

type Plan1DemoProofBundlePanelProps = {
  bundle: Plan1DemoProofBundle;
};

export function Plan1DemoProofBundlePanel({ bundle }: Plan1DemoProofBundlePanelProps) {
  return (
    <section
      className="plan-1-demo-proof-bundle"
      aria-labelledby="plan-1-demo-proof-bundle-title"
      data-demo-proof-bundle="plan-1"
    >
      <div className="plan-1-demo-proof-bundle__header">
        <div>
          <p className="eyebrow">Exportable proof bundle</p>
          <h3 id="plan-1-demo-proof-bundle-title">Plan 1 demo proof bundle</h3>
        </div>
        <span>{bundle.syntheticDataOnly ? "synthetic data only" : "not available"}</span>
      </div>

      <div className="plan-1-demo-proof-bundle__sections">
        {bundle.sections.map((section) => (
          <article
            className="plan-1-demo-proof-bundle__section"
            key={section.sectionId}
            data-demo-proof-bundle-section={section.sectionId}
          >
            <div className="plan-1-demo-proof-bundle__section-header">
              <strong>{section.label}</strong>
              <span>{section.status}</span>
            </div>
            <ul>
              {section.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            {section.artifactPaths.length > 0 ? (
              <p>{section.artifactPaths.length} local evidence reference(s)</p>
            ) : null}
          </article>
        ))}
      </div>

      <section className="plan-1-demo-proof-bundle__references" aria-labelledby="plan-1-demo-proof-bundle-references-title">
        <h4 id="plan-1-demo-proof-bundle-references-title">Evidence artifact references</h4>
        <ul>
          {bundle.evidenceArtifactReferences.map((reference) => (
            <li key={reference.artifactId}>
              <strong>{reference.label}</strong>
              <span>{reference.path}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="plan-1-demo-proof-bundle__notes">
        <section aria-labelledby="plan-1-demo-proof-bundle-limitations-title">
          <h4 id="plan-1-demo-proof-bundle-limitations-title">Limitations</h4>
          <ul>
            {bundle.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="plan-1-demo-proof-bundle-non-claims-title"
          data-demo-proof-bundle-non-claims="visible"
        >
          <h4 id="plan-1-demo-proof-bundle-non-claims-title">Non-claims</h4>
          <ul>
            {bundle.nonClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
