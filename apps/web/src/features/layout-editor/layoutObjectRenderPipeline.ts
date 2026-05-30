import type {
  EditableDoorGeometry,
  EditableHallwayGeometry,
  EditableLayoutGeometryContract,
  EditableRoomGeometry,
  EditableSplitBayGeometry,
  EditableStationGeometry,
  EditableSupportAccessPointGeometry,
  EditableZoneGeometry
} from "@nerdeus/shared";
import { normalizeDoorForOwnerWall } from "@nerdeus/shared";

import {
  rectFeetToPixels,
  type LayoutRectFeet,
  type LayoutRectPixels,
  type LayoutViewportTransform
} from "./layoutCoordinateSystem";
import type { LayoutSelectionObjectType } from "./layoutSelectionModel";

export const LAYOUT_OBJECT_RENDER_LAYER_ORDER = [
  "hallways",
  "zones",
  "rooms",
  "doors",
  "stations",
  "overlays"
] as const;

export type LayoutObjectRenderLayer = (typeof LAYOUT_OBJECT_RENDER_LAYER_ORDER)[number];

export type LayoutObjectRenderItem = {
  objectType: LayoutSelectionObjectType;
  objectId: string;
  renderLayer: LayoutObjectRenderLayer;
  renderLayerIndex: number;
  ariaLabel: string;
  hitTargetKey: string;
  displayRectFeet: LayoutRectFeet;
  displayRectPixels: LayoutRectPixels;
  geometryStatus?: "valid" | "clamped" | "invalid";
  geometryWarnings?: readonly string[];
  sourceGeometry:
    | EditableHallwayGeometry
    | EditableZoneGeometry
    | EditableRoomGeometry
    | EditableDoorGeometry
    | EditableSupportAccessPointGeometry
    | EditableSplitBayGeometry
    | EditableStationGeometry;
};

export type BuildLayoutObjectRenderPipelineInput = {
  layout: EditableLayoutGeometryContract;
  viewport: LayoutViewportTransform;
};

const DOOR_THICKNESS_FEET = 0.5;
const MINIMUM_DISPLAY_DOOR_WIDTH_FEET = 2;

export function buildLayoutObjectRenderPipeline({
  layout,
  viewport
}: BuildLayoutObjectRenderPipelineInput): LayoutObjectRenderItem[] {
  const items: LayoutObjectRenderItem[] = [
    ...layout.hallways.map((hallway) =>
      buildRectRenderItem("hallway", hallway.id, "hallways", hallway.label, hallway, hallway, viewport)
    ),
    ...layout.zones.map((zone) =>
      buildRectRenderItem("zone", zone.id, "zones", `${zone.label} ${zone.zoneType}`, zone, zone, viewport)
    ),
    ...layout.rooms.map((room) =>
      buildRectRenderItem("room", room.id, "rooms", `${room.label} ${room.roomType}`, room, room, viewport)
    ),
    ...(layout.splitBays ?? []).map((splitBay) =>
      buildRectRenderItem(
        "split_bay",
        splitBay.id,
        "overlays",
        `${splitBay.label} ${splitBay.dividerStyle}`,
        splitBay,
        splitBay,
        viewport
      )
    ),
    ...layout.doors.map((door) =>
      buildDoorRenderItem(door, layout, viewport)
    ).filter((item): item is LayoutObjectRenderItem => item != null),
    ...(layout.supportAccessPoints ?? []).map((accessPoint) =>
      buildSupportAccessRenderItem(accessPoint, layout, viewport)
    ).filter((item): item is LayoutObjectRenderItem => item != null),
    ...layout.stations.map((station) =>
      buildRectRenderItem(
        "station",
        station.id,
        "stations",
        `${station.label} ${station.stationType}`,
        station,
        station,
        viewport
      )
    )
  ];

  return items.sort((left, right) => {
    if (left.renderLayerIndex !== right.renderLayerIndex) {
      return left.renderLayerIndex - right.renderLayerIndex;
    }
    return left.objectId.localeCompare(right.objectId);
  });
}

