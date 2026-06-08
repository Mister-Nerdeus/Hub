import type { ProjectReadinessStatusContract } from "@nerdeus/shared";

type ReadinessStatusCardProps = {
  item: ProjectReadinessStatusContract;
};

export function ReadinessStatusCard({ item }: ReadinessStatusCardProps) {
  return (
    <article className="readiness-status-card" data-readiness-status={item.status}>
      <h3>{item.label}</h3>
      <p>{item.status.replace("_", " ")}</p>
    </article>
  );
}
