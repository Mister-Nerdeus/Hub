#!/usr/bin/env node
import { join } from "node:path";
import { assertBrowserPng, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  addAndWrite,
  createManualReviewUxContext,
  fileExists,
  finalizeManualReviewUxGate,
  readJson,
  readText,
  runSelectedManualReviewUxStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-manual-review-ux-utils.mjs";

const stages = ["final"];

const context = createManualReviewUxContext({
  scriptName: "simulation v0 manual review go no-go",
  stages,
  outputName: "remaining-blockers.json",
  defaultIssue: "620"
});

await runSelectedManualReviewUxStages(context, runStage);
await runFinalAudit();
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-manual-review-go-no-go.txt",
  manifestUpdates: {
    manualReviewGoNoGoStatus: passed ? "go_for_human_manual_visual_review" : "go_for_additional_ux_repair",
    humanReviewCompleted: false,
    goNoGoStatus: passed ? "go_for_human_manual_visual_review" : "not_ready"
  },
  closeoutStatus: passed ? "GO for human manual visual review. Human review is not complete." : "NO-GO with exact blockers."
});

async function runStage() {
  // The final audit is intentionally run once below so all summary files share the same snapshot.
}

async function runFinalAudit() {
  const manifest = readJson("docs/verification/simulation-v0-manual-review-ux-manifest.json");
  const requiredStatuses = {
    manualVisualReviewEvidenceStatus: "passed",
    simulationNavigationPlacementStatus: "passed",
    simulationCopyExplanationStatus: "passed",
    timelineUsabilityStatus: "passed",
    summaryCardsVisualHierarchyStatus: "passed",
    artifactExportUxStatus: "passed",
    finalGateRerunCoverageStatus: "passed",
    simulationAccessibilityStatus: "passed",
    simulationResponsiveProofStatus: "passed",
    simulationV0Status: "internal_dry_run_only",
    fullFutureSimulationEventModelStatus: "dormant",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    noPhiStatus: "passed"
  };
  const blockers = Object.entries(requiredStatuses)
    .filter(([key, expected]) => manifest[key] !== expected)
    .map(([key, expected]) => ({ key, expected, actual: manifest[key] }));
  const requiredFiles = [
    "docs/project/simulation-v0-manual-review-evidence-pack.md",
    "docs/project/simulation-v0-manual-review-checklist.md",
    "docs/project/simulation-v0-manual-review-scorecard.md",
    "docs/project/simulation-v0-navigation-placement.md",
    "docs/project/simulation-v0-manual-review-status.md",
    "docs/verification/issues/issue-611/screenshots/simulation-v0-manual-review-route.png",
    "docs/verification/issues/issue-618/screenshots/simulation-accessibility-proof.png",
    "docs/verification/issues/issue-619/screenshots/simulation-desktop.png",
    "docs/verification/issues/issue-619/screenshots/simulation-tablet.png",
    "docs/verification/issues/issue-619/screenshots/simulation-mobile.png"
  ];
  const missingFiles = requiredFiles.filter((path) => !fileExists(path));
  const scorecard = readText("docs/project/simulation-v0-manual-review-scorecard.md");
  const reviewerNameFilled = /^Reviewer name:\s+\S/mu.test(scorecard);
  const reviewDateFilled = /^Review date:\s+\S/mu.test(scorecard);
  const decisionMatch = scorecard.match(/^Decision:\s*(Pass|Needs repair|Blocked)\s*$/mu);
  const humanReviewCompleted = reviewerNameFilled && reviewDateFilled && decisionMatch != null;
  const route = await captureFinalRoute();
  const noClaimBoundary = {
    manualReviewRequired: route.routeText.includes("Manual visual review remains required"),
    promotionBlocked: route.routeText.includes("Promotion remains blocked"),
    noManualReviewPassedClaim: !route.routeText.includes("Manual review passed"),
    noPromotionReadyClaim: !route.routeText.includes("Promotion ready"),
    noProductionReadyClaim: !route.routeText.includes("Production ready")
  };
  const noClaimPassed = Object.values(noClaimBoundary).every(Boolean);
  const passed = blockers.length === 0 && missingFiles.length === 0 && !humanReviewCompleted && noClaimPassed;
  context.add("manual review final audit has no blockers and does not claim human completion", passed, {
    blockers,
    missingFiles,
    humanReviewCompleted,
    noClaimBoundary
  });
  writeFinalArtifacts({
    passed,
    blockers,
    missingFiles,
    manifest,
    humanReviewCompleted,
    route,
    noClaimBoundary
  });
}

