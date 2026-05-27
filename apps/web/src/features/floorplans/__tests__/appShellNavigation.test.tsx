// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const shell = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/AppShell.tsx"), "utf8");
const nav = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/appNavigation.ts"), "utf8");

if (!shell.includes("PRODUCT_DISPLAY_NAME")) throw new Error("app shell must use shared product identity");
if (shell.includes("Nerdeus ER Pod Shift Simulator")) throw new Error("app shell must not show old product name");
for (const phrase of ["Manual review required", "Promotion blocked", "Synthetic operational modeling only"]) {
  if (!shell.includes(phrase)) throw new Error(`app shell missing ${phrase}`);
}
for (const label of ["Floorplans", "Review Candidates", "Editor", "Review / Reports", "Developer/Evidence"]) {
  if (!nav.includes(label)) throw new Error(`navigation missing ${label}`);
}
