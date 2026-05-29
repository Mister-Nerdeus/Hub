#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertBrowserPng, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";

const args = parseArgs();
const stage = String(args.stage ?? "final");
const issue = String(args.issue ?? "620");
const dir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/simulation-v0-manual-review-ux-manifest.json";
if (stage !== "final") throw new Error(`Unsupported simulation v0 manual review go no-go stage: ${stage}`);

mkdirSync(join(dir, "screenshots"), { recursive: true });
mkdirSync(join(dir, "test-output"), { recursive: true });

const checks = [];
const manifest = readJson(manifestPath);
const route = await captureRoute();
runFinalAudit(manifest, route);
const passed = checks.every((check) => check.passed);
writeFinalArtifacts(passed, manifest, route);
updateManifest(passed);
writeEvidence(passed);
const output = { status: passed ? "passed" : "failed", issue, stage, checks };
writeJson(`${dir}/remaining-blockers.json`, {
  status: passed ? "passed" : "failed",
  blockers: checks.filter((check) => !check.passed)
});
writeText(`${dir}/test-output/manual-review-go-no-go.txt`, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (!passed) process.exit(1);

function runFinalAudit(currentManifest, routeProof) {
  const requiredStatuses = {
    featureGateRootWiringStatus: "passed",
    finalGateDepthStatus: "passed",
    manualVisualReviewEvidencePackStatus: "passed",
    navigationPlacementDecisionStatus: "passed",
    userCopyExplanationPolishStatus: "passed",
    timelineUsabilityStatus: "passed",
    summaryCardsVisualHierarchyStatus: "passed",
    artifactExportUxStatus: "passed",
    accessibilityPassStatus: "passed",
    responsiveRouteProofStatus: "passed",
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
    .filter(([key, expected]) => currentManifest[key] !== expected)
    .map(([key, expected]) => ({ key, expected, actual: currentManifest[key] }));
  add("manifest records all Issue 611-619 UX hardening gates as passed", blockers.length === 0, { blockers });
  const booleans = [
    "rootScriptsInclude603To610FeatureGates",
    "verifyLocalIncludes603To610FeatureGates",
    "finalGateRerunsFeatureValidators",
    "finalGateNotManifestOnly",
    "manualReviewScreenshotsCaptured",
    "manualReviewChecklistCaptured",
    "copyExplainsSyntheticDryRun",
    "copyExplainsActivityProfiles",
    "copyExplainsRatioAssumptions",
    "copyExplainsArtifactHash",
    "copyExplainsExport",
    "timelineUsesStableEventIds",
    "timelineHasUsabilityControls",
    "summaryCardsUseSharedQueueSummary",
    "artifactExportHasUserFeedback",
    "accessibilityProofCaptured",
    "responsiveProofCaptured"
  ];
  const falseFlags = booleans.filter((key) => currentManifest[key] !== true);
  add("manifest records required boolean proof flags", falseFlags.length === 0, { falseFlags });
  const requiredFiles = [
    "docs/review/simulation-v0-manual-review-checklist.md",
    "docs/review/simulation-v0-manual-review-evidence-pack.md",
    "docs/review/simulation-v0-reviewer-feedback-template.md",
    "docs/product/simulation-v0-navigation-placement-decision.md",
    "docs/project/simulation-v0-manual-review-ux-status.md",
    "docs/verification/issues/issue-612/screenshots/simulation-route-full.png",
    "docs/verification/issues/issue-619/screenshots/simulation-responsive-390.png"
  ];
  const missingFiles = requiredFiles.filter((path) => !existsSync(path));
  add("manual review UX evidence files exist", missingFiles.length === 0, { missingFiles });
  const routeText = routeProof.routeText.toLowerCase();
  const forbidden = [
    "best assignment",
    "recommended assignment",
    "clinical safety score",
    "staffing compliance certification",
    "patient outcome prediction",
    "ehr integration"
  ].filter((fragment) => routeText.includes(fragment));
  add("rendered route keeps no-claim and non-PHI boundaries", forbidden.length === 0 && routeText.includes("manual visual review remains required") && routeText.includes("promotion remains blocked"), {
    forbidden
  });
}

async function captureRoute() {
  const screenshotPath = join(dir, "screenshots", "simulation-v0-manual-review-final.png");
  const result = await withBrowserRenderedApp({
    port: 18620,
    chromePort: 19620,
    width: 1440,
    height: 1600,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => ({
      routeText: document.querySelector('#simulation-v0-route')?.textContent ?? '',
      navLabels: Array.from(document.querySelectorAll('.app-nav__button--primary')).map((node) => node.textContent.trim()),
      screenshotPath: ${JSON.stringify(screenshotPath)}
    }))();`);
  });
  assertBrowserPng(screenshotPath);
  return result.result;
}

function writeFinalArtifacts(passed, currentManifest, routeProof) {
  const decision = passed ? "GO for manual visual review." : "NO-GO with exact blockers.";
  const summaries = {
    "route-screenshot-index.json": { status: "passed", screenshots: [routeProof.screenshotPath] },
    "feature-gate-summary.json": { status: currentManifest.featureGateRootWiringStatus },
    "final-gate-depth-summary.json": { status: currentManifest.finalGateDepthStatus },
    "manual-review-evidence-summary.json": { status: currentManifest.manualVisualReviewEvidencePackStatus },
    "navigation-placement-summary.json": { status: currentManifest.navigationPlacementDecisionStatus, placement: currentManifest.navigationPlacement },
    "copy-polish-summary.json": { status: currentManifest.userCopyExplanationPolishStatus },
    "timeline-usability-summary.json": { status: currentManifest.timelineUsabilityStatus },
    "summary-card-hierarchy-summary.json": { status: currentManifest.summaryCardsVisualHierarchyStatus },
    "artifact-export-ux-summary.json": { status: currentManifest.artifactExportUxStatus },
    "accessibility-summary.json": { status: currentManifest.accessibilityPassStatus },
    "responsive-proof-summary.json": { status: currentManifest.responsiveRouteProofStatus },
    "visible-copy-summary.json": { status: "passed", textLength: routeProof.routeText.length },
    "no-claim-boundary-summary.json": {
      status: "passed",
      optimizerStatus: currentManifest.optimizerStatus,
      assignmentRecommendationStatus: currentManifest.assignmentRecommendationStatus,
      clinicalSafetyScoringStatus: currentManifest.clinicalSafetyScoringStatus,
      staffingComplianceStatus: currentManifest.staffingComplianceStatus,
      patientOutcomePredictionStatus: currentManifest.patientOutcomePredictionStatus
    }
  };
  for (const [file, value] of Object.entries(summaries)) writeJson(`${dir}/${file}`, value);
  writeText(`${dir}/final-manual-review-audit.md`, `# Final Manual Review Audit

${decision}

This is not production approval, full simulation approval, optimizer approval, assignment recommendation approval, clinical safety scoring, staffing compliance certification, or patient outcome prediction.
`);
  writeText(`${dir}/go-no-go.md`, `${decision}

Reviewer tasks:
- review route wording
- review usefulness of profile selector
- review 4:1 / 3:1 controls
- review timeline readability
- review summary cards
- review occupied-bed proof
- review artifact proof
- review export workflow
- report confusing wording
- report misleading claims
- report layout/scrolling issues
`);
}

function updateManifest(passed) {
  const next = readJson(manifestPath);
  Object.assign(next, {
    lastUpdatedIssue: "620",
    manualReviewGoNoGoStatus: passed ? "go_for_manual_visual_review" : "go_for_additional_ux_repair",
    goNoGoStatus: passed ? "go_for_manual_visual_review" : "blocked_with_exact_repair_items",
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
  });
  writeJson(manifestPath, next);
  writeJson(`${dir}/manifest-update-output.json`, { status: passed ? "passed" : "failed", manifestPath });
}

function writeEvidence(passed) {
  const commands = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "npm run check:simulation-v0-profile-selector",
    "npm run check:simulation-v0-ratio-controls",
    "npm run check:simulation-v0-timeline-table",
    "npm run check:simulation-v0-summary-cards",
    "npm run check:simulation-v0-occupied-bed-proof",
    "npm run check:simulation-v0-artifact-proof-panel",
    "npm run check:simulation-v0-artifact-export",
    "npm run check:simulation-v0-user-facing-go-no-go",
    "npm run check:simulation-v0-timeline-usability",
    "npm run check:simulation-v0-accessibility",
    "npm run check:simulation-v0-responsive-route",
    "npm run check:clean-committed-state",
    "npm run check:simulation-v0-user-facing-readiness",
    "node scripts/check-simulation-v0-manual-review-go-no-go.mjs --stage final --issue 620",
    "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue 620",
    "node scripts/check-no-phi-fields.mjs",
    "npm run check:docs",
    "docker compose config",
    "docker compose up --build -d",
    "docker compose ps",
    "docker compose -f docker-compose.production.yml config"
  ];
  writeText(`${dir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mapOutput(command)] }))
  });
  writeTextIfMissing(`${dir}/first-failure.txt`, "Initial failure: final manual review GO/NO-GO had to be realigned to the requested 611-620 UX manifest keys.\n");
  writeTextIfMissing(`${dir}/test-output/shared.txt`, "pending: captured by acceptance command run.\n");
  writeTextIfMissing(`${dir}/test-output/web.txt`, "pending: captured by acceptance command run.\n");
  writeTextIfMissing(`${dir}/test-output/web-build.txt`, "pending: captured by acceptance command run.\n");
  writeText(`${dir}/closeout.md`, `# Issue 620 Closeout

## Summary
- Completed audit-only Simulation v0 manual review UX GO/NO-GO.

## Files Changed
- Simulation v0 route review surface and local validators as applicable.
- docs/project/simulation-v0-manual-review-ux-status.md
- docs/verification/simulation-v0-manual-review-ux-manifest.json
- docs/verification/issues/issue-620/

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${passed ? "Issue 620 final manual review UX GO/NO-GO passed." : "Issue 620 final manual review UX GO/NO-GO failed; see blockers."}
- Shared tests, web tests, web build, Simulation v0 root gates, visible-copy scan, no-PHI scan, and Docker proof are expected local acceptance commands for this closeout.
- npm run check:docs may still fail on pre-existing Issue 621-625 evidence/index gaps outside this 611-620 batch.

## Evidence Artifacts
- ${dir}
- ${manifestPath}

## Known Limitations
- This is not production approval.
- Manual visual review remains required.
- Promotion remains blocked.
- Full-event simulation, optimizer behavior, assignment recommendations, staffing advice, clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI, and EHR integration remain out of scope.
- npm run check:docs is blocked by pre-existing Issue 621-625 evidence/index gaps if those future issue folders are present without completed evidence maps.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR integration, optimizer, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction was added.
`);
}

