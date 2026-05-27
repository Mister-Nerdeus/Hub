import type { ReactNode } from "react";
import { PRODUCT_DISPLAY_NAME } from "@nerdeus/shared";
import {
  type AppSection,
  type AppSectionId
} from "./appNavigation";

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
  const primarySections = sections.filter((section) => section.group === "primary");
  const advancedSections = sections.filter((section) => section.group === "advanced");
  const futureSections = sections.filter((section) => section.group === "future");

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

      <nav className="app-nav" aria-label="Primary workflow navigation">
        {primarySections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`app-nav__button app-nav__button--primary ${section.id === activeSection ? "app-nav__button--active" : ""}`}
            aria-pressed={section.id === activeSection}
            onClick={() => onSectionChange(section.id)}
          >
            {section.label}
          </button>
        ))}
        <details className="app-nav__advanced-tools">
          <summary>Advanced</summary>
          <div className="app-nav__advanced-list" aria-label="Advanced navigation">
            {advancedSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`app-nav__button app-nav__button--advanced ${section.id === activeSection ? "app-nav__button--active" : ""}`}
                aria-pressed={section.id === activeSection}
                onClick={() => onSectionChange(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </details>
        <details className="app-nav__future-tools">
          <summary>Future Tools</summary>
          <div className="app-nav__future-list" aria-label="Future tools navigation">
            {futureSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`app-nav__button app-nav__button--future ${section.id === activeSection ? "app-nav__button--active" : ""}`}
                aria-pressed={section.id === activeSection}
                onClick={() => onSectionChange(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </details>
      </nav>

      <section className="workflow-content" aria-live="polite">
        {children}
      </section>
    </main>
  );
}
