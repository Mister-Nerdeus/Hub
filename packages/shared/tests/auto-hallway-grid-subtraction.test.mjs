import { generateGridSubtractionHallways } from "../dist/index.js";
import { testEditableLayout } from "./authoring-test-helpers.mjs";

const layoutWithInteriorPublicSpace = {
  ...testEditableLayout,
  rooms: [
    { ...testEditableLayout.rooms[0], id: "room-left", xFeet: 0, yFeet: 0, widthFeet: 8, heightFeet: 8 },
    { ...testEditableLayout.rooms[0], id: "room-right", xFeet: 16, yFeet: 0, widthFeet: 8, heightFeet: 8 }
  ],
  doors: []
};

const result = generateGridSubtractionHallways({
  layout: layoutWithInteriorPublicSpace,
  sourcePlanId: "grid-proof",
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 24, heightFeet: 8 },
  gridCellSizeFeet: 4
});

if (result.generationMethod !== "grid_subtraction") {
  throw new Error("grid subtraction method must be explicit");
}
if (result.publicCellCount === 0 || result.occupiedCellCount === 0) {
  throw new Error("grid subtraction must separate occupied and public cells");
}
if (!result.generatedHallwayZones.some((hallway) => hallway.xFeet === 8 && hallway.widthFeet === 8)) {
  throw new Error("interior public space between rooms must be generated");
}
const deterministic = generateGridSubtractionHallways({
  layout: layoutWithInteriorPublicSpace,
  sourcePlanId: "grid-proof",
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 24, heightFeet: 8 },
  gridCellSizeFeet: 4
});
if (JSON.stringify(result) !== JSON.stringify(deterministic)) {
  throw new Error("same input must produce deterministic grid hallway output");
}

const small = generateGridSubtractionHallways({
  layout: testEditableLayout,
  sourcePlanId: "grid-proof",
  boundsFeet: { xFeet: 0, yFeet: 0, widthFeet: 2, heightFeet: 2 },
  gridCellSizeFeet: 4
});
if (!small.warnings.includes("BOUNDS_TOO_SMALL_FOR_GRID_SUBTRACTION")) {
  throw new Error("small bounds must return a warning");
}
