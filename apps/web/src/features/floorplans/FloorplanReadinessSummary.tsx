import type { FloorplanReadinessContract } from "@nerdeus/shared";
import { FloorplanReadinessChecklist } from "./FloorplanReadinessChecklist";
import { createCompactReadinessSummary } from "./floorplanReadinessViewModel";

type FloorplanReadinessSummaryProps = {
  viewModel: FloorplanReadinessContract;
};

export function FloorplanReadinessSummary({ viewModel }: FloorplanReadinessSummaryProps) {
  const summaryItems = createCompactReadinessSummary(viewModel);

  return (
    <section
      className="floorplan-readiness-summary"
      aria-labelledby="floorplan-readiness-summary-title"
      data-compact-readiness-summary="true"
    >
      <div className="floorplan-readiness-summary__header">
        <p className="eyebrow">Readiness</p>
        <h3 id="floorplan-readiness-summary-title">Readiness summary</h3>
      </div>
      <dl className="floorplan-readiness-summary__items">
        {summaryItems.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd data-readiness-summary-status={item.status}>{item.status}</dd>
          </div>
        ))}
      </dl>
      <details className="floorplan-readiness-summary__details" data-details-collapsed-default="true">
        <summary>Readiness details</summary>
        <FloorplanReadinessChecklist viewModel={viewModel} />
      </details>
    </section>
  );
}
