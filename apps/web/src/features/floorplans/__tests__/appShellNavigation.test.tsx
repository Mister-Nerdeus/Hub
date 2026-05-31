// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const shell = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/AppShell.tsx"), "utf8");
const productShell = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/ProductWorkflowShell.tsx"), "utf8");
const nav = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/appNavigation.ts"), "utf8");

if (!productShell.includes("PRODUCT_DISPLAY_NAME")) throw new Error("app shell must use shared product identity");
if (shell.includes("Nerdeus ER Pod Shift Simulator")) throw new Error("app shell must not show old product name");
for (const phrase of ["data-full-page-workspace-shell", "data-outer-margin-max-px", "ProductWorkflowStepper"]) {
  if (!productShell.includes(phrase)) throw new Error(`app shell missing ${phrase}`);
}
for (const label of ["Floorplan", "Assignments", "Scenario", "Simulation", "Report", "Advanced/Evidence"]) {
  if (!nav.includes(label)) throw new Error(`navigation missing ${label}`);
}
if (nav.includes('label: "Floorplans"')) throw new Error("navigation must use singular floorplan copy");