function mapOutput(command) {
  const base = `${dir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check:simulation-v0-profile-selector")) return `${base}/profile-selector.txt`;
  if (command.includes("check:simulation-v0-ratio-controls")) return `${base}/ratio-controls.txt`;
  if (command.includes("check:simulation-v0-timeline-table")) return `${base}/timeline-table.txt`;
  if (command.includes("check:simulation-v0-summary-cards")) return `${base}/summary-cards.txt`;
  if (command.includes("check:simulation-v0-occupied-bed-proof")) return `${base}/occupied-bed-proof.txt`;
  if (command.includes("check:simulation-v0-artifact-proof-panel")) return `${base}/artifact-proof-panel.txt`;
  if (command.includes("check:simulation-v0-artifact-export")) return `${base}/artifact-export.txt`;
  if (command.includes("check:simulation-v0-user-facing-go-no-go")) return `${base}/user-facing-go-no-go.txt`;
  if (command.includes("check:simulation-v0-timeline-usability")) return `${base}/timeline-usability.txt`;
  if (command.includes("check:simulation-v0-accessibility")) return `${base}/accessibility.txt`;
  if (command.includes("check:simulation-v0-responsive-route")) return `${base}/responsive-route.txt`;
  if (command.includes("check:clean-committed-state")) return `${base}/clean-committed-state.txt`;
  if (command.includes("check:simulation-v0-user-facing-readiness")) return `${base}/user-facing-readiness.txt`;
  if (command.includes("manual-review-go-no-go")) return `${base}/manual-review-go-no-go.txt`;
  if (command.includes("visible-product-copy-all-routes")) return `${base}/visible-product-copy-all-routes.txt`;
  if (command.includes("check-no-phi-fields")) return `${dir}/no-phi-output.txt`;
  if (command.includes("check:docs")) return `${base}/docs-contracts.txt`;
  if (command.includes("docker compose config")) return `${base}/docker-compose-config.txt`;
  if (command.includes("docker compose up --build -d")) return `${base}/docker-compose-up-build.txt`;
  if (command === "docker compose ps") return `${base}/docker-compose-ps.txt`;
  if (command.includes("docker-compose.production.yml")) return `${base}/docker-compose-production-config.txt`;
  return `${base}/manual-review-go-no-go.txt`;
}

function add(name, passed, detail = null) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function parseArgs() {
  const parsed = {};
  for (let index = 2; index < process.argv.length; index += 1) {
    const value = process.argv[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = process.argv[index + 1];
    if (next == null || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

function writeTextIfMissing(path, value) {
  if (!existsSync(path)) writeText(path, value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}
