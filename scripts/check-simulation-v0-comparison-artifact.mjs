#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-internal-dry-run-utils.mjs";

const stages = ["shared-workload", "ratio-specific-runtime", "comparison-artifact", "no-safety-or-compliance-claims", "final"];

const context = createCheckContext({
  scriptName: "simulation v0 comparison artifact",
  stages,
  statusKeyByStage: {
    "shared-workload": "ratioComparisonArtifactStatus",
    "ratio-specific-runtime": "ratioComparisonArtifactStatus",
    "comparison-artifact": "ratioComparisonArtifactStatus",
    "no-safety-or-compliance-claims": "ratioComparisonArtifactStatus"
  },
  outputName: "simulation-v0-comparison-artifact-output.json",
  defaultIssue: "577"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "simulation-v0-comparison-artifact.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const artifact = shared.validateSimulationV0ComparisonArtifact(shared.buildSimulationV0ComparisonArtifact());
  if (stage === "shared-workload") {
    context.add("comparison uses neutral workload seed", artifact.sharedWorkload.neutralWorkloadSeedId === "neutral-workload-seed-canonical-plan-1", artifact.sharedWorkload);
    context.add("both ratios share generated task count", artifact.runs[0].generatedTaskCount === artifact.runs[1].generatedTaskCount);
    writeJson(`${context.dir}/shared-workload-output.json`, { status: "passed", sharedWorkload: artifact.sharedWorkload });
  }
  if (stage === "ratio-specific-runtime") {
    context.add("runtime seed ids differ", artifact.ratioRuntime.fourToOneRuntimeSeedId !== artifact.ratioRuntime.threeToOneRuntimeSeedId, artifact.ratioRuntime);
    context.add("runtime group counts differ by ratio", artifact.runs[0].syntheticNurseRuntimeGroupCount !== artifact.runs[1].syntheticNurseRuntimeGroupCount, artifact.runs);
    writeJson(`${context.dir}/ratio-specific-runtime-output.json`, { status: "passed", ratioRuntime: artifact.ratioRuntime, runs: artifact.runs });
  }
  if (stage === "comparison-artifact") {
    context.add("comparison artifact validates", artifact.artifactId === "simulation-v0-four-to-one-vs-three-to-one-comparison", artifact.artifactId);
    writeJson(`${context.dir}/comparison-artifact-output.json`, { status: "passed", artifact });
    writeJson("docs/verification/simulation-v0-comparison-artifact.json", artifact);
  }
  if (stage === "no-safety-or-compliance-claims") {
    context.add("no clinical safety claim", artifact.clinicalSafetyClaim === false);
    context.add("no staffing compliance claim", artifact.staffingComplianceClaim === false);
    context.add("no patient outcome claim", artifact.patientOutcomePredictionClaim === false);
    context.add("no optimizer or recommendation", artifact.optimizerStatus === "not_started" && artifact.assignmentRecommendationStatus === "not_started");
    writeText(`${context.dir}/no-safety-or-compliance-claims-output.txt`, "passed: comparison artifact does not claim clinical safety or staffing compliance.\n");
  }
}
