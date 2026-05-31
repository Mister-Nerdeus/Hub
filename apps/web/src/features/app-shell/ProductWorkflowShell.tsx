import type { ReactNode } from "react";
import { PRODUCT_DISPLAY_NAME } from "@nerdeus/shared";
import type { AppSection, AppSectionId } from "./appNavigation";
import { createProductWorkflowStepperViewModel } from "./productWorkflowStepViewModel";
import { ProductSidebarRail } from "./ProductSidebarRail";
import { ProductWorkflowStepper } from "./ProductWorkflowStepper";
import { DemoRelockButton } from "../demo-pin/DemoRelockButton";

type ProductWorkflowShellProps = {
  activeSection: AppSectionId;
  sections: readonly AppSection[];
  onSectionChange: (sectionId: AppSectionId) => void;
  onRelockDemo?: () => void;
  activeFloorplanBanner?: ReactNode;
  children: ReactNode;
};

export function ProductWorkflowShell({
  activeSection,
  sections,
  onSectionChange,
  onRelockDemo,
  activeFloorplanBanner,
  children
}: ProductWorkflowShellProps) {
  const stepperViewModel = createProductWorkflowStepperViewModel(activeSection);

  return (
    <main
      className="app-shell product-workflow-shell"
      data-product-shell-workflow="floorplan-assignments-scenario-simulation-report"
      data-full-page-workspace-shell="true"
      data-outer-margin-max-px="5"
      data-responsive-shell-layout="compact-rail-narrow-desktop"
    >
      <ProductSidebarRail
        activeSection={activeSection}
        sections={sections}
        onSectionChange={onSectionChange}
      />
      <div className="product-workflow-shell__main">
        <section className="workspace-header" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Shift workflow</p>
            <h1 id="page-title">{PRODUCT_DISPLAY_NAME}</h1>
            <p className="workspace-header__subtitle">
              Operational floorplan setup for synthetic shift review.
            </p>
          </div>
          <div className="workspace-header__controls">
            {onRelockDemo == null ? null : (
              <div className="workspace-header__lock-action">
                <DemoRelockButton onRelock={onRelockDemo} />
              </div>
            )}
          </div>
        </section>

        {activeFloorplanBanner}

        <ProductWorkflowStepper
          viewModel={stepperViewModel}
          onSectionChange={onSectionChange}
        />

        <section className="workflow-content" aria-live="polite">
          {children}
        </section>
      </div>
    </main>
  );
}
