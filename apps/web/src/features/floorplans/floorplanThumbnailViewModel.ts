import type { ActiveFloorplanContract } from "@nerdeus/shared";

export type FloorplanThumbnailShape =
  | {
      kind: "room";
      id: string;
      roomType: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      kind: "hallway";
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      kind: "station";
      id: string;
      cx: number;
      cy: number;
      radius: number;
    };

export type FloorplanThumbnailViewModel = {
  status: "ready" | "empty";
  displayName: string;
  roomCount: number;
  stationCount: number;
  shapes: FloorplanThumbnailShape[];
};

export function createFloorplanThumbnailViewModel(
  activeFloorplan: ActiveFloorplanContract | null
): FloorplanThumbnailViewModel {
  if (activeFloorplan == null || activeFloorplan.editableLayout.rooms.length === 0) {
    return {
      status: "empty",
      displayName: "No active layout",
      roomCount: 0,
      stationCount: 0,
      shapes: []
    };
  }

  const layout = activeFloorplan.editableLayout;
  const bounds = layout.rooms.reduce(
    (current, room) => ({
      maxX: Math.max(current.maxX, room.xFeet + room.widthFeet),
      maxY: Math.max(current.maxY, room.yFeet + room.heightFeet)
    }),
    { maxX: 1, maxY: 1 }
  );
  const scale = Math.min(180 / bounds.maxX, 110 / bounds.maxY);
  const shapes: FloorplanThumbnailShape[] = [
    ...layout.hallways.slice(0, 8).map((hallway) => ({
      kind: "hallway" as const,
      id: hallway.id,
      x: 10 + hallway.xFeet * scale,
      y: 10 + hallway.yFeet * scale,
      width: Math.max(4, hallway.widthFeet * scale),
      height: Math.max(4, hallway.heightFeet * scale)
    })),
    ...layout.rooms.slice(0, 28).map((room) => ({
      kind: "room" as const,
      id: room.id,
      roomType: room.roomType,
      x: 10 + room.xFeet * scale,
      y: 10 + room.yFeet * scale,
      width: Math.max(5, room.widthFeet * scale),
      height: Math.max(5, room.heightFeet * scale)
    })),
    ...layout.stations.slice(0, 5).map((station) => ({
      kind: "station" as const,
      id: station.id,
      cx: 10 + (station.xFeet + station.widthFeet / 2) * scale,
      cy: 10 + (station.yFeet + station.heightFeet / 2) * scale,
      radius: 3.5
    }))
  ];

  return {
    status: "ready",
    displayName: activeFloorplan.displayName,
    roomCount: layout.rooms.length,
    stationCount: layout.stations.length,
    shapes
  };
}
