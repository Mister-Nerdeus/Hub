import { LayoutToolPalette } from "./LayoutToolPalette";

const element = LayoutToolPalette({
  mode: "select",
  selectedRoomType: "patient_room",
  readOnly: false,
  onModeChange: () => undefined,
  onRoomTypeChange: () => undefined,
  onGenerateHallways: () => undefined
});

if (element.type !== "section") {
  throw new Error("LayoutToolPalette must render a section");
}
