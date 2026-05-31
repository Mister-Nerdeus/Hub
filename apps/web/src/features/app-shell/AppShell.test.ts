// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const issueEvidenceDir = resolve(repoRoot, "docs/verification/issues/issue-228");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(issueEvidenceDir, { recursive: true });
  writeFileSync(resolve(issueEvidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function assert228Shell(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const appShellSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/AppShell.tsx"), "utf8");
const appNavigationSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/appNavigation.ts"), "utf8");
const productShellSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/ProductWorkflowShell.tsx"), "utf8");
const productSidebarSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/ProductSidebar.tsx"), "utf8");

assert228Shell(productShellSource.includes("app-shell"), "app shell wrapper should render");
assert228Shell(productShellSource.includes("workflow-content"), "app shell should define workflow content container");
assert228Shell(appNavigationSource.includes("Advanced/Evidence"), "advanced/evidence section label should be in navigation model");
assert228Shell(productSidebarSource.includes("app-nav__button"), "app shell should expose navigation button classes");
assert228Shell(!appShellSource.includes("Plan builder defaults"), "app shell markup should not include proof module names");
assert228Shell(appShellSource.includes("AppShellProps"), "app shell file should define shell props contract");

writeEvidence("app-shell-output.json", {
  issue: "228",
  status: "passed",
  appShellContainsNavigation: productSidebarSource.includes("app-nav"),
  developerEvidenceVisibleInNav: appNavigationSource.includes("developer-evidence"),
  hasWorkflowContainer: productShellSource.includes("workflow-content"),
  proofModuleTextHidden: !appShellSource.includes("Plan builder defaults")
});
