import { generateAutoPodBorder } from "../dist/index.js";
import { testEditableLayout, throws } from "./authoring-test-helpers.mjs";

const before = JSON.stringify(testEditableLayout.rooms);
const border = generateAutoPodBorder({
  layout: testEditableLayout,
  sourcePlanId: "editable-authoring-plan",
  paddingFeet: 4
});
if (border.generatedFromObjectIds.length === 0 || border.strokeStyle !== "generated_pod_border") {
  throw new Error("pod border must include generated object references and distinct style");
}
if (JSON.stringify(testEditableLayout.rooms) !== before) {
  throw new Error("pod border generation must not mutate room geometry");
}
throws(
  () =>
    generateAutoPodBorder({
      layout: { ...testEditableLayout, rooms: [], doors: [], stations: [], zones: [], hallways: [] },
      sourcePlanId: "empty",
      paddingFeet: 4
    }),
  /empty layout/
);
