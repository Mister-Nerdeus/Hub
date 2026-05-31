import type { AppSection, AppSectionId } from "./appNavigation";

type ProductSidebarRailProps = {
  activeSection: AppSectionId;
  sections: readonly AppSection[];
  onSectionChange: (sectionId: AppSectionId) => void;
};

const railGlyphBySectionId: Partial<Record<AppSectionId, string>> = {
  floorplans: "F",
  assignments: "A",
  scenarios: "S",
  simulation: "M",
  reports: "R",
  help: "?",
  editor: "E",
  "manual-assignment": "MA",
  "developer-evidence": "EV"
};

export function ProductSidebarRail({
  activeSection,
  sections,
  onSectionChange
}: ProductSidebarRailProps) {
  const primarySections = sections.filter((section) => section.group === "primary");
  const advancedSections = sections.filter((section) => section.group === "advanced");

  return (
    <aside
      className="product-sidebar product-sidebar-rail"
      aria-label="Product workflow rail"
      data-product-sidebar-rail="compact"
      data-rail-width-target="56-80"
    >
      <nav
        className="app-nav product-sidebar__nav product-sidebar-rail__nav"
        aria-label="Primary workflow navigation"
        data-normal-sidebar-items="Floorplan Assignments Scenario Simulation Report Help"
      >
        {primarySections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`app-nav__button product-sidebar__button product-sidebar-rail__button ${section.id === activeSection ? "app-nav__button--active product-sidebar__button--active" : ""}`}
            aria-label={section.label}
            aria-pressed={section.id === activeSection}
            title={section.label}
            onClick={() => onSectionChange(section.id)}
          >
            <span aria-hidden="true">{railGlyphBySectionId[section.id] ?? section.label.slice(0, 1)}</span>
            <span className="sr-only">{section.label}</span>
          </button>
        ))}
      </nav>
      <details className="product-sidebar__advanced product-sidebar-rail__advanced" data-advanced-evidence-secondary="true">
        <summary aria-label="Advanced and evidence navigation" title="Advanced/Evidence">
          <span aria-hidden="true">EV</span>
          <span className="sr-only">Advanced/Evidence</span>
        </summary>
        <div className="product-sidebar__advanced-list" aria-label="Advanced and evidence navigation">
          {advancedSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`app-nav__button product-sidebar__button product-sidebar__button--advanced product-sidebar-rail__button ${section.id === activeSection ? "app-nav__button--active product-sidebar__button--active" : ""}`}
              aria-label={section.label}
              aria-pressed={section.id === activeSection}
              title={section.label}
              onClick={() => onSectionChange(section.id)}
            >
              <span aria-hidden="true">{railGlyphBySectionId[section.id] ?? section.label.slice(0, 1)}</span>
              <span className="sr-only">{section.label}</span>
            </button>
          ))}
        </div>
      </details>
    </aside>
  );
}
