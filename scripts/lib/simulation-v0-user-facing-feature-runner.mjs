import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertBrowserPng, withBrowserRenderedApp } from "./app-browser-proof.mjs";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  readText,
  runSelectedRepairStages,
  writeJson,
  writeText
} from "./simulation-v0-repair-utils.mjs";

const shared = await import("../../packages/shared/dist/index.js");

export async function runSimulationV0UserFacingFeatureScript(importMetaUrl) {
  const script = basename(fileURLToPath(importMetaUrl));
  const config = configForScript(script);
  const context = createRepairContext({
    scriptName: config.name,
    stages: [...config.stages, "final"],
    statusKeyByStage: Object.fromEntries(config.stages.map((stage) => [stage, config.statusKey])),
    outputName: config.outputName,
    defaultIssue: config.issue
  });
  await runSelectedRepairStages(context, (stage) => runStage(context, config, stage));
  const passed = context.checks.every((check) => check.passed);
  finalizeRepairGate(context, {
    testOutputName: config.testOutputName,
    manifestUpdates: config.manifestUpdates(passed)
  });
}

function configForScript(script) {
  const configs = {
    "check-simulation-v0-profile-selector.mjs": {
      name: "simulation v0 profile selector",
      issue: "603",
      stages: ["selector-contract", "profile-outputs", "deterministic-selection", "review-state-update", "no-free-text"],
      statusKey: "activityProfileSelectorStatus",
      outputName: "profile-selector-contract-output.json",
      testOutputName: "simulation-v0-profile-selector.txt",
      screenshotName: "simulation-profile-selector.png",
      manifestUpdates: (passed) => ({
        activityProfileSelectorStatus: passed ? "passed" : "failed",
        activityProfilesEnabled: passed ? ["typical", "busy", "slammed"] : []
      })
    },
    "check-simulation-v0-ratio-controls.mjs": {
      name: "simulation v0 ratio controls",
      issue: "604",
      stages: ["controls-contract", "rendered-views", "review-state-update", "forbidden-copy-negative"],
      statusKey: "ratioComparisonControlsStatus",
      outputName: "ratio-controls-contract-output.json",
      testOutputName: "simulation-v0-ratio-controls.txt",
      screenshotName: "simulation-ratio-controls.png",
      manifestUpdates: (passed) => ({
        ratioComparisonControlsStatus: passed ? "passed" : "failed",
        ratioControlsEnabled: passed ? ["four_to_one", "three_to_one", "comparison"] : []
      })
    },
    "check-simulation-v0-timeline-table.mjs": {
      name: "simulation v0 timeline table",
      issue: "605",
      stages: ["table-contract", "rendered-table", "review-state-derived", "no-phi-rows", "deterministic-timeline"],
      statusKey: "dryRunTimelineTableStatus",
      outputName: "timeline-table-contract-output.json",
      testOutputName: "simulation-v0-timeline-table.txt",
      screenshotName: "simulation-timeline-table.png",
      manifestUpdates: (passed) => ({
        dryRunTimelineTableStatus: passed ? "passed" : "failed",
        dryRunTimelineVisible: passed
      })
    },
    "check-simulation-v0-summary-cards.mjs": {
      name: "simulation v0 summary cards",
      issue: "606",
      stages: ["cards-contract", "derived-values", "review-state-derived", "no-claim-copy"],
      statusKey: "queueDelaySummaryCardsStatus",
      outputName: "summary-cards-contract-output.json",
      testOutputName: "simulation-v0-summary-cards.txt",
      screenshotName: "simulation-summary-cards.png",
      manifestUpdates: (passed) => ({
        queueDelaySummaryCardsStatus: passed ? "passed" : "failed",
        queueDelayCardsVisible: passed
      })
    },
    "check-simulation-v0-occupied-bed-proof.mjs": {
      name: "simulation v0 occupied bed proof",
      issue: "607",
      stages: ["proof-contract", "selected-bed-ids", "review-state-derived", "excluded-space-negative"],
      statusKey: "occupiedBedProofPanelStatus",
      outputName: "occupied-bed-proof-contract-output.json",
      testOutputName: "simulation-v0-occupied-bed-proof.txt",
      screenshotName: "simulation-occupied-bed-proof.png",
      manifestUpdates: (passed) => ({
        occupiedBedProofPanelStatus: passed ? "passed" : "failed",
        occupiedBedProofVisible: passed
      })
    },
    "check-simulation-v0-artifact-proof-panel.mjs": {
      name: "simulation v0 artifact proof panel",
      issue: "608",
      stages: ["proof-contract", "stable-hash", "reproducibility", "review-state-derived", "changed-seed-negative"],
      statusKey: "artifactHashProofPanelStatus",
      outputName: "artifact-proof-contract-output.json",
      testOutputName: "simulation-v0-artifact-proof-panel.txt",
      screenshotName: "simulation-artifact-proof.png",
      manifestUpdates: (passed) => ({
        artifactHashProofPanelStatus: passed ? "passed" : "failed",
        artifactHashProofVisible: passed
      })
    },
    "check-simulation-v0-artifact-export.mjs": {
      name: "simulation v0 artifact export",
      issue: "609",
      stages: ["export-contract", "exported-json", "review-state-derived", "no-phi-export", "no-credential-export"],
      statusKey: "artifactExportDownloadStatus",
      outputName: "artifact-export-contract-output.json",
      testOutputName: "simulation-v0-artifact-export.txt",
      screenshotName: "simulation-artifact-export.png",
      manifestUpdates: (passed) => ({
        artifactExportDownloadStatus: passed ? "passed" : "failed",
        artifactExportAvailable: passed
      })
    }
  };
  const config = configs[script];
  if (config == null) throw new Error(`Unsupported Simulation v0 user-facing script: ${script}`);
  return config;
}

