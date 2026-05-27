import { buildStationShapeViewModel } from "../stationShapeViewModel";
import { buildLayoutObjectRenderPipeline } from "../layoutObjectRenderPipeline";
import { layoutEditorProofFixture } from "../../../fixtures/layout-editor/layoutEditorProofFixture";

const station = buildLayoutObjectRenderPipeline({
  layout: layoutEditorProofFixture,
  viewport: { pixelsPerFoot: 12, zoom: 1, panXFeet: 0, panYFeet: 0 }
}).find((item) => item.objectType === "station");

if (station == null) throw new Error("proof fixture should include station");
const viewModel = buildStationShapeViewModel(station);
if (!viewModel.presentationPath.startsWith("M ")) {
  throw new Error("station presentation shape should expose a curved path");
}
