import type { ActiveFloorplanBannerViewModel } from "./activeFloorplanBannerViewModel";

type ActiveFloorplanBannerProps = {
  viewModel: ActiveFloorplanBannerViewModel;
  onChange: () => void;
  onEdit: () => void;
};

export function ActiveFloorplanBanner({
  viewModel,
  onChange,
  onEdit
}: ActiveFloorplanBannerProps) {
  return (
    <section
      className="active-floorplan-banner"
      aria-label="Active floorplan"
      data-active-floorplan-banner="normal"
      data-technical-ids-hidden={viewModel.technicalIdsHidden}
    >
      <strong>{viewModel.label}</strong>
      <div>
        <button type="button" onClick={onChange}>Change</button>
        <button type="button" onClick={onEdit}>Edit</button>
      </div>
    </section>
  );
}