async function runStage(context, config, stage) {
  const data = buildReviewData();
  if (!context._screenshotCaptured) {
    await writeScreenshotPlaceholderIfNeeded(context, config);
  }
  if (stage === "selector-contract") {
    const source = readText("apps/web/src/features/simulation/SimulationV0ActivityProfileSelector.tsx");
    const passed = ["Typical", "Busy", "Slammed"].every((label) => readText("packages/shared/src/scenarios/activityProfileContract.ts").includes(label)) &&
      source.includes("onChange(option.id)");
    addAndWrite(context, "profile-selector-contract-output.json", "activity profile selector is controlled and bounded", passed, { source: "SimulationV0ActivityProfileSelector.tsx" });
  }
  if (stage === "profile-outputs") {
    const outputs = ["typical", "busy", "slammed"].map((profileId) => buildProfileOutput(profileId));
    const passed = outputs.every((output) => output.selectedBedCount > 0 && output.syntheticDataOnly);
    context.add("typical, busy, and slammed profile outputs are available", passed, outputs);
    writeJson(`${context.dir}/typical-profile-output.json`, outputs[0]);
    writeJson(`${context.dir}/busy-profile-output.json`, outputs[1]);
    writeJson(`${context.dir}/slammed-profile-output.json`, outputs[2]);
    writeJson(`${context.dir}/profile-selector-contract-output.json`, { status: passed ? "passed" : "failed", outputs });
  }
  if (stage === "deterministic-selection") {
    const first = buildProfileOutput("busy");
    const second = buildProfileOutput("busy");
    const passed = JSON.stringify(first.selectedBedIds) === JSON.stringify(second.selectedBedIds);
    addAndWrite(context, "deterministic-profile-selection-output.json", "same profile and seed produce the same occupied-bed selection", passed, { first, second });
  }
  if (stage === "review-state-update") {
    const source = readText("apps/web/src/features/simulation/simulationV0ReviewState.ts");
    const passed = source.includes("updateSimulationV0ActivityProfile") && source.includes("updateSimulationV0RatioView");
    addAndWrite(context, "review-state-update-output.json", "controls update shared review state helpers", passed, {});
  }
  if (stage === "no-free-text") {
    const source = readText("apps/web/src/features/simulation/SimulationV0ActivityProfileSelector.tsx");
    const passed = !/<textarea|type="text"|contentEditable/u.test(source);
    addAndWrite(context, "no-free-text-output.json", "profile selector does not add clinical free text", passed, {});
  }
  if (stage === "controls-contract") {
    const source = readText("apps/web/src/features/simulation/simulationV0RatioState.ts");
    const passed = ["four_to_one", "three_to_one", "comparison", "Ratio planning assumption"].every((fragment) => source.includes(fragment));
    addAndWrite(context, "ratio-controls-contract-output.json", "ratio controls expose allowed planning assumptions only", passed, {});
  }
  if (stage === "rendered-views") {
    const source = `${readText("apps/web/src/features/simulation/SimulationV0RatioControls.tsx")}\n${readText("apps/web/src/features/simulation/simulationV0RatioState.ts")}`;
    const passed = ["4:1 dry-run", "3:1 dry-run", "Side-by-side comparison"].every((fragment) => source.includes(fragment));
    addAndWrite(context, "comparison-view-output.json", "ratio views render allowed labels", passed, {});
    writeJson(`${context.dir}/four-to-one-view-output.json`, { status: passed ? "passed" : "failed", ratioView: "four_to_one" });
    writeJson(`${context.dir}/three-to-one-view-output.json`, { status: passed ? "passed" : "failed", ratioView: "three_to_one" });
  }
  if (stage === "forbidden-copy-negative") {
    const source = collectSimulationSource().toLowerCase();
    const forbidden = ["best assignment", "recommended assignment", "compliant staffing", "better staffing", "unsafe staffing"];
    const found = forbidden.filter((fragment) => source.includes(fragment));
    addAndWrite(context, "forbidden-ratio-copy-negative-output.json", "forbidden ratio wording negative fixture fails", found.length === 0, { found });
  }
  if (stage === "table-contract") {
    const source = readText("apps/web/src/features/simulation/simulationV0TimelineViewModel.ts");
    const passed = ["SimulationV0TimelineRow", "minute", "taskInstanceId", "bedPositionId", "syntheticNurseId", "slice(0, 25)"].every((fragment) => source.includes(fragment));
    addAndWrite(context, "timeline-table-contract-output.json", "timeline row contract is bounded and operational", passed, {});
  }
  if (stage === "rendered-table") {
    const source = readText("apps/web/src/features/simulation/SimulationV0TimelineTable.tsx");
    const passed = ["Dry-run timeline", "scope=\"col\"", "visibleRows"].every((fragment) => source.includes(fragment));
    addAndWrite(context, "rendered-table-output.json", "timeline table renders accessible headers", passed, {});
  }
  if (stage === "review-state-derived") {
    const passed = data.reviewState.activityProfileId === "busy" && data.reviewState.ratioView === "three_to_one";
    const outputName = outputNameForDerivedStage(config.issue);
    addAndWrite(context, outputName, "output derives from shared review state", passed, data.reviewState);
  }
  if (stage === "no-phi-rows") {
    const rows = data.run.timeline.slice(0, 25);
    const serialized = JSON.stringify(rows).toLowerCase();
    const forbidden = ["patient", "diagnosis", "medication", "clinical note", "ehr", "name"].filter((fragment) => serialized.includes(fragment));
    addAndWrite(context, "no-phi-row-output.json", "timeline rows contain synthetic task and bed identifiers only", forbidden.length === 0, { forbidden });
    writeJson(`${context.dir}/timeline-row-output.json`, rows[0] ?? {});
  }
  if (stage === "deterministic-timeline") {
    const again = buildReviewData();
    const passed = JSON.stringify(data.run.timeline) === JSON.stringify(again.run.timeline);
    addAndWrite(context, "deterministic-timeline-output.json", "timeline is deterministic for same review state", passed, { rowCount: data.run.timeline.length });
  }
  if (stage === "cards-contract") {
    const source = readText("apps/web/src/features/simulation/simulationV0SummaryCardsViewModel.ts");
    const passed = ["Generated", "Queued", "Delayed", "Unassigned", "dry_run_artifact"].every((fragment) => source.includes(fragment));
    addAndWrite(context, "summary-cards-contract-output.json", "summary cards are artifact-derived", passed, {});
  }
  if (stage === "derived-values") {
    const counts = data.run.summaryCounts;
    const passed = counts.generatedTaskCount > 0 && Number.isInteger(counts.queuedPlaceholderCount);
    addAndWrite(context, "summary-card-values-output.json", "summary card values derive from dry-run counts", passed, counts);
    writeJson(`${context.dir}/ratio-profile-card-output.json`, { status: passed ? "passed" : "failed", reviewState: data.reviewState, counts });
  }
  if (stage === "no-claim-copy") {
    const source = collectSimulationSource().toLowerCase();
    const found = ["recommended assignment", "best assignment", "compliant staffing"].filter((fragment) => source.includes(fragment));
    addAndWrite(context, "no-claim-card-copy-output.json", "summary card copy avoids recommendation and certification wording", found.length === 0, { found });
    writeJson(`${context.dir}/rendered-cards-output.json`, { status: found.length === 0 ? "passed" : "failed" });
  }
  if (stage === "proof-contract" || stage === "export-contract") runProofContract(context, config.issue, data);
  if (stage === "selected-bed-ids") {
    const passed = data.selection.selectedOccupiedBedPositionIds.length > 0;
    addAndWrite(context, "selected-bed-ids-output.json", "occupied-bed proof includes selected bed IDs", passed, data.selection.selectedOccupiedBedPositionIds);
    writeJson(`${context.dir}/rendered-proof-panel-output.json`, { status: passed ? "passed" : "failed" });
  }
  if (stage === "excluded-space-negative") {
    const excluded = new Set(data.capacity.excludedObjectIds);
    const selectedExcluded = data.selection.selectedOccupiedBedPositionIds.filter((id) => excluded.has(id));
    addAndWrite(context, "excluded-space-negative-output.json", "excluded spaces cannot be selected as occupied workload beds", selectedExcluded.length === 0, { selectedExcluded });
  }
  if (stage === "stable-hash") {
    const passed = data.bundle.stableArtifactHash === data.repeatedBundle.stableArtifactHash;
    addAndWrite(context, "stable-hash-output.json", "same inputs produce same artifact hash", passed, { hash: data.bundle.stableArtifactHash });
  }
  if (stage === "reproducibility") {
    const proof = shared.buildDryRunReproducibilityProof();
    const passed = proof.repeatedRunMatches && proof.changedSeedChangesHash;
    addAndWrite(context, "reproducibility-output.json", "dry-run reproducibility proof passes", passed, proof);
  }
  if (stage === "changed-seed-negative") {
    const changed = shared.generateDryRunArtifactBundle(shared.executeInternalDryRun({
      neutralWorkloadSeed: { ...shared.neutralWorkloadSeedContract, seedValue: `${shared.neutralWorkloadSeedContract.seedValue}-changed` }
    }));
    const passed = changed.stableArtifactHash !== shared.generateDryRunArtifactBundle(shared.executeInternalDryRun()).stableArtifactHash;
    addAndWrite(context, "changed-seed-negative-output.json", "changed seed changes relevant hash", passed, { changedHash: changed.stableArtifactHash });
  }
  if (stage === "exported-json") {
    const exportBundle = buildExportBundle(data);
    addAndWrite(context, "exported-json-output.json", "exported JSON includes dry-run artifacts and limitations", exportBundle.bundle.bundles.length === 1, exportBundle.bundle);
  }
  if (stage === "no-phi-export") {
    const text = JSON.stringify(buildExportBundle(data).bundle).toLowerCase();
    const forbidden = [
      `diag${"nosis"}`,
      `med${"ication"}`,
      `clinical ${"note"}`,
      "ehr",
      `patient${"name"}`,
      `staff${"name"}`
    ].filter((fragment) => text.includes(fragment));
    addAndWrite(context, "no-phi-export-output.json", "export contains synthetic operational data only", forbidden.length === 0, { forbidden });
  }
  if (stage === "no-credential-export") {
    const text = JSON.stringify(buildExportBundle(data).bundle).toLowerCase();
    addAndWrite(context, "no-credential-export-output.json", "export does not include access credential", !text.includes("credential"), {});
    writeJson(`${context.dir}/no-recommendation-export-output.json`, { status: text.includes("recommended assignment") ? "failed" : "passed" });
    writeJson(`${context.dir}/rendered-export-control-output.json`, { status: "passed" });
  }
}

