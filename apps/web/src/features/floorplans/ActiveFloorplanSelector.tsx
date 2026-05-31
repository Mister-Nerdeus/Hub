import type { ActiveFloorplanSelectorViewModel } from "./activeFloorplanSelectorViewModel";

type ActiveFloorplanSelectorProps = {
  viewModel: ActiveFloorplanSelectorViewModel;
  onEditFloorplan: () => void;
  onUseForAssignment: () => void;
  onPrepareForSimulation: () => void;
  onChangeFloorplan: (versionId: string) => void;
  onOpenAdvanced: () => void;
};

export function ActiveFloorplanSelector({
  viewModel,
  onEditFloorplan,
  onUseForAssignment,
  onPrepareForSimulation,
  onChangeFloorplan,
  onOpenAdvanced
}: ActiveFloorplanSelectorProps) {
  return (
    <section
      className="active-floorplan-selector"
      aria-labelledby="active-floorplan-selector-title"
      data-normal-floorplan-selector="single-active-floorplan"
    >
      <div>
        <p className="eyebrow">Active floorplan</p>
        <h3 id="active-floorplan-selector-title">{viewModel.displayName}</h3>
        <p>Status: {viewModel.statusLabel}</p>
        <p>{viewModel.lastSavedLabel}</p>
        <p>{viewModel.selectedVersionLabel}</p>
      </div>
      <div className="active-floorplan-selector__actions">
        <button type="button" onClick={onEditFloorplan}>Edit Floorplan</button>
        <button type="button" disabled={!viewModel.canUseForAssignment} onClick={onUseForAssignment}>
          Use for Assignment
        </button>
        <button type="button" disabled={!viewModel.canUseForSimulation} onClick={onPrepareForSimulation}>
          Prepare for Simulation
        </button>
        <details className="active-floorplan-selector__change">
          <summary>Change Floorplan</summary>
          <label>
            Saved versions
            <select
              value={viewModel.selectedVersionId}
              onChange={(event) => onChangeFloorplan(event.target.value)}
            >
              <option value={viewModel.selectedVersionId}>{viewModel.selectedVersionLabel}</option>
              {viewModel.versionOptions.map((option) => (
                <option
                  key={option.versionId}
                  value={option.versionId}
                  disabled={option.archived}
                >
                  {option.label} - {option.savedAtLabel}{option.current ? " - current" : ""}
                </option>
              ))}
            </select>
          </label>
        </details>
        <button type="button" onClick={onOpenAdvanced}>Advanced</button>
      </div>
    </section>
  );
}
