import type { FloorplanThumbnailShape, FloorplanThumbnailViewModel } from "./floorplanThumbnailViewModel";

type ActiveFloorplanThumbnailProps = {
  viewModel: FloorplanThumbnailViewModel;
};

export function ActiveFloorplanThumbnail({ viewModel }: ActiveFloorplanThumbnailProps) {
  return (
    <section
      className="active-floorplan-hub__thumbnail active-floorplan-thumbnail"
      aria-labelledby="active-floorplan-thumbnail-title"
      data-floorplan-thumbnail-preview="true"
      data-not-editor-canvas="true"
      data-thumbnail-status={viewModel.status}
    >
      <p className="eyebrow">Preview</p>
      <h3 id="active-floorplan-thumbnail-title">Thumbnail</h3>
      {viewModel.status === "empty" ? (
        <p className="active-floorplan-thumbnail__empty">No active layout preview is available.</p>
      ) : (
        <svg
          className="active-floorplan-thumbnail__svg"
          role="img"
          aria-label={`${viewModel.displayName} lightweight floorplan thumbnail`}
          viewBox="0 0 100 62"
        >
          {viewModel.hallways.map((shape) => renderShape(shape))}
          {viewModel.rooms.map((shape) => renderShape(shape))}
          {viewModel.providerPharmacy.map((shape) => renderShape(shape))}
          {viewModel.stations.map((shape) => renderShape(shape))}
        </svg>
      )}
    </section>
  );
}

function renderShape(shape: FloorplanThumbnailShape) {
  return (
    <rect
      key={`${shape.kind}-${shape.id}`}
      className={`active-floorplan-thumbnail__shape active-floorplan-thumbnail__shape--${shape.kind}`}
      x={shape.xPercent}
      y={shape.yPercent}
      width={shape.widthPercent}
      height={shape.heightPercent}
      rx="1.4"
    >
      <title>{shape.label}</title>
    </rect>
  );
}