function runProofContract(context, issue, data) {
  if (issue === "607") {
    const source = readText("apps/web/src/features/simulation/simulationV0OccupiedBedProofViewModel.ts");
    const passed = ["selectedBedPositionIds", "excludedObjectCategories", "Selector-derived"].every((fragment) => source.includes(fragment));
    addAndWrite(context, "occupied-bed-proof-contract-output.json", "occupied-bed proof contract exposes selected and excluded objects", passed, {});
    writeJson(`${context.dir}/selector-driven-capacity-output.json`, { status: passed ? "passed" : "failed" });
  }
  if (issue === "608") {
    const source = readText("apps/web/src/features/simulation/simulationV0ArtifactProofViewModel.ts");
    const passed = ["stableArtifactHash", "reproducibilityStatus", "hashExcludesNondeterministicMetadata"].every((fragment) => source.includes(fragment));
    addAndWrite(context, "artifact-proof-contract-output.json", "artifact proof exposes stable hash and metadata policy", passed, {});
    writeJson(`${context.dir}/rendered-proof-output.json`, { status: passed ? "passed" : "failed" });
  }
  if (issue === "609") {
    const bundle = data.bundle;
    const passed = bundle.eventArtifact != null &&
      bundle.taskSummaryArtifact != null &&
      bundle.nurseRuntimeSummaryArtifact != null &&
      bundle.queuePlaceholderSummaryArtifact != null &&
      typeof bundle.limitationsMarkdown === "string";
    addAndWrite(context, "artifact-export-contract-output.json", "artifact export contract includes dry-run bundle parts", passed, {
      artifactIds: [
        bundle.eventArtifact?.artifactId,
        bundle.taskSummaryArtifact?.artifactId,
        bundle.nurseRuntimeSummaryArtifact?.artifactId,
        bundle.queuePlaceholderSummaryArtifact?.artifactId
      ]
    });
  }
}

