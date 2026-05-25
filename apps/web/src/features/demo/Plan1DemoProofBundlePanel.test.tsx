// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const issueEvidenceDir = resolve(repoRoot, "docs/verification/issues/issue-277");
mkdirSync(issueEvidenceDir, { recursive: true });

const panelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo/Plan1DemoProofBundlePanel.tsx"), "utf8");
const scenarioBuilderSource = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1ScenarioBuilder.tsx"), "utf8");
const sharedSource = readFileSync(resolve(repoRoot, "packages/shared/src/simulation/plan1DemoProofBundle.ts"), "utf8");

const requiredSections = [
  "demo-identity",
  "gate-status-summary",
  "plan-1-visual-parity-summary",
  "assignment-workflow-summary",
  "scenario-simulation-summary",
  "simulation-refinement-summary",
  "demo-seed-summary",
  "assumptions-summary",
  "warning-explanation-summary",
  "scenario-comparison-summary",
  "proof-report-summary",
  "evidence-artifact-references",
  "limitations",
  "non-claims"
];

assertBundle(panelSource.includes("data-demo-proof-bundle=\"plan-1\""), "proof bundle panel must expose Plan 1 marker");
assertBundle(panelSource.includes("data-demo-proof-bundle-section"), "proof bundle panel must expose section markers");
assertBundle(panelSource.includes("data-demo-proof-bundle-non-claims=\"visible\""), "proof bundle non-claims must be visible");
assertBundle(scenarioBuilderSource.includes("<Plan1DemoProofBundlePanel"), "scenario builder must mount proof bundle panel");
for (const sectionId of requiredSections) {
  assertBundle(sharedSource.includes(`"${sectionId}"`), `shared proof bundle must include ${sectionId}`);
}

writeFileSync(resolve(issueEvidenceDir, "demo-proof-bundle-ui-output.json"), `${JSON.stringify({
  issue: "277",
  status: "passed",
  mountedInScenarioBuilder: scenarioBuilderSource.includes("<Plan1DemoProofBundlePanel"),
  hasPanelMarker: panelSource.includes("data-demo-proof-bundle=\"plan-1\""),
  hasSectionMarkers: panelSource.includes("data-demo-proof-bundle-section"),
  nonClaimsVisible: panelSource.includes("data-demo-proof-bundle-non-claims=\"visible\""),
  requiredSections
}, null, 2)}\n`);

function assertBundle(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
