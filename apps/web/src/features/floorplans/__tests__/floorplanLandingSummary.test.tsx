// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const summary = readFileSync(resolve(repoRoot, "apps/web/src/features/floorplans/FloorplanLandingSummary.tsx"), "utf8");
const app = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

for (const text of ["Current floorplan", "Open Editor", "Proceed to Manual Assignment", "Floorplan Library"]) {
  assert(summary.includes(text), `landing summary missing ${text}`);
}

assert(summary.includes("Manual review required"), "landing summary must keep manual review visible");
assert(summary.includes("Promotion blocked"), "landing summary must keep promotion block visible");
assert(app.includes("floorplan-demo-proof"), "demo/proof content should be collapsed behind details");
assert(app.includes("FloorplanLandingSummary"), "floorplan page should use simplified landing summary");
