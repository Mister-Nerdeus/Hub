import { AutoHallwayControls } from "./AutoHallwayControls";

const element = AutoHallwayControls({
  readOnly: false,
  generatedCount: 2,
  generationMethod: "grid_subtraction",
  gridCellSizeFeet: 4,
  onGenerate: () => undefined
});

if (element.type !== "section") {
  throw new Error("AutoHallwayControls must render a section");
}
const methodText = element.props.children[2];
if (methodText.props.children.join("") !== "grid subtraction / 4 ft grid") {
  throw new Error("AutoHallwayControls must disclose the active hallway generation method");
}
