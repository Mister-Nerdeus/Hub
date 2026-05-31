import type { ActiveFloorplanContract } from "@nerdeus/shared";
import { createFloorplanThumbnailViewModel } from "./floorplanThumbnailViewModel";

type ActiveFloorplanThumbnailProps = {
  activeFloorplan: ActiveFloorplanContract;
};

export function ActiveFloorplanThumbnail({ activeFloorplan }: ActiveFloorplanThumbnailProps) {
  const viewModel = createFloorplanThumbnailViewModel(activeFloorplan);

  return (
    <figure className="active-floorplan-thumbnail" aria-label={`${activeFloorplan.displayName} thumbnail preview`}>
      <svg viewBox="0 0 200 130" role="img" aria-label="Active floorplan thumbnail">
        <rect className="active-floorplan-thumbnail__background" x="0" y="0" width="200" height="130" rx="6" />
        {viewModel.status === "empty" ? (
          <text x="100" y="68" textAnchor="middle">No active layout</text>
        ) : null}
        {viewModel.shapes.map((shape) => {
          if (shape.kind === "station") {
            return (
              <circle
                key={shape.id}
                className="active-floorplan-thumbnail__station"
                cx={shape.cx}
                cy={shape.cy}
                r={shape.radius}
              />
            );
          }
          return (
            <rect
              key={shape.id}
              className={shape.kind === "hallway" ? "active-floorplan-thumbnail__hallway" : "active-floorplan-thumbnail__room"}
              data-room-type={shape.kind === "room" ? shape.roomType : undefined}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
            />
          );
        })}
      </svg>
      <figcaption>{viewModel.roomCount} rooms / {viewModel.stationCount} nurse stations</figcaption>
    </figure>
  );
}
