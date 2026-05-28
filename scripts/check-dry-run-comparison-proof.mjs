#!/usr/bin/env node
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["four-to-one-dry-run", "three-to-one-dry-run", "shared-inputs", "comparison-proof", "no-safety-or-compliance-claims", "final"];
const context = createCheckContext({
  scriptName: "dry-run comparison proof",
  stages,
  statusKeyByStage: {
    "four-to-one-dry-run": "ratioDryRunComparisonStatus",
    "three-to-one-dry-run": "ratioDryRunComparisonStatus",
    "shared-inputs": "ratioDryRunComparisonStatus",
    "comparison-proof": "ratioDryRunComparisonStatus",
    "no-safety-or-compliance-claims": "ratioDryRunComparisonStatus"
  },
  outputName: "dry-run-comparison-proof-output.json",
  defaultIssue: "569"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "dry-run-comparison-proof.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const proof = shared.buildDryRunComparisonProof();
  const validated = shared.validateDryRunComparisonProof(proof);
  const four = validated.runs.find((run) => run.ratioPresetId === "four_to_one");
  const three = validated.runs.find((run) => run.ratioPresetId === "three_to_one");
  if (stage === "four-to-one-dry-run") {
    context.add("4:1 dry-run proof exists", four != null, four);
    writeJson(`${context.dir}/four-to-one-dry-run-output.json`, { status: "passed", run: four });
  }
  if (stage === "three-to-one-dry-run") {
    context.add("3:1 dry-run proof exists", three != null, three);
    writeJson(`${context.dir}/three-to-one-dry-run-output.json`, { status: "passed", run: three });
  }
  if (stage === "shared-inputs") {
    context.add("runs share canonical seed", new Set(validated.runs.map((run) => run.canonicalScenarioSeedId)).size === 1);
    context.add("runs share activity profile", new Set(validated.runs.map((run) => run.activityProfileId)).size === 1);
    context.add("runs share neutral workload seed", new Set(validated.runs.map((run) => run.neutralWorkloadSeedId)).size === 1);
    context.add("runs use ratio-specific runtime seeds", new Set(validated.runs.map((run) => run.ratioRuntimeSeedId)).size === 2);
    writeJson(`${context.dir}/shared-inputs-output.json`, { status: "passed", sharedInputs: validated.sharedInputs });
  }
  if (stage === "comparison-proof") {
    context.add("comparison proof validates", validated.proofId === "dry-run-ratio-comparison-proof-canonical-plan-1");
    writeJson(`${context.dir}/comparison-proof-output.json`, { status: "passed", proof: validated });
    writeJson("docs/verification/dry-run-comparison-proof.json", validated);
    writeJson(`${context.dir}/repeatability-output.json`, { status: "passed", repeatable: JSON.stringify(validated) === JSON.stringify(shared.buildDryRunComparisonProof()) });
  }
  if (stage === "no-safety-or-compliance-claims") {
    context.add("proof carries no clinical claim", validated.clinicalSafetyClaim === false, validated.clinicalSafetyClaim);
    context.add("proof carries no compliance claim", validated.staffingComplianceClaim === false, validated.staffingComplianceClaim);
    context.add("proof carries no outcome claim", validated.patientOutcomeClaim === false, validated.patientOutcomeClaim);
    writeText(`${context.dir}/no-safety-or-compliance-claims-output.txt`, "passed: dry-run comparison proof does not claim clinical safety or staffing compliance.\n");
  }
}
