// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createLegacyFloorplanFixturesPanelViewModel } from "../legacyFloorplanFixturesViewModel";
import { createPlanBuilderLibraryViewModel } from "../planBuilderLibraryViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");
const viewModelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/floorplans/legacyFloorplanFixturesViewModel.ts"), "utf8");
const viewModel = createLegacyFloorplanFixturesPanelViewModel();
const planBuilderLibrary = createPlanBuilderLibraryViewModel();
const defaultFixtureItems = planBuilderLibrary.sections.find((section) => section.id === "default-fixtures")?.items ?? [];
const legacyDefaultItems = defaultFixtureItems.filter((item) => item.planId !== "default-er-layout-plan-1");
const legacyEvidenceItems = planBuilderLibrary.sections
  .flatMap((section) => section.items)
  .filter((item) => item.planId !== "default-er-layout-plan-1");

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
if (legacyDefaultItems.length !== 4) {
  throw new Error("Plans 2-5 must remain visible as Advanced/Evidence legacy default fixtures");
}
if (legacyDefaultItems.some((item) => item.actions.some((action) => action.kind === "open-plan"))) {
  throw new Error("Plans 2-5 must not expose an active floorplan action from Advanced/Evidence");
}
if (legacyEvidenceItems.some((item) => item.actions.some((action) => action.kind === "open-plan" || action.kind === "open-saved-copy"))) {
  throw new Error("Plan 2-5 review evidence must not expose an active floorplan action");
}
if (!legacyEvidenceItems.every((item) => item.activeScenarioUseDisabled === true || item.categoryId === "manual-review-packets")) {
  throw new Error("Plans 2-5 must carry active scenario disabled state in every Advanced/Evidence library");
}
