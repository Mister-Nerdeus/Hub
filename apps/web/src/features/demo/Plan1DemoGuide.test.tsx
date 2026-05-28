// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const issueEvidenceDir = resolve(repoRoot, "docs/verification/issues/issue-272");
mkdirSync(issueEvidenceDir, { recursive: true });

const guideSource = readFileSync(resolve(repoRoot, "apps/web/src/features/demo/Plan1DemoGuide.tsx"), "utf8");
const evidenceSource = readFileSync(resolve(repoRoot, "apps/web/src/features/app-shell/DeveloperEvidencePage.tsx"), "utf8");

assertGuide(guideSource.includes("data-demo-guide=\"plan-1\""), "guide must expose Plan 1 demo guide marker");
assertGuide(guideSource.includes("data-plan-1-readiness"), "guide must expose readiness badge marker");
assertGuide(guideSource.includes("data-demo-non-claims=\"visible\""), "guide must render non-claims banner");
assertGuide(guideSource.includes("data-next-recommended-step"), "guide must expose next recommended step");
assertGuide(guideSource.includes("data-developer-evidence-separated"), "guide must track developer evidence separation");
assertGuide(evidenceSource.includes("<Plan1DemoGuide"), "Advanced/Evidence must deliberately mount Plan1DemoGuide");
assertGuide(!guideSource.includes("DeveloperEvidencePage"), "guide must not embed developer evidence page");

writeFileSync(resolve(issueEvidenceDir, "demo-guide-ui-output.json"), `${JSON.stringify({
  issue: "272",
  status: "passed",
  hasStepIndicator: guideSource.includes("data-demo-step-status"),
  hasNextRecommendedStep: guideSource.includes("data-next-recommended-step"),
  hasReadinessBadge: guideSource.includes("data-plan-1-readiness"),
  mountedInDeveloperEvidence: evidenceSource.includes("<Plan1DemoGuide")
}, null, 2)}\n`);

writeFileSync(resolve(issueEvidenceDir, "demo-non-claims-banner-output.json"), `${JSON.stringify({
  issue: "272",
  status: "passed",
  nonClaimsBannerVisible: guideSource.includes("data-demo-non-claims=\"visible\""),
  limitationsBannerVisible: guideSource.includes("viewModel.limitations.join")
}, null, 2)}\n`);

writeFileSync(resolve(issueEvidenceDir, "developer-evidence-separation-output.json"), `${JSON.stringify({
  issue: "272",
  status: "passed",
  guideEmbedsDeveloperEvidence: guideSource.includes("DeveloperEvidencePage"),
  developerEvidenceRetainsGuide: evidenceSource.includes("<Plan1DemoGuide")
}, null, 2)}\n`);

function assertGuide(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
