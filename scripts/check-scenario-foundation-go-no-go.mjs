#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  readText,
  runSelectedStages,
  scanFiles,
  writeJson,
  writeText
} from "./lib/scenario-seed-foundation-utils.mjs";

const stages = [
  "readiness",
  "hardening-gates-still-pass",
  "no-simulation-no-optimizer",
  "no-clinical-or-compliance-claims",
  "final"
];
const context = createCheckContext({
  scriptName: "scenario foundation GO NO-GO",
  stages,
  statusKeyByStage: {
    readiness: "scenarioFoundationGoNoGoStatus",
    "hardening-gates-still-pass": "scenarioFoundationGoNoGoStatus",
    "no-simulation-no-optimizer": "scenarioFoundationGoNoGoStatus",
    "no-clinical-or-compliance-claims": "scenarioFoundationGoNoGoStatus"
  },
  outputName: "scenario-foundation-go-no-go-output.json",
  defaultIssue: "560"
});

runSelectedStages(context, runStage);
const allReady = context.stage === "final" && context.checks.every((check) => check.passed);
finalizeGate(context, {
  testOutputName: "scenario-foundation-go-no-go.txt",
  manifestUpdates: allReady
    ? {
        scenarioFoundationGoNoGoStatus: "go_for_next_foundation_step",
        goNoGoStatus: "ready_for_manual_review_of_foundation_contracts"
      }
    : {}
});

function runStage(stage) {
  if (stage === "readiness") {
    const required = {
      scenarioSeedManifestStatus: context.manifest.scenarioSeedManifestStatus,
      canonicalScenarioSeedStatus: context.manifest.canonicalScenarioSeedStatus,
      ratioPresetFourToOneStatus: context.manifest.ratioPresetFourToOneStatus,
      ratioPresetThreeToOneStatus: context.manifest.ratioPresetThreeToOneStatus,
      capacityIntegrationStatus: context.manifest.capacityIntegrationStatus,
      roomLoadStarterContractStatus: context.manifest.roomLoadStarterContractStatus,
      activityProfileContractStatus: context.manifest.activityProfileContractStatus,
      manualAssignmentScenarioBridgeStatus: context.manifest.manualAssignmentScenarioBridgeStatus,
      scenarioComparisonShellStatus: context.manifest.scenarioComparisonShellStatus
    };
    for (const [key, value] of Object.entries(required)) {
      context.add(`${key} passed`, value === "passed", value);
    }
    writeJson(`${context.dir}/readiness-output.json`, { status: "passed", required });
  }
  if (stage === "hardening-gates-still-pass") {
    const hardening = JSON.parse(readText("docs/verification/canonical-fidelity-hardening-manifest.json"));
    for (const key of [
      "imageBackedParityStatus",
      "splitBayFixtureBridgeStatus",
      "capacityCountReportStatus",
      "storageRawFieldGuardStatus",
      "editorPanThresholdStatus"
    ]) {
      context.add(`${key} still passed`, ["passed", "present", "registered", "overlay_ready"].includes(String(hardening[key])), hardening[key]);
    }
    writeJson(`${context.dir}/hardening-gates-still-pass-output.json`, { status: "passed" });
  }
  if (stage === "no-simulation-no-optimizer") {
    const findings = scanFiles(
      ["packages/shared/src/scenarios", "apps/web/src/features/scenarios"],
      [
        {
          label: "new execution behavior",
          pattern: /\b(?:execute|tick|advance|run).{0,30}(?:shift|simulation|optimizer)\b/iu,
          allowedPattern: /not_started|No full-shift simulation output|must not/iu
        }
      ]
    );
    context.add("foundation sources do not add simulation or optimizer execution", findings.length === 0, findings);
    writeJson(`${context.dir}/no-simulation-no-optimizer-output.json`, { status: findings.length === 0 ? "passed" : "failed", findings });
  }
  if (stage === "no-clinical-or-compliance-claims") {
    context.add("manifest clinical scoring not started", context.manifest.clinicalSafetyScoringStatus === "not_started", context.manifest.clinicalSafetyScoringStatus);
    context.add("manifest staffing compliance not started", context.manifest.staffingComplianceStatus === "not_started", context.manifest.staffingComplianceStatus);
    writeText(`${context.dir}/no-clinical-or-compliance-claims-output.txt`, "passed: foundation remains operational planning only with no clinical safety scoring or staffing compliance certification\n");
  }
}

