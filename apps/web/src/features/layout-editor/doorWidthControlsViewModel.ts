import {
  STANDARD_DOOR_WIDTH_PRESETS_FEET,
  deriveDoorOrientationFromWall,
  type EditableDoorGeometry,
  type EditableRoomGeometry
} from "@nerdeus/shared";

export type DoorWidthControlsViewModel = {
  status: "missing" | "ready";
  widthFeet: number | null;
  orientationLabel: string;
  presetsFeet: readonly number[];
  readOnly: boolean;
};

export function buildDoorWidthControlsViewModel(input: {
  door: EditableDoorGeometry | null;
  ownerRoom: EditableRoomGeometry | null;
  readOnly: boolean;
}): DoorWidthControlsViewModel {
  if (input.door == null || input.ownerRoom == null) {
    return {
      status: "missing",
      widthFeet: null,
      orientationLabel: "No wall selected",
      presetsFeet: STANDARD_DOOR_WIDTH_PRESETS_FEET,
      readOnly: true
    };
  }
  return {
    status: "ready",
    widthFeet: input.door.widthFeet,
    orientationLabel: `${deriveDoorOrientationFromWall(input.door.wall)} door on ${input.door.wall} wall`,
    presetsFeet: STANDARD_DOOR_WIDTH_PRESETS_FEET,
    readOnly: input.readOnly
  };
}
