import type { ManualReviewActionsViewModel } from "./manualReviewActionsViewModel";

type ManualReviewActionsProps = {
  viewModel: ManualReviewActionsViewModel;
};

export function ManualReviewActions({ viewModel }: ManualReviewActionsProps) {
  return (
    <section className="manual-review-actions" aria-labelledby="manual-review-actions-title">
      <div className="manual-review-actions__header">
        <div>
          <h3 id="manual-review-actions-title">Manual Review Actions</h3>
          <p>{viewModel.manualReviewRequiredNotice}</p>
        </div>
        <strong>{viewModel.promotionBlockedNotice}</strong>
      </div>
      <div className="manual-review-actions__grid">
        {viewModel.plans.map((plan) => (
          <article className="manual-review-actions__plan" key={plan.planId}>
            <h4>{plan.displayName}</h4>
            <p>Manual review required; promotion blocked.</p>
            <div className="manual-review-actions__cards">
              {plan.actions.map((action) => (
                <div className="manual-review-actions__card" key={action.kind}>
                  <h5>{action.label}</h5>
                  <dl>
                    <div>
                      <dt>Action</dt>
                      <dd>{action.label}</dd>
                    </div>
                    <div>
                      <dt>Evidence</dt>
                      <dd>{action.kind}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{action.statusText}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
