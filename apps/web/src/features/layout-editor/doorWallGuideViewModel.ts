import {
  buildDoorWallSnapGuide,
  type EditableDoorGeometry,
  type EditableRoomGeometry
} from "@nerdeus/shared";

export type DoorWallGuideViewModel = {
  status: "missing" | "ready";
  doorId: string | null;
  wallLengthFeet: number;
  centerOffsetFeet: number;
  currentOffsetFeet: number;
  markers: readonly { offsetFeet: number; label: string }[];
};

export function buildDoorWallGuideViewModel(input: {
  door: EditableDoorGeometry | null;
  ownerRoom: EditableRoomGeometry | null;
}): DoorWallGuideViewModel {
  if (input.door == null || input.ownerRoom == null) {
    return {
      status: "missing",
      doorId: null,
      wallLengthFeet: 0,
      centerOffsetFeet: 0,
      currentOffsetFeet: 0,
      markers: []
    };
  }
  const guide = buildDoorWallSnapGuide({ door: input.door, room: input.ownerRoom });
  return {
    status: "ready",
    doorId: guide.doorId,
    wallLengthFeet: guide.wallLengthFeet,
    centerOffsetFeet: guide.centerOffsetFeet,
    currentOffsetFeet: guide.currentOffsetFeet,
    markers: guide.markers
  };
}
