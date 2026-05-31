import type { ActiveFloorplanSelectorViewModel } from "./activeFloorplanSelectorViewModel";

type ActiveFloorplanCardProps = {
  viewModel: ActiveFloorplanSelectorViewModel;
  onEditFloorplan: () => void;
  onUseForAssignment: () => void;
  onChangeFloorplan: (versionId: string) => void;
  onOpenAdvanced: () => void;
};

export function ActiveFloorplanCard({
  viewModel,
  onEditFloorplan,
  onUseForAssignment,
  onChangeFloorplan,
  onOpenAdvanced
}: ActiveFloorplanCardProps) {
  const conciseStatus = viewModel.canUseForAssignment ? "Ready for assignment setup" : "Needs work";

  return (
    <section
      className="active-floorplan-selector active-floorplan-card"
      aria-labelledby="active-floorplan-selector-title"
      data-normal-floorplan-selector="single-active-floorplan"
      data-active-floorplan-card="layout-v1"
      data-card-status-label={conciseStatus}
    >
      <div className="active-floorplan-card__thumbnail-area" aria-hidden="true" data-card-thumbnail-area="true">
        <span>{viewModel.displayName.slice(0, 2).toUpperCase()}</span>
      </div>

      <div className="active-floorplan-card__metadata">
        <p className="eyebrow">Active floorplan</p>
        <h3 id="active-floorplan-selector-title" className="active-floorplan-card__title">
          {viewModel.displayName}
        </h3>
        <p className="active-floorplan-card__status">{conciseStatus}</p>
        <p>{viewModel.lastSavedLabel}</p>
        <p>{viewModel.selectedVersionLabel}</p>
      </div>

      <div className="active-floorplan-selector__actions active-floorplan-card__actions" data-card-actions-wrap="true">
        <button type="button" onClick={onEditFloorplan}>Edit Floorplan</button>
        <button type="button" disabled={!viewModel.canUseForAssignment} onClick={onUseForAssignment}>
          Use for Assignment
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
