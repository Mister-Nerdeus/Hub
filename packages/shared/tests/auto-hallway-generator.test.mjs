import { generateAutoHallways } from "../dist/index.js";
import { testEditableLayout, throws } from "./authoring-test-helpers.mjs";

const result = generateAutoHallways({
  layout: testEditableLayout,
  sourcePlanId: "editable-authoring-plan",
  readOnly: false,
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 100 }
});
if (result.generatedHallwayZones.length === 0 || result.preservedManualHallwayIds[0] !== "hall-manual") {
  throw new Error("auto hallway must generate public space and preserve manual hallways");
}
if (result.generationMethod !== "grid_subtraction" || result.limitations.length === 0) {
  throw new Error("auto hallway output must include method and limitations");
}
throws(
  () => generateAutoHallways({ ...resultInput(), readOnly: true }),
  /read-only/
);

function resultInput() {
  return {
    layout: testEditableLayout,
    sourcePlanId: "editable-authoring-plan",
    readOnly: false,
    boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 100, heightFeet: 100 }
  };
}
