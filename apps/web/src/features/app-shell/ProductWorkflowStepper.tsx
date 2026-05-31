import { useState } from "react";
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
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  return (
    <>
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
            className={[
              "product-workflow-stepper__step",
              step.active ? "product-workflow-stepper__step--active" : "",
              `product-workflow-stepper__step--${step.state}`
            ].filter(Boolean).join(" ")}
            aria-current={step.active ? "step" : undefined}
            aria-disabled={step.state === "gated" || step.state === "future" ? "true" : undefined}
            aria-label={`${step.number} ${step.label} ${step.state}`}
            data-step-completion-state={step.state}
            data-step-gating-state={step.state}
            data-step-blocked-reason={step.blockedReason ?? ""}
            onClick={() => {
              if (step.blockedReason != null) {
                setBlockedReason(step.blockedReason);
                return;
              }
              setBlockedReason(null);
              onSectionChange(step.sectionId);
            }}
          >
            <span>{step.number}</span>
            <strong>{step.label}</strong>
            {step.state === "gated" ? <em>Gated</em> : null}
          </button>
        ))}
      </nav>
      {blockedReason == null ? null : (
        <p className="product-workflow-stepper__blocked" role="status" data-stepper-gated-placeholder="true">
          {blockedReason}
        </p>
      )}
    </>
  );
}
