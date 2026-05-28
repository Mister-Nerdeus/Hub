// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");
const entrySource = readFileSync(
  resolve(repoRoot, "apps/web/src/features/demo-pin/WorkspaceAccessEntryScreen.tsx"),
  "utf8"
);

if (!entrySource.includes("demo-pin-entry-screen") || !entrySource.includes("productDisplayName")) {
  throw new Error("DemoPinEntryScreen must render standalone product landing copy");
}

if (!entrySource.includes("viewModel.caveat")) {
  throw new Error("DemoPinEntryScreen must carry centralized non-auth copy");
}

if (!/if \(!workspaceAccessState\.unlocked\)[\s\S]*<WorkspaceAccessEntryScreen/.test(appSource)) {
  throw new Error("App must return WorkspaceAccessEntryScreen before rendering AppShell while locked");
}

if (/<AppShell[\s\S]*<WorkspaceAccessEntryScreen/.test(appSource)) {
  throw new Error("WorkspaceAccessEntryScreen must not be nested inside AppShell");
}
