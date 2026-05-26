import type { PlanBuilderLibraryViewModel } from "./planBuilderLibraryViewModel";
import { PlanLibraryFilters } from "./PlanLibraryFilters";
import { PlanStatusBadge } from "./PlanStatusBadge";
import { createPlanStatusBadges } from "./planStatusViewModel";

type PlanBuilderLibraryProps = {
  viewModel: PlanBuilderLibraryViewModel;
  onOpenDefaultPlan?: (planId: string) => void;
  onOpenReviewCandidate?: (candidateId: string) => void;
};

export function PlanBuilderLibrary({
  viewModel,
  onOpenDefaultPlan,
  onOpenReviewCandidate
}: PlanBuilderLibraryProps) {
  function handleAction(item: PlanBuilderLibraryViewModel["sections"][number]["items"][number], kind: string) {
    const action = item.actions.find((candidate) => candidate.kind === kind);
    if (item.categoryId === "default-fixtures" && kind === "open-plan") {
      onOpenDefaultPlan?.(item.planId);
      return;
    }
    if (
      (item.categoryId === "corrected-saved-copies" ||
        item.categoryId === "route-repaired-review-candidates") &&
      (kind === "open-plan" || kind === "open-saved-copy")
    ) {
      onOpenReviewCandidate?.(item.planId);
      return;
    }
    if (action != null && "safeHref" in action) {
      window.open(action.safeHref, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section className="plan-builder-library" aria-labelledby="plan-builder-library-title">
      <div className="plan-builder-library__header">
        <div>
          <p className="eyebrow">Plan Builder</p>
          <h2 id="plan-builder-library-title">Human Review Library</h2>
        </div>
        <div className="plan-builder-library__notices" role="status">
          <strong>{viewModel.promotionBlockedNotice}</strong>
          <span>{viewModel.manualReviewRequiredNotice}</span>
        </div>
      </div>
      <PlanLibraryFilters filters={viewModel.filters} />

      {viewModel.sections.map((section) => (
        <section className="plan-builder-library__section" key={section.id} aria-labelledby={`${section.id}-title`}>
          <h3 id={`${section.id}-title`}>{section.title}</h3>
          {section.items.length === 0 ? (
            <p className="plan-builder-library__empty">{section.emptyText}</p>
          ) : (
            <div className="plan-builder-library__grid">
              {section.items.map((item) => (
                <article className="plan-builder-library__card" key={item.id}>
                  <div>
                    <h4>{item.displayName}</h4>
                    <p>{item.artifactLabel}</p>
                  </div>
                  <div className="plan-builder-library__badges" aria-label={`${item.displayName} statuses`}>
                    {createPlanStatusBadges(item).map((badge) => (
                      <PlanStatusBadge badge={badge} key={badge.kind} />
                    ))}
                  </div>
                  <dl>
                    <div>
                      <dt>Route</dt>
                      <dd>{item.routeStatusLabel}</dd>
                    </div>
                    <div>
                      <dt>Export</dt>
                      <dd>{item.simulationExportStatusLabel}</dd>
                    </div>
                    <div>
                      <dt>Review</dt>
                      <dd>{item.manualReviewStatusLabel}</dd>
                    </div>
                    <div>
                      <dt>Promotion</dt>
                      <dd>{item.promotionStatusLabel}</dd>
                    </div>
                    <div>
                      <dt>Verified</dt>
                      <dd>{item.lastVerifiedIssue}</dd>
                    </div>
                  </dl>
                  <div className="plan-builder-library__actions" aria-label={`${item.displayName} actions`}>
                    {item.actions.map((action) => (
                      <button
                        type="button"
                        key={`${item.id}:${action.kind}`}
                        onClick={() => handleAction(item, action.kind)}
                        data-artifact-href={"safeHref" in action ? action.safeHref : undefined}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                  {item.repoRelativePath == null ? null : <code>{item.repoRelativePath}</code>}
                  <p>{item.notice}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}

      <ul className="plan-builder-library__limitations">
        {viewModel.limitations.map((limitation) => (
          <li key={limitation}>{limitation}</li>
        ))}
      </ul>
    </section>
  );
}
