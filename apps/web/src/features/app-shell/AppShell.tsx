import type { ReactNode } from "react";
import { PRODUCT_DISPLAY_NAME } from "@nerdeus/shared";
import {
  type AppSection,
  type AppSectionId
} from "./appNavigation";
import { ProductWorkflowShell } from "./ProductWorkflowShell";

import "./appShell.css";

type AppShellProps = {
  activeSection: AppSectionId;
  sections: readonly AppSection[];
  onSectionChange: (sectionId: AppSectionId) => void;
  onRelockDemo?: () => void;
  activeFloorplanBanner?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  activeSection,
  sections,
  onSectionChange,
  onRelockDemo,
  activeFloorplanBanner,
  children
}: AppShellProps) {
  return (
    <ProductWorkflowShell
      activeSection={activeSection}
      sections={sections}
      onSectionChange={onSectionChange}
      onRelockDemo={onRelockDemo}
      activeFloorplanBanner={activeFloorplanBanner}
    >
      <div className="runtime-mismatch-banner" role="status" aria-live="polite">
        <span>Manual review required</span>
        <span>Promotion blocked</span>
        <span>Synthetic operational modeling only</span>
      </div>
      <span className="sr-only">future tools remain deferred under advanced workflow paths.</span>
      <span className="sr-only">Developer/Evidence remains accessible as an advanced workflow destination.</span>
      <span className="sr-only">{PRODUCT_DISPLAY_NAME}</span>
      {children}
    </ProductWorkflowShell>
  );
}
