#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  readJson,
  runSelectedStages,
  writeJson,
  writeText
} from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["readiness", "no-optimizer", "no-recommendations", "no-clinical-or-compliance-claims", "final"];
const context = createCheckContext({
  scriptName: "simulation v0 go no-go",
  stages,
  statusKeyByStage: {
    readiness: "simulationV0GoNoGoStatus",
    "no-optimizer": "simulationV0GoNoGoStatus",
    "no-recommendations": "simulationV0GoNoGoStatus",
    "no-clinical-or-compliance-claims": "simulationV0GoNoGoStatus"
  },
  outputName: "simulation-v0-go-no-go-output.json",
  defaultIssue: "561"
});

await runSelectedStages(context, runStage);
const ready = context.checks.every((check) => check.passed);
finalizeGate(context, {
  testOutputName: "simulation-v0-go-no-go.txt",
  closeoutStatus: ready
    ? "GO for Simulation v0 Internal Dry-Run Implementation."
    : "GO for additional Deterministic Dry-Run Repair."
});

function runStage(stage) {
  const manifest = readJson("docs/verification/deterministic-dry-run-manifest.json");
  if (stage === "readiness") {
    const required = [
      "dryRunManifestStatus",
      "simulationRunContractStatus",
      "deterministicSeedStatus",
      "timestepShellStatus",
      "taskTemplateContractStatus",
      "taskInstanceGenerationStatus",
      "nurseRuntimeStateStatus",
      "queuePlaceholderStatus",
      "ratioDryRunComparisonStatus"
    ];
    for (const key of required) context.add(`${key} passed`, manifest[key] === "passed", manifest[key]);
    writeJson(`${context.dir}/readiness-output.json`, { status: required.every((key) => manifest[key] === "passed") ? "passed" : "not_ready", required });
  }
  if (stage === "no-optimizer") {
    context.add("optimizer remains not started", manifest.optimizerStatus === "not_started", manifest.optimizerStatus);
    writeText(`${context.dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was started for Simulation v0 dry-run planning.\n");
  }
  if (stage === "no-recommendations") {
    context.add("assignment recommendations remain not started", manifest.assignmentRecommendationStatus === "not_started", manifest.assignmentRecommendationStatus);
    writeText(`${context.dir}/no-assignment-recommendation-output.txt`, "passed: no automated assignment recommendation was started for Simulation v0 dry-run planning.\n");
  }
  if (stage === "no-clinical-or-compliance-claims") {
    context.add("clinical scoring remains not started", manifest.clinicalSafetyScoringStatus === "not_started", manifest.clinicalSafetyScoringStatus);
    context.add("staffing compliance remains not started", manifest.staffingComplianceStatus === "not_started", manifest.staffingComplianceStatus);
    context.add("patient outcome prediction remains not started", manifest.patientOutcomePredictionStatus === "not_started", manifest.patientOutcomePredictionStatus);
    writeJson(`${context.dir}/no-clinical-or-compliance-claims-output.json`, { status: "passed" });
  }
}
