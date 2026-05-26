import type { RenderedPlanPreviewViewModel } from "./renderedPlanPreviewViewModel";

type RenderedPlanPreviewPanelProps = {
  viewModel: RenderedPlanPreviewViewModel;
};

export function RenderedPlanPreviewPanel({ viewModel }: RenderedPlanPreviewPanelProps) {
  return (
    <section className="rendered-plan-preview" aria-labelledby="rendered-plan-preview-title">
      <div className="rendered-plan-preview__header">
        <div>
          <h3 id="rendered-plan-preview-title">Rendered Plan Preview</h3>
          <p>{viewModel.manualReviewRequiredNotice}</p>
        </div>
        <strong>{viewModel.promotionBlockedNotice}</strong>
      </div>
      <div className="rendered-plan-preview__grid">
        {viewModel.plans.map((plan) => (
          <article className="rendered-plan-preview__item" key={plan.planId}>
            <div className="rendered-plan-preview__image-frame">
              <img
                src={plan.imageSrc}
                alt={`${plan.displayName} rendered operational review evidence`}
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
              <p>{plan.fallbackText}</p>
            </div>
            <div className="rendered-plan-preview__content">
              <h4>{plan.displayName}</h4>
              <dl>
                <div>
                  <dt>Evidence</dt>
                  <dd>{plan.safeRenderedEvidenceLabel}</dd>
                </div>
                <div>
                  <dt>Path</dt>
                  <dd>{plan.renderedEvidencePath}</dd>
                </div>
                <div>
                  <dt>Hash</dt>
                  <dd>{plan.renderedEvidenceHash}</dd>
                </div>
                <div>
                  <dt>Metadata</dt>
                  <dd>{plan.renderedEvidenceMetadataHash}</dd>
                </div>
                <div>
                  <dt>Canvas</dt>
                  <dd>{plan.canvasSummary}</dd>
                </div>
                <div>
                  <dt>Objects</dt>
                  <dd>{plan.objectCountSummary}</dd>
                </div>
                <div>
                  <dt>Drawn</dt>
                  <dd>{plan.drawCountSummary}</dd>
                </div>
                <div>
                  <dt>Route</dt>
                  <dd>{plan.routeStatusText}</dd>
                </div>
                <div>
                  <dt>Export</dt>
                  <dd>{plan.simulationStatusText}</dd>
                </div>
                <div>
                  <dt>Review</dt>
                  <dd>Manual review required</dd>
                </div>
                <div>
                  <dt>Promotion</dt>
                  <dd>Promotion blocked</dd>
                </div>
              </dl>
              <ul>
                {plan.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
