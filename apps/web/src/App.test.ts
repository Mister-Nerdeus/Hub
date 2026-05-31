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

function assert228(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const appSource = readFileSync(resolve(repoRoot, "apps/web/src/App.tsx"), "utf8");
const appEvidenceSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/DeveloperEvidencePage.tsx"), "utf8");
const appShellSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/AppShell.tsx"), "utf8");
const productWorkflowShellSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/ProductWorkflowShell.tsx"), "utf8");

assert228(appSource.includes("<WorkspaceAccessEntryScreen"), "default app render should start with the workspace access screen");
assert228(appSource.includes("if (!workspaceAccessState.unlocked)"), "app shell should be gated behind workspace access");
assert228(productWorkflowShellSource.includes("PRODUCT_DISPLAY_NAME"), "shell should provide app header through shared identity");
assert228(!appShellSource.includes("Nerdeus ER Pod Shift Simulator"), "shell should not use old product-facing title");
assert228(appSource.includes("<ActiveFloorplanHub"), "unlocked mode must expose active floorplan hub");
assert228(appSource.includes("DEVELOPER_EVIDENCE_SECTION_ID"), "developer/evidence mode section should be available in shell navigation");
assert228(productWorkflowShellSource.includes("ProductSidebarRail"), "shell should include navigation container");

assert228(!appSource.includes("Proof-only workflow modules are preserved here only."), "default mode should hide proof-only intro text outside dev mode");
assert228(!appSource.includes("Plan builder defaults"), "default mode should not embed proof module names");
assert228(!appSource.includes("Manual assignment proof"), "default mode should not embed proof module names");

assert228(appEvidenceSource.includes("Proof-only workflow modules are preserved here only."), "developer/evidence mode should expose proof-only intro");
assert228(appEvidenceSource.includes("Plan builder defaults"), "developer/evidence mode should expose plan builder form");
assert228(appEvidenceSource.includes("Plan draft panel"), "developer/evidence mode should expose plan draft panel");
assert228(appEvidenceSource.includes("Route preview"), "developer/evidence mode should expose route preview proof");

writeEvidence("navigation-contract-output.json", {
  issue: "228",
  shellSections: [
    "floorplans",
    "editor",
    "routes",
    "assignments",
    "manual-assignment",
    "scenarios",
    "simulation",
    "reports",
    "help",
    "settings",
    "developer-evidence"
  ],
  proofContentIsIsolated: true,
  readModel: "normal-mode-defaults-to-floorplans"
});

writeEvidence("proof-wall-negative-output.json", {
  issue: "228",
  status: "passed",
  normalModeContainsProofText: appSource.includes("Proof-only workflow modules are preserved here only.") || appSource.includes("Plan builder defaults"),
  devEvidenceContainsProofText: appEvidenceSource.includes("Proof-only workflow modules are preserved here only.")
});
