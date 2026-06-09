import { projectReadinessStatusFixture } from "@nerdeus/shared";
import { ReadinessStatusCard } from "./ReadinessStatusCard";
import "./ReadinessDashboard.css";

export function ReadinessDashboard() {
  return (
    <section
      className="readiness-dashboard"
      data-readiness-dashboard="true"
      data-readiness-scope="project_readiness_only"
      data-clinical-readiness-blocked="true"
      data-operational-readiness-blocked="true"
      data-go-live-readiness-blocked="true"
      data-simulation-blocked="true"
      data-scoring-blocked="true"
      data-recommendations-blocked="true"
    >
      <header className="readiness-dashboard__header">
        <h2 id="readiness-title">Project Readiness</h2>
        <p>Milestone readiness for manual-only project work.</p>
      </header>
      <div className="readiness-dashboard__grid">
        {projectReadinessStatusFixture.map((item) => (
          <ReadinessStatusCard key={item.itemId} item={item} />
        ))}
      </div>
    </section>
  );
}
