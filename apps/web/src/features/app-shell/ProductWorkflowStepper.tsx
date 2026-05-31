import type { AppSectionId } from "./appNavigation";
import type { ProductWorkflowStepperViewModel } from "./productWorkflowStepViewModel";

type ProductWorkflowStepperProps = {
  viewModel: ProductWorkflowStepperViewModel;
  onSectionChange: (sectionId: AppSectionId) => void;
};

export function ProductWorkflowStepper({
  viewModel,
  onSectionChange
}: ProductWorkflowStepperProps) {
  return (
    <nav
      className="product-workflow-stepper"
      aria-label="Workflow steps"
      data-product-workflow-stepper="Floorplan Assignments Scenario Simulation Report"
      data-active-workflow-step={viewModel.activeStepLabel}
    >
      {viewModel.steps.map((step) => (
        <button
          key={step.number}
          type="button"
          className={step.active ? "product-workflow-stepper__step product-workflow-stepper__step--active" : "product-workflow-stepper__step"}
          aria-current={step.active ? "step" : undefined}
          aria-label={`${step.number} ${step.label}`}
          data-step-completion-state="not-complete"
          onClick={() => onSectionChange(step.sectionId)}
        >
          <span>{step.number}</span>
          {step.label}
        </button>
      ))}
    </nav>
  );
}
