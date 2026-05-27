// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createLegacyFloorplanFixturesPanelViewModel } from "../legacyFloorplanFixturesViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");
const viewModelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/floorplans/legacyFloorplanFixturesViewModel.ts"), "utf8");
const viewModel = createLegacyFloorplanFixturesPanelViewModel();

if (!appSource.includes("<LegacyFloorplanFixturesPanel")) {
  throw new Error("legacy floorplan fixtures must be mounted under Advanced/Evidence");
}
if (viewModel.floorplans.length !== 4) {
  throw new Error("Plans 2-5 must remain available as legacy fixtures");
}
if (!viewModel.floorplans.every((floorplan) => floorplan.activeScenarioUseDisabled === true)) {
  throw new Error("legacy floorplans must not be usable as active scenario floorplans");
}
if (!viewModelSource.includes("Legacy fixture - not used for current scenario/ratio comparison workflow.")) {
  throw new Error("legacy fixtures must carry the current workflow exclusion label");
}
