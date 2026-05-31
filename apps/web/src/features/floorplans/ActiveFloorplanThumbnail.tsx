import type { ActiveFloorplanContract } from "@nerdeus/shared";

type ActiveFloorplanThumbnailProps = {
  activeFloorplan: ActiveFloorplanContract;
};

export function ActiveFloorplanThumbnail({ activeFloorplan }: ActiveFloorplanThumbnailProps) {
  const layout = activeFloorplan.editableLayout;
  const bounds = layout.rooms.reduce(
    (current, room) => ({
      maxX: Math.max(current.maxX, room.xFeet + room.widthFeet),
      maxY: Math.max(current.maxY, room.yFeet + room.heightFeet)
    }),
    { maxX: 1, maxY: 1 }
  );
  const scaleX = 180 / bounds.maxX;
  const scaleY = 110 / bounds.maxY;
  const scale = Math.min(scaleX, scaleY);

  return (
    <figure className="active-floorplan-thumbnail" aria-label={`${activeFloorplan.displayName} thumbnail preview`}>
      <svg viewBox="0 0 200 130" role="img" aria-label="Active floorplan thumbnail">
        <rect className="active-floorplan-thumbnail__background" x="0" y="0" width="200" height="130" rx="6" />
        {layout.hallways.slice(0, 8).map((hallway) => (
          <rect
            key={hallway.id}
            className="active-floorplan-thumbnail__hallway"
            x={10 + hallway.xFeet * scale}
            y={10 + hallway.yFeet * scale}
            width={Math.max(4, hallway.widthFeet * scale)}
            height={Math.max(4, hallway.heightFeet * scale)}
          />
        ))}
        {layout.rooms.slice(0, 28).map((room) => (
          <rect
            key={room.id}
            className="active-floorplan-thumbnail__room"
            data-room-type={room.roomType}
            x={10 + room.xFeet * scale}
            y={10 + room.yFeet * scale}
            width={Math.max(5, room.widthFeet * scale)}
            height={Math.max(5, room.heightFeet * scale)}
          />
        ))}
        {layout.stations.slice(0, 5).map((station) => (
          <circle
            key={station.id}
            className="active-floorplan-thumbnail__station"
            cx={10 + (station.xFeet + station.widthFeet / 2) * scale}
            cy={10 + (station.yFeet + station.heightFeet / 2) * scale}
            r="3.5"
          />
        ))}
      </svg>
      <figcaption>{layout.rooms.length} rooms / {layout.stations.length} nurse stations</figcaption>
    </figure>
  );
}
