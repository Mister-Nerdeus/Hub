import type { SimulationV0OccupiedBedProofViewModel } from "./simulationV0OccupiedBedProofViewModel";

type Props = {
  viewModel: SimulationV0OccupiedBedProofViewModel;
};

export function SimulationV0OccupiedBedProofPanel({ viewModel }: Props) {
  return (
    <section className="simulation-v0-section" aria-labelledby="simulation-v0-occupied-bed-proof-title">
      <div className="simulation-v0-section__header">
        <div>
          <h3 id="simulation-v0-occupied-bed-proof-title">Occupied bed proof</h3>
          <p>{viewModel.profileLabel} / {viewModel.occupancyPercent}% occupancy</p>
        </div>
        <strong>{viewModel.selectedOccupiedBedCount} selected</strong>
      </div>
      <dl className="simulation-v0-panel__artifact">
        <div>
          <dt>Excluded objects</dt>
          <dd>{viewModel.excludedObjectCount}</dd>
        </div>
        <div>
          <dt>Excluded categories</dt>
          <dd>{viewModel.excludedObjectCategories.join(", ")}</dd>
        </div>
        <div>
          <dt>Capacity note</dt>
          <dd>{viewModel.capacityNote}</dd>
        </div>
      </dl>
      <ul className="simulation-v0-id-list" aria-label="Selected occupied bed-position IDs">
        {viewModel.selectedBedPositionIds.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
    </section>
  );
}