function buildRectRenderItem(
  objectType: LayoutSelectionObjectType,
  objectId: string,
  renderLayer: LayoutObjectRenderLayer,
  label: string,
  rectFeet: LayoutRectFeet,
  sourceGeometry: LayoutObjectRenderItem["sourceGeometry"],
  viewport: LayoutViewportTransform
): LayoutObjectRenderItem {
  return {
    objectType,
    objectId,
    renderLayer,
    renderLayerIndex: layerIndex(renderLayer),
    ariaLabel: `${label} ${objectType}`,
    hitTargetKey: `${objectType}:${objectId}`,
    displayRectFeet: { ...rectFeet },
    displayRectPixels: rectFeetToPixels(rectFeet, viewport),
    geometryStatus: "valid",
    geometryWarnings: [],
    sourceGeometry
  };
}

function buildDoorRenderItem(
  door: EditableDoorGeometry,
  layout: EditableLayoutGeometryContract,
  viewport: LayoutViewportTransform
): LayoutObjectRenderItem | null {
  const owner = findDoorOwnerRect(door, layout);
  if (owner == null) {
    return null;
  }

  const normalized = normalizeDoorForOwnerWall({
    door,
    ownerRect: owner,
    minimumDoorWidthFeet: MINIMUM_DISPLAY_DOOR_WIDTH_FEET
  });
  const displayRectFeet = deriveDoorDisplayRectFeet(normalized.door, owner);
  return {
    ...buildRectRenderItem(
    "door",
    door.id,
    "doors",
    `${door.label} ${door.wall}`,
    displayRectFeet,
    door,
    viewport
    ),
    geometryStatus: normalized.status,
    geometryWarnings: normalized.warnings
  };
}

function buildSupportAccessRenderItem(
  accessPoint: EditableSupportAccessPointGeometry,
  layout: EditableLayoutGeometryContract,
  viewport: LayoutViewportTransform
): LayoutObjectRenderItem | null {
  const owner = layout.zones.find((zone) => zone.id === accessPoint.ownerId);
  if (owner == null) {
    return null;
  }
  const displayRectFeet = deriveDoorDisplayRectFeet(accessPoint, owner);
  return buildRectRenderItem(
    "support_access",
    accessPoint.id,
    "doors",
    `${accessPoint.label} ${accessPoint.wall}`,
    displayRectFeet,
    accessPoint,
    viewport
  );
}

function findDoorOwnerRect(
  door: EditableDoorGeometry,
  layout: EditableLayoutGeometryContract
): LayoutRectFeet | null {
  const source = door.ownerKind === "room"
    ? layout.rooms.find((room) => room.id === door.ownerId)
    : layout.hallways.find((hallway) => hallway.id === door.ownerId);
  if (source == null) {
    return null;
  }
  return {
    xFeet: source.xFeet,
    yFeet: source.yFeet,
    widthFeet: source.widthFeet,
    heightFeet: source.heightFeet
  };
}

export function deriveDoorDisplayRectFeet(
  door: Pick<EditableDoorGeometry, "wall" | "offsetFeet" | "widthFeet">,
  owner: LayoutRectFeet
): LayoutRectFeet {
  switch (door.wall) {
    case "north":
      return {
        xFeet: owner.xFeet + door.offsetFeet,
        yFeet: owner.yFeet - DOOR_THICKNESS_FEET / 2,
        widthFeet: door.widthFeet,
        heightFeet: DOOR_THICKNESS_FEET
      };
    case "south":
      return {
        xFeet: owner.xFeet + door.offsetFeet,
        yFeet: owner.yFeet + owner.heightFeet - DOOR_THICKNESS_FEET / 2,
        widthFeet: door.widthFeet,
        heightFeet: DOOR_THICKNESS_FEET
      };
    case "east":
      return {
        xFeet: owner.xFeet + owner.widthFeet - DOOR_THICKNESS_FEET / 2,
        yFeet: owner.yFeet + door.offsetFeet,
        widthFeet: DOOR_THICKNESS_FEET,
        heightFeet: door.widthFeet
      };
    case "west":
      return {
        xFeet: owner.xFeet - DOOR_THICKNESS_FEET / 2,
        yFeet: owner.yFeet + door.offsetFeet,
        widthFeet: DOOR_THICKNESS_FEET,
        heightFeet: door.widthFeet
      };
  }
}

function layerIndex(renderLayer: LayoutObjectRenderLayer): number {
  return LAYOUT_OBJECT_RENDER_LAYER_ORDER.indexOf(renderLayer);
}
