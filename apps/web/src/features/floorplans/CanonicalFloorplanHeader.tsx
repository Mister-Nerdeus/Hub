import type { CanonicalFloorplanHeaderViewModel } from "./canonicalFloorplanHeaderViewModel";

type CanonicalFloorplanHeaderProps = {
  viewModel: CanonicalFloorplanHeaderViewModel;
};

export function CanonicalFloorplanHeader({ viewModel }: CanonicalFloorplanHeaderProps) {
  return (
    <section className="canonical-floorplan-header" aria-labelledby="canonical-floorplan-header-title">
      <div>
        <p className="eyebrow">Single floorplan model</p>
        <h2 id="canonical-floorplan-header-title">{viewModel.title}</h2>
        <p>{viewModel.activeFloorplanStatus}</p>
      </div>
      <dl className="canonical-floorplan-header__summary" aria-label="Canonical floorplan summary">
        <div>
          <dt>Active map</dt>
          <dd>{viewModel.activeFloorplanName}</dd>
        </div>
        <div>
          <dt>Edit status</dt>
          <dd>{viewModel.editableCopyStatus}</dd>
        </div>
        <div>
          <dt>Saved copies</dt>
          <dd>{viewModel.savedCopyCount}</dd>
        </div>
      </dl>
      <ul>
        <li>{viewModel.ratioLayeringCopy}</li>
        <li>{viewModel.operationalApproximationCopy}</li>
        <li>{viewModel.exactCadNonClaim}</li>
        <li>{viewModel.staffingComplianceNonClaim}</li>
      </ul>
    </section>
  );
}
