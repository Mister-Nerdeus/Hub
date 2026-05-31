import type {
  ActiveFloorplanContract,
  EditableHallwayGeometry,
  EditableRectFeet,
  EditableRoomGeometry,
  EditableStationGeometry,
  EditableZoneGeometry
} from "@nerdeus/shared";

export type FloorplanThumbnailShapeKind = "room" | "station" | "provider_pharmacy" | "hallway";

export type FloorplanThumbnailShape = {
  id: string;
  label: string;
  kind: FloorplanThumbnailShapeKind;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
};

export type FloorplanThumbnailViewModel = {
  status: "empty" | "ready";
  displayName: string;
  rooms: FloorplanThumbnailShape[];
  stations: FloorplanThumbnailShape[];
  providerPharmacy: FloorplanThumbnailShape[];
  hallways: FloorplanThumbnailShape[];
};

export function createFloorplanThumbnailViewModel(
  activeFloorplan: ActiveFloorplanContract | null
): FloorplanThumbnailViewModel {
  if (activeFloorplan == null) {
    return emptyThumbnail("No active floorplan");
  }
  const layout = activeFloorplan.editableLayout;
  const roomRects = layout.rooms.filter((room) => room.roomType !== "provider_pharmacy");
  const providerRoomRects = layout.rooms.filter((room) => room.roomType === "provider_pharmacy");
  const providerZoneRects = layout.zones.filter((zone) => zone.zoneType === "provider_pharmacy");
  const sourceRects = [
    ...layout.rooms,
    ...layout.stations,
    ...layout.hallways,
    ...providerZoneRects
  ];

  if (sourceRects.length === 0) {
    return emptyThumbnail(activeFloorplan.displayName);
  }

  const bounds = createBounds(sourceRects);

  return {
    status: "ready",
    displayName: activeFloorplan.displayName,
    rooms: roomRects.map((room) => toShape(room, "room", bounds, room.roomNumber || room.label)),
    stations: layout.stations.map((station) => toShape(station, "station", bounds, station.label)),
    providerPharmacy: [
      ...providerRoomRects.map((room) => toShape(room, "provider_pharmacy", bounds, room.roomNumber || room.label)),
      ...providerZoneRects.map((zone) => toShape(zone, "provider_pharmacy", bounds, zone.label))
    ],
    hallways: layout.hallways.map((hallway) => toShape(hallway, "hallway", bounds, hallway.label))
  };
}

function emptyThumbnail(displayName: string): FloorplanThumbnailViewModel {
  return {
    status: "empty",
    displayName,
    rooms: [],
    stations: [],
    providerPharmacy: [],
    hallways: []
  };
}

function createBounds(
  rects: readonly (EditableRoomGeometry | EditableStationGeometry | EditableHallwayGeometry | EditableZoneGeometry)[]
) {
  const minX = Math.min(...rects.map((rect) => rect.xFeet));
  const minY = Math.min(...rects.map((rect) => rect.yFeet));
  const maxX = Math.max(...rects.map((rect) => rect.xFeet + rect.widthFeet));
  const maxY = Math.max(...rects.map((rect) => rect.yFeet + rect.heightFeet));
  return {
    minX,
    minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1)
  };
}

function toShape(
  rect: EditableRectFeet,
  kind: FloorplanThumbnailShapeKind,
  bounds: ReturnType<typeof createBounds>,
  label: string
): FloorplanThumbnailShape {
  const inset = 2;
  const width = 100 - inset * 2;
  const height = 62 - inset * 2;
  return {
    id: rect.id,
    label,
    kind,
    xPercent: inset + ((rect.xFeet - bounds.minX) / bounds.width) * width,
    yPercent: inset + ((rect.yFeet - bounds.minY) / bounds.height) * height,
    widthPercent: Math.max((rect.widthFeet / bounds.width) * width, 1),
    heightPercent: Math.max((rect.heightFeet / bounds.height) * height, 1)
  };
}
