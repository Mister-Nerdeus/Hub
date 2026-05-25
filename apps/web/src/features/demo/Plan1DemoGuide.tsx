import type { AppSectionId } from "../app-shell/appNavigation";
import type { Plan1DemoWorkflowViewModel, Plan1DemoWorkflowStep } from "./plan1DemoWorkflowViewModel";

type Plan1DemoGuideProps = {
  viewModel: Plan1DemoWorkflowViewModel;
  onOpenPlan1: () => void;
  onNavigate: (sectionId: AppSectionId, anchorId?: string) => void;
};

export function Plan1DemoGuide({
  viewModel,
  onOpenPlan1,
  onNavigate
}: Plan1DemoGuideProps) {
  return (
    <section
      className="plan-1-demo-guide"
      aria-labelledby="plan-1-demo-guide-title"
      data-demo-guide="plan-1"
      data-developer-evidence-separated={viewModel.developerEvidenceSeparated}
    >
      <div className="plan-1-demo-guide__header">
        <div>
          <p className="eyebrow">Plan 1 demo workflow</p>
          <h2 id="plan-1-demo-guide-title">Plan 1 Demo Guide</h2>
        </div>
        <span
          className={`plan-1-demo-guide__badge plan-1-demo-guide__badge--${viewModel.readinessBadge.status}`}
          data-plan-1-readiness={viewModel.readinessBadge.status}
        >
          {viewModel.readinessBadge.label}
        </span>
      </div>

      <div className="plan-1-demo-guide__banners" data-demo-non-claims="visible">
        <p>{viewModel.nonClaims.join(" ")}</p>
        <p>{viewModel.limitations.join(" ")}</p>
      </div>

      <ol className="plan-1-demo-guide__steps" aria-label="Plan 1 demo steps">
        {viewModel.steps.map((step, index) => (
          <li
            key={step.stepId}
            className={`plan-1-demo-guide__step plan-1-demo-guide__step--${step.status}`}
            data-demo-step={step.stepId}
            data-demo-step-status={step.status}
          >
            <span>{index + 1}</span>
            <strong>{step.label}</strong>
            <button type="button" onClick={() => handleStepAction(step)}>
              {step.actionLabel}
            </button>
          </li>
        ))}
      </ol>

      <div className="plan-1-demo-guide__next" data-next-recommended-step={viewModel.nextRecommendedStep.stepId}>
        <span>Next recommended step</span>
        <strong>{viewModel.nextRecommendedStep.label}</strong>
        <button type="button" onClick={() => handleStepAction(viewModel.nextRecommendedStep)}>
          {viewModel.nextRecommendedStep.actionLabel}
        </button>
      </div>
    </section>
  );

  function handleStepAction(step: Plan1DemoWorkflowStep) {
    if (step.stepId === "open-repaired-plan-1") {
      onOpenPlan1();
      return;
    }
    onNavigate(step.appSection, step.anchorId);
  }
}
