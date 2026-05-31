import { createNextWorkflowStepViewModel } from "./nextWorkflowStepViewModel";

type NextWorkflowStepCardProps = {
  canUseForAssignment: boolean;
  canPrepareForScenarioSetup: boolean;
  onUseForAssignment: () => void;
  onPrepareForScenarioSetup: () => void;
};

export function NextWorkflowStepCard({
  canUseForAssignment,
  canPrepareForScenarioSetup,
  onUseForAssignment,
  onPrepareForScenarioSetup
}: NextWorkflowStepCardProps) {
  const viewModel = createNextWorkflowStepViewModel({
    canUseForAssignment,
    canPrepareForScenarioSetup
  });

  return (
    <section
      className="next-workflow-step-card"
      aria-labelledby="next-workflow-step-title"
      data-next-workflow-step-state={viewModel.title}
    >
      <div>
        <p className="eyebrow">What do I do next?</p>
        <h3 id="next-workflow-step-title">{viewModel.title}</h3>
        <p>{viewModel.body}</p>
      </div>
      <div className="next-workflow-step-card__actions">
        <button type="button" disabled={viewModel.primaryDisabled} onClick={onUseForAssignment}>
          {viewModel.primaryActionLabel}
        </button>
        <button type="button" disabled={viewModel.secondaryDisabled} onClick={onPrepareForScenarioSetup}>
          {viewModel.secondaryActionLabel}
        </button>
      </div>
    </section>
  );
}
