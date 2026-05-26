import type { ManualReviewCtaViewModel } from "./manualReviewCtaViewModel";

type ManualReviewCtaPanelProps = {
  viewModel: ManualReviewCtaViewModel;
};

export function ManualReviewCtaPanel({ viewModel }: ManualReviewCtaPanelProps) {
  return (
    <section className="manual-review-cta" aria-labelledby="manual-review-cta-title">
      <div className="manual-review-cta__header">
        <div>
          <p className="eyebrow">Review handoff</p>
          <h3 id="manual-review-cta-title">{viewModel.heading}</h3>
        </div>
        <strong>{viewModel.promotionDisabledCopy}</strong>
      </div>
      <div className="manual-review-cta__scope">
        <section>
          <h4>Reviewer may inspect</h4>
          <ul>
            {viewModel.allowedScope.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section>
          <h4>Reviewer may not use this CTA to decide</h4>
          <ul>
            {viewModel.forbiddenScope.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>
      <div className="manual-review-cta__plans">
        {viewModel.plans.map((plan) => (
          <article key={plan.planId}>
            <h4>{plan.displayName}</h4>
            <dl>
              <div>
                <dt>Route</dt>
                <dd>{plan.routeReadinessLabel}</dd>
              </div>
              <div>
                <dt>Export</dt>
                <dd>{plan.simulationExportLabel}</dd>
              </div>
              <div>
                <dt>Review</dt>
                <dd>{plan.manualReviewStatusLabel}</dd>
              </div>
              <div>
                <dt>Promotion</dt>
                <dd>{plan.promotionStatusLabel}</dd>
              </div>
            </dl>
            <div className="manual-review-cta__actions">
              {plan.actions.map((action) => <button type="button" key={action}>{action}</button>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
