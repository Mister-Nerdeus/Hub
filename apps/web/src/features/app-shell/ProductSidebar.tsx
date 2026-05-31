import type { AppSection, AppSectionId } from "./appNavigation";

type ProductSidebarProps = {
  activeSection: AppSectionId;
  sections: readonly AppSection[];
  onSectionChange: (sectionId: AppSectionId) => void;
};

export function ProductSidebar({
  activeSection,
  sections,
  onSectionChange
}: ProductSidebarProps) {
  const primarySections = sections.filter((section) => section.group === "primary");
  const advancedSections = sections.filter((section) => section.group === "advanced");

  return (
    <aside className="product-sidebar" aria-label="Product navigation">
      <nav
        className="app-nav product-sidebar__nav"
        aria-label="Primary workflow navigation"
        data-normal-sidebar-items="Floorplan Assignments Scenarios Simulation Reports Help"
      >
        {primarySections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`app-nav__button product-sidebar__button ${section.id === activeSection ? "app-nav__button--active product-sidebar__button--active" : ""}`}
            aria-pressed={section.id === activeSection}
            onClick={() => onSectionChange(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>
      <details className="product-sidebar__advanced" data-runtime-proof-advanced-only="true">
        <summary>Advanced/Evidence</summary>
        <div className="product-sidebar__advanced-list" aria-label="Advanced and evidence navigation">
          {advancedSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`app-nav__button product-sidebar__button product-sidebar__button--advanced ${section.id === activeSection ? "app-nav__button--active product-sidebar__button--active" : ""}`}
              aria-pressed={section.id === activeSection}
              onClick={() => onSectionChange(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </details>
    </aside>
  );
}
