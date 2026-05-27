// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createFloorplanLibraryViewModel } from "../floorplanLibraryViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/floorplans/FloorplanLibrary.tsx"), "utf8");
const viewModel = createFloorplanLibraryViewModel();

if (!source.includes("Canonical ER Pod Floorplan") && !source.includes("viewModel.title")) {
  throw new Error("FloorplanLibrary must render the canonical product title");
}
if (source.includes("<dt>Defaults</dt>")) {
  throw new Error("FloorplanLibrary normal totals must not present Defaults: 5");
}
if (source.includes("<dt>Legacy refs</dt>")) {
  throw new Error("FloorplanLibrary normal totals must not advertise legacy references");
}
if (JSON.stringify(viewModel.floorplans).includes("default-er-layout-plan-2")) {
  throw new Error("FloorplanLibrary normal cards must not include legacy Plan 2");
}
if (viewModel.floorplans.length !== 1 || viewModel.floorplans[0]?.planId !== "default-er-layout-plan-1") {
  throw new Error("FloorplanLibrary view model must expose only the canonical default in product mode");
}
if (viewModel.totals.protectedLegacyDefaultPlanCount !== 4) {
  throw new Error("FloorplanLibrary view model must count protected legacy references separately");
}
if (!source.includes("DeleteSavedFloorplanDialog")) {
  throw new Error("FloorplanLibrary must route saved deletes through confirmation dialog");
}
