import type { ReactNode } from "react";
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
      {children}
    </ProductWorkflowShell>
  );
}