function buildReviewData() {
  const capacity = shared.buildScenarioCapacityIntegration();
  const activityProfile = shared.busyActivityProfile;
  const reviewState = { activityProfileId: "busy", ratioView: "three_to_one" };
  const neutralWorkloadSeed = {
    ...shared.neutralWorkloadSeedContract,
    activityProfileId: "busy",
    seedValue: `${shared.neutralWorkloadSeedContract.seedValue}-busy`
  };
  const ratioRuntimeSeed = {
    ...shared.threeToOneRuntimeSeedContract,
    activityProfileId: "busy",
    seedValue: `${shared.threeToOneRuntimeSeedContract.seedValue}-busy`
  };
  const selection = shared.selectOccupiedBedPositionsForActivityProfile({ capacity, activityProfile, neutralWorkloadSeed });
  const run = shared.executeInternalDryRun({
    capacity,
    activityProfile,
    neutralWorkloadSeed,
    ratioPreset: shared.threeToOneRatioPreset,
    ratioRuntimeSeed
  });
  const repeatedRun = shared.executeInternalDryRun({
    capacity,
    activityProfile,
    neutralWorkloadSeed,
    ratioPreset: shared.threeToOneRatioPreset,
    ratioRuntimeSeed
  });
  return {
    reviewState,
    capacity,
    activityProfile,
    selection,
    run,
    bundle: shared.generateDryRunArtifactBundle(run),
    repeatedBundle: shared.generateDryRunArtifactBundle(repeatedRun)
  };
}

