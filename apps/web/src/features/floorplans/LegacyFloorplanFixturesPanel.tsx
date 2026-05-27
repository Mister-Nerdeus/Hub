import type { LegacyFloorplanFixturesPanelViewModel } from "./legacyFloorplanFixturesViewModel";

type LegacyFloorplanFixturesPanelProps = {
  viewModel: LegacyFloorplanFixturesPanelViewModel;
};

export function LegacyFloorplanFixturesPanel({ viewModel }: LegacyFloorplanFixturesPanelProps) {
  return (
    <section className="legacy-floorplan-fixtures" aria-labelledby="legacy-floorplan-fixtures-title">
      <h3 id="legacy-floorplan-fixtures-title">{viewModel.title}</h3>
      <p>{viewModel.evidenceCopy}</p>
      <ul>
        {viewModel.floorplans.map((floorplan) => (
          <li
            key={floorplan.recordId}
            data-plan-id={floorplan.planId}
            data-active-scenario-disabled={floorplan.activeScenarioUseDisabled}
            data-product-visibility="advanced-evidence-only"
          >
            <span>{floorplan.name}</span>
            <span>{floorplan.legacyLabel}</span>
            <span>{floorplan.planId}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
