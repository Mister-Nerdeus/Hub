import { buildFloorplanAuthoringRouteMatrix } from "../dist/index.js";

const matrix = buildFloorplanAuthoringRouteMatrix("279");
if (matrix.length !== 8) {
  throw new Error("authoring route matrix must cover all required screens");
}
for (const entry of matrix) {
  if (!entry.privateSourceExposureForbidden || !entry.screenshotRequired || entry.status !== "covered") {
    throw new Error(`authoring route matrix entry incomplete: ${entry.screenId}`);
  }
}