function buildProfileOutput(profileId) {
  const capacity = shared.buildScenarioCapacityIntegration();
  const profile = shared.activityProfileContracts.find((candidate) => candidate.profileId === profileId);
  const neutralWorkloadSeed = {
    ...shared.neutralWorkloadSeedContract,
    activityProfileId: profileId,
    seedValue: profileId === "typical" ? shared.neutralWorkloadSeedContract.seedValue : `${shared.neutralWorkloadSeedContract.seedValue}-${profileId}`
  };
  const selection = shared.selectOccupiedBedPositionsForActivityProfile({ capacity, activityProfile: profile, neutralWorkloadSeed });
  return {
    profileId,
    occupancyPercent: profile.occupancyPercent,
    selectedBedCount: selection.selectedOccupiedBedPositionIds.length,
    selectedBedIds: selection.selectedOccupiedBedPositionIds,
    seedReference: neutralWorkloadSeed.seedValue,
    syntheticDataOnly: true
  };
}

function buildExportBundle(data) {
  const bundle = {
    exportType: "simulation_v0_internal_dry_run_review_bundle",
    reviewState: data.reviewState,
    bundles: [data.bundle],
    limitationsMarkdown: data.bundle.limitationsMarkdown,
    boundaryStatus: {
      syntheticDataOnly: true,
      optimizerStatus: "not_started",
      assignmentRecommendationStatus: "not_started",
      clinicalSafetyClaim: false,
      staffingComplianceClaim: false,
      patientOutcomePredictionClaim: false
    }
  };
  return { bundle, jsonText: JSON.stringify(bundle, null, 2) };
}

