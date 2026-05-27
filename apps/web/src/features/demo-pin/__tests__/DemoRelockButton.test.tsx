// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appShellSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/AppShell.tsx"), "utf8");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");

if (!appShellSource.includes("DemoRelockButton")) {
  throw new Error("AppShell must expose a workspace relock action after unlock");
}
if (!appSource.includes("clearDemoPinUnlock(getSessionStorage())")) {
  throw new Error("Relock must clear session unlock state");
}
