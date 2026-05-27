import { buildHallwayArrowViewModels } from "../hallwayArrowViewModel";
import { buildLayoutObjectRenderPipeline } from "../layoutObjectRenderPipeline";
import { layoutEditorProofFixture } from "../../../fixtures/layout-editor/layoutEditorProofFixture";

const arrows = buildHallwayArrowViewModels(
  buildLayoutObjectRenderPipeline({
    layout: layoutEditorProofFixture,
    viewport: { pixelsPerFoot: 12, zoom: 1, panXFeet: 0, panYFeet: 0 }
  })
);

if (arrows.length === 0) throw new Error("presentation mode should derive hallway arrows");
if (arrows.some((arrow) => arrow.x1 === arrow.x2 && arrow.y1 === arrow.y2)) {
  throw new Error("hallway arrow should have visible direction");
}
