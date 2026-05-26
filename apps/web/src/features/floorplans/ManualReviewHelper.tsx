import type { ManualReviewHelperViewModel } from "./manualReviewHelperViewModel";

type ManualReviewHelperProps = {
  viewModel: ManualReviewHelperViewModel;
};

export function ManualReviewHelper({ viewModel }: ManualReviewHelperProps) {
  return (
    <section className="manual-review-helper" aria-labelledby="manual-review-helper-title">
      <div className="manual-review-helper__header">
        <div>
          <h3 id="manual-review-helper-title">Manual Review Helper</h3>
          <p>{viewModel.draftOnlyNotice}</p>
        </div>
        <strong>{viewModel.noPersistenceNotice}</strong>
      </div>
      <div className="manual-review-helper__grid">
        {viewModel.plans.map((plan) => (
          <article className="manual-review-helper__plan" key={plan.planId}>
            <h4>{plan.displayName}</h4>
            <p>Promotion disabled. Submit disabled.</p>
            <dl className="manual-review-helper__state">
              <div>
                <dt>Manual Review Status</dt>
                <dd>{plan.defaultState.manualReviewStatus}</dd>
              </div>
              <div>
                <dt>Reviewer Source</dt>
                <dd>{plan.defaultState.reviewerDecisionSource}</dd>
              </div>
              <div>
                <dt>Promotion Authorization</dt>
                <dd>{plan.defaultState.promotionAuthorization}</dd>
              </div>
            </dl>
            <div className="manual-review-helper__fields">
              {plan.fields.map((field) => (
                <div className="manual-review-helper__field" key={field.id}>
                  <span>{field.label}</span>
                  <strong>{field.value}</strong>
                  <p>{field.guidance}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