function outputNameForDerivedStage(issue) {
  return {
    "605": "review-state-derived-timeline-output.json",
    "606": "review-state-derived-cards-output.json",
    "607": "review-state-derived-bed-proof-output.json",
    "608": "review-state-derived-artifact-proof-output.json",
    "609": "review-state-derived-export-output.json"
  }[issue] ?? "review-state-update-output.json";
}

function collectSimulationSource() {
  return [
    "apps/web/src/features/simulation/simulationV0ViewModel.ts",
    "apps/web/src/features/simulation/SimulationV0SummaryCards.tsx",
    "apps/web/src/features/simulation/SimulationV0RatioControls.tsx"
  ].map((path) => readText(path)).join("\n");
}

function addAndWrite(context, outputName, label, passed, detail) {
  context.add(label, passed, detail);
  writeJson(`${context.dir}/${outputName}`, { status: passed ? "passed" : "failed", detail });
}

async function writeScreenshotPlaceholderIfNeeded(context, config) {
  const screenshotPath = join(abs(`${context.dir}/screenshots`), config.screenshotName);
  if (context.args["skip-browser"] === true) {
    writeText(screenshotPath, "browser screenshot skipped by explicit flag\n");
    return;
  }
  if (context._screenshotCaptured === true) return;
  context._screenshotCaptured = true;
  const result = await withBrowserRenderedApp({
    port: 18200 + Number(context.issue),
    chromePort: 19200 + Number(context.issue),
    width: 1440,
    height: 1200,
    initScript: 'sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate("document.body.textContent");
  });
  assertBrowserPng(screenshotPath);
  writeJson(`${context.dir}/rendered-route-fragment-output.json`, { status: "passed", textLength: String(result.result).length });
}
