import type { ReactNode } from "react";
import { RuntimeBuildInfoPanel } from "../runtime/RuntimeBuildInfoPanel";
import { RuntimeMismatchBanner } from "../runtime/RuntimeMismatchBanner";

type AdvancedEvidencePanelProps = {
  children: ReactNode;
};

export function AdvancedEvidencePanel({ children }: AdvancedEvidencePanelProps) {
  return (
    <section className="advanced-evidence-panel" data-advanced-evidence-panel="true">
      <div
        className="advanced-evidence-panel__runtime"
        data-runtime-proof-advanced-only="true"
      >
        <RuntimeBuildInfoPanel />
        <RuntimeMismatchBanner />
      </div>
      {children}
    </section>
  );
}
