import type { DeveloperEvidenceViewModel } from "./developerEvidenceViewModel";

type DeveloperEvidencePanelProps = {
  viewModel: DeveloperEvidenceViewModel;
};

export function DeveloperEvidencePanel({ viewModel }: DeveloperEvidencePanelProps) {
  return (
    <section className="floorplan-evidence-panel" aria-labelledby="floorplan-evidence-title">
      <div className="floorplan-evidence-panel__header">
        <div>
          <p className="eyebrow">Developer/Evidence</p>
          <h3 id="floorplan-evidence-title">Evidence Containment</h3>
        </div>
        <strong>{viewModel.operatorSummary.rawProofDetailsVisible ? "Developer details visible" : "Developer details hidden"}</strong>
      </div>
      {viewModel.mode === "developer" ? (
        <div className="floorplan-evidence-panel__grid">
          {viewModel.developerEvidence.map((entry) => (
            <article key={entry.planId}>
              <h4>{entry.planId}</h4>
              <dl>
                <div>
                  <dt>Review packet</dt>
                  <dd>{entry.reviewPacketPath}</dd>
                </div>
                <div>
                  <dt>Template</dt>
                  <dd>{entry.reviewRecordTemplatePath}</dd>
                </div>
                <div>
                  <dt>Rendered evidence</dt>
                  <dd>{entry.renderedEvidencePath}</dd>
                </div>
                <div>
                  <dt>Render hash</dt>
                  <dd>{entry.renderedEvidenceHash}</dd>
                </div>
                <div>
                  <dt>Metadata hash</dt>
                  <dd>{entry.renderedEvidenceMetadataHash}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <ul>
          {viewModel.reviewerArtifacts.map((artifact) => (
            <li key={artifact.planId}>{artifact.label}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
