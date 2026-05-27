// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/layout-editor/DoorEditor.tsx"), "utf8");

for (const label of ["Wall", "Position", "Owner / Adjacent room", "Danger zone"]) {
  if (!source.includes(label)) throw new Error(`DoorEditor missing button group ${label}`);
}
if (!source.includes("centerDoorOnWall")) throw new Error("DoorEditor should use centerDoorOnWall helper");
if (!source.includes("validateDoorPlacementWarning")) throw new Error("DoorEditor should show validation warning");
