// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createFloorplanLibraryViewModel } from "../floorplanLibraryViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");
const viewModel = createFloorplanLibraryViewModel();

if (viewModel.floorplans.length !== 1) {
  throw new Error("main floorplan view model must expose exactly one canonical floorplan");
}
if (viewModel.floorplans[0]?.planId !== "default-er-layout-plan-1") {
  throw new Error("main floorplan view model must expose Plan 1");
}
for (const planId of ["default-er-layout-plan-2", "default-er-layout-plan-3", "default-er-layout-plan-4", "default-er-layout-plan-5"]) {
  if (JSON.stringify(viewModel.floorplans).includes(planId)) {
    throw new Error(`${planId} must not appear in the main floorplan cards`);
  }
}
if (!appSource.includes("CanonicalFloorplanHeader")) {
  throw new Error("main app must render the canonical floorplan header");
}
