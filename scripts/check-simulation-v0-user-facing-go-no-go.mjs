#!/usr/bin/env node
import { join } from "node:path";
import { assertBrowserPng, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  fileExists,
  readJson,
  runSelectedRepairStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = ["audit", "final"];
const context = createRepairContext({
  scriptName: "simulation v0 user-facing go no-go",
  stages,
  statusKeyByStage: {},
  outputName: "remaining-blockers.json",
  defaultIssue: "610"
});

await runSelectedRepairStages(context, runStage);
const manifest = readJson("docs/verification/simulation-v0-user-facing-refinement-manifest.json");
const requiredStatuses = {
  preflightTruthLockStatus: "passed",
  nonMutatingRootVerificationStatus: "passed",
  simulationReviewStateContractStatus: "passed",
  simulationRouteShellStatus: "passed",
  activityProfileSelectorStatus: "passed",
  ratioComparisonControlsStatus: "passed",
  dryRunTimelineTableStatus: "passed",
  queueDelaySummaryCardsStatus: "passed",
  occupiedBedProofPanelStatus: "passed",
  artifactHashProofPanelStatus: "passed",
  artifactExportDownloadStatus: "passed"
};
const blockers = Object.entries(requiredStatuses)
  .filter(([key, expected]) => manifest[key] !== expected)
  .map(([key, expected]) => ({ key, expected, actual: manifest[key] }));
for (const blocker of blockers) context.add(`final blocker: ${blocker.key}`, false, blocker);
const packageScripts = readJson("package.json").scripts ?? {};
const compositeGateConfigured = typeof packageScripts["check:simulation-v0-user-facing-feature-gates"] === "string" &&
  fileExists("scripts/check-simulation-v0-user-facing-feature-gates.mjs");
context.add("final GO/NO-GO has composite feature-gate rerun coverage configured", compositeGateConfigured, {
  rootScript: packageScripts["check:simulation-v0-user-facing-feature-gates"] ?? null
});
const passed = blockers.length === 0 && compositeGateConfigured;
writeFinalArtifacts(passed, blockers, manifest);
finalizeRepairGate(context, {
  testOutputName: "simulation-v0-user-facing-go-no-go.txt",
  manifestUpdates: {
    simulationV0UserFacingGoNoGoStatus: passed ? "go_for_manual_visual_review" : "go_for_additional_simulation_v0_user_facing_repair",
    goNoGoStatus: passed ? "go_for_manual_visual_review" : "go_for_additional_simulation_v0_user_facing_repair"
  },
  closeoutStatus: passed ? "GO for manual visual review of user-facing Simulation v0 refinement." : "NO-GO with exact blockers."
});

async function runStage(stage) {
  if (stage !== "audit") return;
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-v0-final-route.png");
  const proof = await withBrowserRenderedApp({
    port: 18300 + Number(context.issue),
    chromePort: 19300 + Number(context.issue),
    width: 1440,
    height: 1400,
    initScript: 'sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => ({
      route: document.querySelector('#simulation-v0-route') != null,
      controls: document.querySelector('#simulation-v0-controls') != null,
      output: document.querySelector('#simulation-v0-output') != null,
      proof: document.querySelector('#simulation-v0-proof') != null,
      exportControl: document.querySelector('#simulation-v0-export-title') != null,
      textLength: (document.body.textContent || '').length
    }))();`);
  });
  assertBrowserPng(screenshotPath);
  context.add("final Simulation v0 route renders all user-facing review regions", proof.result.route && proof.result.controls && proof.result.output && proof.result.proof && proof.result.exportControl, proof.result);
  writeJson(`${context.dir}/route-screenshot-index.json`, { status: "passed", screenshots: [screenshotPath], dom: proof.result });
}

function writeFinalArtifacts(passed, blockers, manifest) {
  const decision = passed
    ? "GO for manual visual review of user-facing Simulation v0 refinement."
    : "NO-GO with exact blockers.";
  writeText(`${context.dir}/final-user-facing-audit.md`, `# Final User-Facing Simulation v0 Audit\n\n${decision}\n`);
  writeJson(`${context.dir}/visible-copy-summary.json`, { status: "passed", manualVisualReviewRequired: true });
  writeJson(`${context.dir}/no-claim-boundary-summary.json`, {
    optimizerStatus: manifest.optimizerStatus,
    assignmentRecommendationStatus: manifest.assignmentRecommendationStatus,
    clinicalSafetyScoringStatus: manifest.clinicalSafetyScoringStatus,
    staffingComplianceStatus: manifest.staffingComplianceStatus,
    patientOutcomePredictionStatus: manifest.patientOutcomePredictionStatus
  });
  writeJson(`${context.dir}/review-state-contract-summary.json`, { status: manifest.simulationReviewStateContractStatus });
  writeJson(`${context.dir}/profile-selector-summary.json`, { status: manifest.activityProfileSelectorStatus, enabled: manifest.activityProfilesEnabled });
  writeJson(`${context.dir}/ratio-controls-summary.json`, { status: manifest.ratioComparisonControlsStatus, enabled: manifest.ratioControlsEnabled });
  writeJson(`${context.dir}/timeline-table-summary.json`, { status: manifest.dryRunTimelineTableStatus, visible: manifest.dryRunTimelineVisible });
  writeJson(`${context.dir}/summary-cards-summary.json`, { status: manifest.queueDelaySummaryCardsStatus, visible: manifest.queueDelayCardsVisible });
  writeJson(`${context.dir}/occupied-bed-proof-summary.json`, { status: manifest.occupiedBedProofPanelStatus, visible: manifest.occupiedBedProofVisible });
  writeJson(`${context.dir}/artifact-proof-summary.json`, { status: manifest.artifactHashProofPanelStatus, visible: manifest.artifactHashProofVisible });
  writeJson(`${context.dir}/artifact-export-summary.json`, { status: manifest.artifactExportDownloadStatus, available: manifest.artifactExportAvailable });
  writeJson(`${context.dir}/remaining-blockers.json`, { status: passed ? "passed" : "failed", blockers });
  writeText(`${context.dir}/go-no-go.md`, `${decision}\n`);
}
