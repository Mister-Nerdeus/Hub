// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";
import { createPlan1DemoWorkflowViewModel } from "./plan1DemoWorkflowViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const issueEvidenceDir = resolve(repoRoot, "docs/verification/issues/issue-272");
mkdirSync(issueEvidenceDir, { recursive: true });

const initial = createPlan1DemoWorkflowViewModel({
  activeSection: "floorplans",
  activePlanId: null
});
const scenarios = createPlan1DemoWorkflowViewModel({
  activeSection: "scenarios",
  activePlanId: "default-er-layout-plan-1"
});

assertDemo(initial.steps.length === 7, "demo guide must cover seven required steps");
assertDemo(initial.readinessBadge.status === "needs-plan-1", "guide must require repaired Plan 1 first");
assertDemo(scenarios.readinessBadge.status === "ready", "guide must show ready badge for active Plan 1");
assertDemo(scenarios.steps.some((step) => step.stepId === "review-proof-report"), "guide must include proof report step");
assertDemo(scenarios.nonClaims.some((claim) => claim.includes("Not a clinical safety score")), "non-claims must be visible");
assertDemo(scenarios.developerEvidenceSeparated === true, "developer evidence must remain separate");

writeFileSync(resolve(issueEvidenceDir, "demo-workflow-view-model-output.json"), `${JSON.stringify({
  issue: "272",
  status: "passed",
  stepIds: scenarios.steps.map((step) => step.stepId),
  readinessBadge: scenarios.readinessBadge,
  nextRecommendedStep: scenarios.nextRecommendedStep.stepId,
  nonClaimsVisible: scenarios.nonClaims.length > 0,
  developerEvidenceSeparated: scenarios.developerEvidenceSeparated
}, null, 2)}\n`);

writeFileSync(resolve(issueEvidenceDir, "demo-step-coverage-output.json"), `${JSON.stringify({
  issue: "272",
  status: "passed",
  coveredSteps: scenarios.steps.map((step) => step.label),
  requiredStepCount: 7
}, null, 2)}\n`);

function assertDemo(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
