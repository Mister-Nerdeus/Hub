import { AutoHallwayControls } from "./AutoHallwayControls";

const element = AutoHallwayControls({
  readOnly: false,
  generatedCount: 2,
  onGenerate: () => undefined
});

if (element.type !== "section") {
  throw new Error("AutoHallwayControls must render a section");
}