async function captureFinalRoute() {
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-v0-manual-review-final.png");
  const result = await withBrowserRenderedApp({
    port: 18620,
    chromePort: 19620,
    width: 1440,
    height: 1400,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => ({
      routeText: document.querySelector('#simulation-v0-route')?.textContent ?? '',
      sectionTitles: Array.from(document.querySelectorAll('#simulation-v0-route h3, #simulation-v0-route legend')).map((node) => node.textContent.trim()),
      navLabels: Array.from(document.querySelectorAll('.app-nav__button--primary')).map((node) => node.textContent.trim()),
      screenshotPath: ${JSON.stringify(`${context.dir}/screenshots/simulation-v0-manual-review-final.png`)}
    }))();`);
  });
  assertBrowserPng(screenshotPath);
  return result.result;
}

function writeFinalArtifacts(input) {
  const decision = input.passed
    ? "GO for human manual visual review."
    : "NO-GO with exact blockers.";
  const summaries = {
    "route-screenshot-index.json": { status: "passed", screenshots: [input.route.screenshotPath] },
    "visual-review-checklist-summary.json": { status: input.manifest.manualReviewChecklistExists ? "passed" : "failed" },
    "scorecard-summary.json": { status: input.manifest.manualReviewScorecardExists ? "passed" : "failed", humanReviewCompleted: input.humanReviewCompleted },
    "navigation-summary.json": { status: input.manifest.simulationNavigationPlacementStatus, placement: input.manifest.simulationNavigationPlacement },
    "copy-summary.json": { status: input.manifest.simulationCopyExplanationStatus },
    "timeline-usability-summary.json": { status: input.manifest.timelineUsabilityStatus, enabled: input.manifest.timelinePaginationOrFilteringEnabled },
    "summary-card-hierarchy-summary.json": { status: input.manifest.summaryCardsVisualHierarchyStatus, improved: input.manifest.summaryCardsHierarchyImproved },
    "export-ux-summary.json": { status: input.manifest.artifactExportUxStatus, feedback: input.manifest.artifactExportHasStatusFeedback },
    "final-gate-coverage-summary.json": { status: input.manifest.finalGateRerunCoverageStatus, reruns: input.manifest.finalGateRerunsFeatureGates },
    "accessibility-summary.json": { status: input.manifest.simulationAccessibilityStatus, complete: input.manifest.accessibilityProofComplete },
    "responsive-proof-summary.json": { status: input.manifest.simulationResponsiveProofStatus, complete: input.manifest.responsiveProofComplete },
    "no-claim-boundary-summary.json": { status: Object.values(input.noClaimBoundary).every(Boolean) ? "passed" : "failed", ...input.noClaimBoundary },
    "remaining-blockers.json": { status: input.passed ? "passed" : "failed", blockers: input.blockers, missingFiles: input.missingFiles }
  };
  for (const [file, value] of Object.entries(summaries)) writeJson(`${context.dir}/${file}`, value);
  writeText(`${context.dir}/manual-review-final-audit.md`, `# Simulation v0 Manual Review Final Audit

${decision}

Human manual review completed: no.

Manual approval complete: no.

Promotion ready: no.
`);
  writeText(`${context.dir}/go-no-go.md`, `${decision}\n\nHuman manual review remains required. Promotion remains blocked.\n`);
  addAndWrite(context, "manual-review-go-no-go-output.json", "manual review GO/NO-GO decision written", input.passed, {
    decision,
    humanReviewCompleted: input.humanReviewCompleted
  });
}
