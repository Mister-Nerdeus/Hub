// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const stateSource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/floorplans/activeFloorplanState.ts"),
  "utf8"
);

if (!stateSource.includes("Cannot open legacy default floorplan as active workflow floorplan")) {
  throw new Error("legacy default plans must not become active workflow floorplans");
}
if (!stateSource.includes("Cannot open saved copy from non-canonical floorplan")) {
  throw new Error("saved copies from Plans 2-5 must not become active workflow floorplans");
}
