// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");
const landingSource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/floorplans/FloorplanLandingSummary.tsx"),
  "utf8"
);

if (!appSource.includes("setActiveSection(DEFAULT_APP_SECTION_ID)")) {
  throw new Error("unlock must route users to the active floorplan workflow section");
}
if (!appSource.includes("<ActiveFloorplanSelector")) {
  throw new Error("unlocked first view must use active floorplan selector");
}
if (!landingSource.includes("Canonical Plan 1 workflow")) {
  throw new Error("landing summary must foreground the Plan 1 workflow");
}
