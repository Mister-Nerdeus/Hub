import type { ReactNode } from "react";
import { PRODUCT_DISPLAY_NAME } from "@nerdeus/shared";
import type { AppSection, AppSectionId } from "./appNavigation";

import "./appShell.css";

type AppShellProps = {
  activeSection: AppSectionId;
  sections: readonly AppSection[];
  onSectionChange: (sectionId: AppSectionId) => void;
  children: ReactNode;
};

export function AppShell({
  activeSection,
  sections,
  onSectionChange,
  children
}: AppShellProps) {
  return (
    <main className="app-shell">
      <section className="workspace-header" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Operational demo workspace</p>
          <h1 id="page-title">{PRODUCT_DISPLAY_NAME}</h1>
          <p className="workspace-header__subtitle">
            Synthetic operational modeling only. Manual review required; promotion blocked.
          </p>
        </div>
        <div className="workspace-header__state-banner" role="status">
          <span>Manual review required</span>
          <span>Promotion blocked</span>
          <span>Synthetic operational modeling only</span>
        </div>
      </section>

      <nav className="app-nav" aria-label="Primary workspace navigation">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`app-nav__button ${section.id === activeSection ? "app-nav__button--active" : ""}`}
            aria-pressed={section.id === activeSection}
            onClick={() => onSectionChange(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <section className="workflow-content" aria-live="polite">
        {children}
      </section>
    </main>
  );
}
