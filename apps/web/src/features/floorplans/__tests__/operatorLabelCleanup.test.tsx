// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const librarySource = readFileSync(resolve(repoRoot, "apps/web/src/features/floorplans/FloorplanLibrary.tsx"), "utf8");
const controlsSource = readFileSync(resolve(repoRoot, "apps/web/src/features/floorplans/DefaultPlanEditCopyControls.tsx"), "utf8");
const evidenceSource = readFileSync(resolve(repoRoot, "apps/web/src/features/floorplans/FloorplanEvidenceDetails.tsx"), "utf8");

for (const requiredLabel of ["Open Floorplan", "Floorplan source", "Validated default", "Mapping reference"]) {
  if (!librarySource.includes(requiredLabel)) {
    throw new Error(`main floorplan UI must include operator label: ${requiredLabel}`);
  }
}
if (!controlsSource.includes("Edit Working Copy")) {
  throw new Error("edit copy button must use operator label");
}
if (librarySource.includes("Open JSON") || controlsSource.includes("Duplicate/Edit Copy")) {
  throw new Error("developer/evidence labels must be removed from main operator buttons");
}
if (!librarySource.includes("FloorplanEvidenceDetails") || !evidenceSource.includes("Evidence details") || !evidenceSource.includes("Path nodes") || !evidenceSource.includes("Path edges")) {
  throw new Error("raw floorplan details must remain behind evidence disclosure");
}
