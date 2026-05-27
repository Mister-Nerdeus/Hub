import type { DoorPlacementValidityViewModel } from "./doorPlacementValidityViewModel";

export function DoorPlacementValidityPreview({
  viewModel
}: {
  viewModel: DoorPlacementValidityViewModel;
}) {
  return (
    <aside
      className={`door-placement-validity-preview door-placement-validity-preview--${viewModel.status}`}
      data-door-placement-validity={viewModel.status}
      aria-label="Door placement validity preview"
    >
      <strong>{viewModel.label}</strong>
      {viewModel.warnings.length === 0 ? (
        <p>Owner wall, offset, width, and adjacent connection are plausible.</p>
      ) : (
        <ul>
          {viewModel.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}
