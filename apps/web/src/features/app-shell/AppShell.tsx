import type { ReactNode } from "react";
import {
  type AppSection,
  type AppSectionId
} from "./appNavigation";
import { ProductWorkflowShell } from "./ProductWorkflowShell";

import "./appShell.css";

export type AppShellProps = {
  activeSection: AppSectionId;
  sections: readonly AppSection[];
  onSectionChange: (sectionId: AppSectionId) => void;
  onRelockDemo?: () => void;
  activeFloorplanBanner?: ReactNode;
  children: ReactNode;
};

export function AppShell(props: AppShellProps) {
  return <ProductWorkflowShell {...props} />;
}
