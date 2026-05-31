import type { NextWorkflowStepViewModel, NextWorkflowTargetSection } from "./nextWorkflowStepViewModel";

type NextWorkflowStepCardProps = {
  viewModel: NextWorkflowStepViewModel;
  onNavigate: (targetSection: NextWorkflowTargetSection) => void;
};

export function NextWorkflowStepCard({ viewModel, onNavigate }: NextWorkflowStepCardProps) {
  return (
    <section
      className="active-floorplan-hub__next-step next-workflow-step-card"
      aria-labelledby="active-floorplan-next-step-title"
      data-next-workflow-step-card="true"
      data-next-workflow-state={viewModel.stateId}
      data-assignment-truth-implemented={String(viewModel.assignmentTruthImplemented)}
    >
      <p className="eyebrow">What do I do next?</p>
      <h3 id="active-floorplan-next-step-title">{viewModel.title}</h3>
      <p>{viewModel.description}</p>
      <button type="button" onClick={() => onNavigate(viewModel.targetSection)}>
        {viewModel.actionLabel}
      </button>
    </section>
  );
}
