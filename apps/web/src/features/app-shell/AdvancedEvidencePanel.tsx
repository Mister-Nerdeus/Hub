import type { ReactNode } from "react";

type AdvancedEvidencePanelProps = {
  title: string;
  children: ReactNode;
};

export function AdvancedEvidencePanel({ title, children }: AdvancedEvidencePanelProps) {
  return (
    <section
      className="developer-evidence__panel advanced-evidence-panel"
      aria-label={title}
      data-advanced-evidence-panel="true"
    >
      <h3>{title}</h3>
      {children}
    </section>
  );
}
