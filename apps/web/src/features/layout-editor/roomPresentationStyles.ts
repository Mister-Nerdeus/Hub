import { isPresentationMutedRoomType, type SemanticRoomType } from "@nerdeus/shared";

export type RoomPresentationStyle = {
  roomType: SemanticRoomType;
  fill: string;
  stroke: string;
  textFill: string;
  muted: boolean;
  legendLabel: string | null;
};

const defaultStyle: RoomPresentationStyle = {
  roomType: "standard",
  fill: "#ffffff",
  stroke: "#22364a",
  textFill: "#111827",
  muted: false,
  legendLabel: null
};

export const semanticRoomPresentationStyles = {
  storage: {
    roomType: "storage",
    fill: "#b8c0ca",
    stroke: "#5f6975",
    textFill: "#111827",
    muted: true,
    legendLabel: "Storage"
  },
  solid_wall: {
    roomType: "solid_wall",
    fill: "#6f7782",
    stroke: "#374151",
    textFill: "#ffffff",
    muted: true,
    legendLabel: "Solid wall / blocked area"
  }
} as const satisfies Partial<Record<SemanticRoomType, RoomPresentationStyle>>;

export function getRoomPresentationStyle(roomType: string): RoomPresentationStyle {
  const semanticRoomType = roomType as SemanticRoomType;
  const explicit =
    (semanticRoomPresentationStyles as Partial<Record<SemanticRoomType, RoomPresentationStyle>>)[
      semanticRoomType
    ];
  if (explicit != null) return explicit;
  return {
    ...defaultStyle,
    roomType: semanticRoomType,
    muted: isPresentationMutedRoomType(semanticRoomType)
  };
}

export function roomTypeSuppressesAssignmentOverlay(roomType: string): boolean {
  return getRoomPresentationStyle(roomType).muted;
}
