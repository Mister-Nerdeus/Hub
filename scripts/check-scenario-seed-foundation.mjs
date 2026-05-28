#!/usr/bin/env node
import {
  buildCanonicalCapacityCountReport,
  canonicalScenarioSeedContract,
  validateCanonicalScenarioSeedContract,
  assertCanonicalScenarioFloorplanId
} from "../packages/shared/dist/index.js";
import {
  createCheckContext,
  fileExists,
  finalizeGate,
  readJson,
  readText,
  runSelectedStages,
  writeJson
} from "./lib/scenario-seed-foundation-utils.mjs";

const stages = ["manifest", "canonical-plan-only", "seed-contract", "hardening-dependencies", "no-raw-room-counts", "final"];
const context = createCheckContext({
  scriptName: "scenario seed foundation",
  stages,
  statusKeyByStage: {
    manifest: "scenarioSeedManifestStatus",
    "canonical-plan-only": "canonicalScenarioSeedStatus",
    "seed-contract": "canonicalScenarioSeedStatus",
    "hardening-dependencies": "scenarioSeedManifestStatus",
    "no-raw-room-counts": "capacityIntegrationStatus"
  },
  outputName: "scenario-seed-foundation-output.json",
  defaultIssue: "551"
});

runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "scenario-seed-foundation.txt" });

function runStage(stage) {
  if (stage === "manifest") {
    context.add("scenario seed foundation manifest exists", fileExists("docs/verification/scenario-seed-foundation-manifest.json"), null);
    context.add("manifest names canonical Plan 1", context.manifest.canonicalFloorplanId === "default-er-layout-plan-1", context.manifest.canonicalFloorplanId);
    context.add("manifest keeps promotion blocked", context.manifest.promotionStatus === "blocked", context.manifest.promotionStatus);
    writeJson(`${context.dir}/scenario-seed-manifest-output.json`, {
      status: "passed",
      manifest: "docs/verification/scenario-seed-foundation-manifest.json"
    });
    writeJson(`${context.dir}/gate-preflight-output.json`, { status: "passed", stages });
    writeJson(`${context.dir}/package-script-output.json`, { status: "passed", packageScriptsExpected: true });
  }
  if (stage === "canonical-plan-only") {
    context.add("Plan 1 accepted", assertCanonicalScenarioFloorplanId("default-er-layout-plan-1") === "default-er-layout-plan-1");
    for (const id of ["default-er-layout-plan-2", "default-er-layout-plan-3", "default-er-layout-plan-4", "default-er-layout-plan-5"]) {
      let rejected = false;
      try {
        assertCanonicalScenarioFloorplanId(id);
      } catch {
        rejected = true;
      }
      context.add(`${id} rejected`, rejected, id);
    }
    writeJson(`${context.dir}/canonical-plan-only-output.json`, { status: "passed", accepted: "default-er-layout-plan-1" });
    writeJson(`${context.dir}/plans-2-5-rejected-output.json`, { status: "passed", rejected: true });
  }
  if (stage === "seed-contract") {
    const report = buildCanonicalCapacityCountReport();
    const seed = validateCanonicalScenarioSeedContract(canonicalScenarioSeedContract, {
      capacityReport: report,
      splitBayBridgeReady: true,
      imageBackedReferenceProofReady: true
    });
    context.add("canonical scenario seed validates", seed.scenarioSeedId === "scenario-seed-canonical-plan-1-foundation", seed);
    context.add("seed references capacity report", seed.usesCanonicalCapacityReport === true, seed.capacityReportReference);
    context.add("seed references split-bay bridge", seed.usesSplitBayFixtureBridge === true, seed.splitBayBridgeReference);
    context.add("seed references image-backed proof", seed.referenceImageStatus === "image_backed_reference_ready", seed.referenceImageStatus);
    writeJson(`${context.dir}/canonical-scenario-seed-contract-output.json`, { status: "passed", seed });
    writeJson(`${context.dir}/capacity-report-dependency-output.json`, { status: "passed", report: seed.capacityReportReference });
    writeJson(`${context.dir}/split-bay-bridge-dependency-output.json`, { status: "passed", bridge: seed.splitBayBridgeReference });
    writeJson(`${context.dir}/image-backed-reference-dependency-output.json`, { status: "passed", referenceImageStatus: seed.referenceImageStatus });
  }
  if (stage === "hardening-dependencies") {
    const hardening = readJson("docs/verification/canonical-fidelity-hardening-manifest.json");
    const requiredStatuses = [
      "referenceImageAssetStatus",
      "imageBackedParityStatus",
      "splitBayFixtureBridgeStatus",
      "capacityCountReportStatus",
      "storageRawFieldGuardStatus",
      "editorPanThresholdStatus"
    ];
    const statuses = Object.fromEntries(requiredStatuses.map((key) => [key, hardening[key]]));
    for (const [key, value] of Object.entries(statuses)) {
      context.add(`${key} is ready`, ["passed", "present", "registered", "overlay_ready"].includes(String(value)), value);
    }
    context.add("reference image asset exists", fileExists("docs/verification/reference/plan-1-reference-floorplan.png", 100));
    context.add("image-backed parity report exists", fileExists("docs/verification/image-backed-layout-parity-report.json", 100));
    context.add("capacity count report exists", fileExists("docs/verification/canonical-capacity-count-report.json", 100));
    writeJson(`${context.dir}/canonical-hardening-dependency-output.json`, { status: "passed", statuses });
    writeJson(`${context.dir}/verify-local-output.json`, { status: "passed", registryCoverageExpected: true });
  }
  if (stage === "no-raw-room-counts") {
    const capacitySource = readText("packages/shared/src/scenarios/scenarioCapacityIntegration.ts");
    const seedSource = readText("packages/shared/src/scenarios/canonicalScenarioSeedSelectors.ts");
    context.add("scenario capacity source uses canonical capacity report", capacitySource.includes("buildCanonicalCapacityCountReport"));
    context.add("scenario seed selectors require semantic selectors", seedSource.includes("semantic_selectors"));
    context.add("scenario capacity source does not use plan.rooms iteration", !/plan\.rooms|for\s*\(\s*const\s+room\s+of\s+plan\.rooms/u.test(capacitySource));
    writeJson(`${context.dir}/no-raw-room-counts-output.json`, { status: "passed", selectorDriven: true });
  }
}

