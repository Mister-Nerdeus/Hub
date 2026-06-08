import { projectReadinessStatusFixture } from "@nerdeus/shared";
import { ReadinessStatusCard } from "./ReadinessStatusCard";
import "./ReadinessDashboard.css";

export function ReadinessDashboard() {
  return (
    <section className="readiness-dashboard" data-readiness-dashboard="true">
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
