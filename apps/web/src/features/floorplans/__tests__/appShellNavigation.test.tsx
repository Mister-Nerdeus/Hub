// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const shell = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/ProductWorkflowShell.tsx"), "utf8");
const nav = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/appNavigation.ts"), "utf8");
const developerEvidence = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/DeveloperEvidencePage.tsx"), "utf8");

if (!shell.includes("PRODUCT_DISPLAY_NAME")) throw new Error("app shell must use shared product identity");
if (shell.includes("Nerdeus ER Pod Shift Simulator")) throw new Error("app shell must not show old product name");
for (const phrase of ["Shift workflow", "Operational floorplan and assignment setup"]) {
  if (!shell.includes(phrase)) throw new Error(`app shell missing ${phrase}`);
}
if (shell.includes("Runtime evidence")) throw new Error("runtime evidence must not be visible in the normal app shell");
if (!developerEvidence.includes("Runtime evidence")) throw new Error("runtime evidence must live in Developer/Evidence");
for (const label of ["Floorplan", "Assignments", "Scenarios", "Simulation", "Reports", "Help", "Advanced/Evidence"]) {
  if (!nav.includes(label)) throw new Error(`navigation missing ${label}`);
}
if (nav.includes('label: "Floorplans"')) throw new Error("navigation must use singular floorplan copy");
