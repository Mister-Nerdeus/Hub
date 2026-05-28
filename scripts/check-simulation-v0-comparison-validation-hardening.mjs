#!/usr/bin/env node
import {
  createRepairContext,
  finalizeRepairGate,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = [
  "exact-ratio-pair",
  "seed-pairing",
  "shared-workload-integrity",
  "limitation-copy",
  "internal-only",
  "negative-fixtures",
  "final"
];

const context = createRepairContext({
  scriptName: "simulation v0 comparison validation hardening",
  stages,
  statusKeyByStage: {
    "exact-ratio-pair": "comparisonValidationHardeningStatus",
    "seed-pairing": "comparisonValidationHardeningStatus",
    "shared-workload-integrity": "comparisonValidationHardeningStatus",
    "limitation-copy": "comparisonValidationHardeningStatus",
    "negative-fixtures": "comparisonValidationHardeningStatus"
  },
  outputName: "simulation-v0-comparison-validation-hardening-output.json",
  defaultIssue: "589"
});

await runSelectedRepairStages(context, runStage);
finalizeRepairGate(context, {
  testOutputName: "simulation-v0-comparison-validation-hardening.txt",
  manifestUpdates: {
    comparisonValidationHardeningStatus: context.checks.every((check) => check.passed) ? "passed" : "failed"
  }
});

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const artifact = shared.validateSimulationV0ComparisonArtifact(shared.buildSimulationV0ComparisonArtifact());
  if (stage === "exact-ratio-pair") {
    const ids = artifact.runs.map((run) => run.ratioPresetId).sort();
    const passed = ids.join("|") === "four_to_one|three_to_one";
    context.add("comparison artifact includes exactly one 4:1 and one 3:1 run", passed, { ids });
    writeJson(`${context.dir}/exact-ratio-pair-output.json`, { status: passed ? "passed" : "failed", ids });
  }
  if (stage === "seed-pairing") {
    const four = artifact.runs.find((run) => run.ratioPresetId === "four_to_one");
    const three = artifact.runs.find((run) => run.ratioPresetId === "three_to_one");
    const passed = four?.ratioRuntimeSeedId === shared.FOUR_TO_ONE_RUNTIME_SEED_ID && three?.ratioRuntimeSeedId === shared.THREE_TO_ONE_RUNTIME_SEED_ID;
    context.add("runtime seed IDs exactly match ratio runs", passed, { four: four?.ratioRuntimeSeedId, three: three?.ratioRuntimeSeedId });
    writeJson(`${context.dir}/seed-pairing-output.json`, { status: passed ? "passed" : "failed", four: four?.ratioRuntimeSeedId, three: three?.ratioRuntimeSeedId });
  }
  if (stage === "shared-workload-integrity") {
    const ids = artifact.sharedWorkload.taskInstanceIds;
    const passed = artifact.sharedWorkload.generatedTaskCount === ids.length &&
      new Set(ids).size === ids.length &&
      artifact.runs.every((run) => run.generatedTaskCount === artifact.sharedWorkload.generatedTaskCount);
    context.add("shared workload counts and unique task IDs are validated", passed, { generatedTaskCount: artifact.sharedWorkload.generatedTaskCount, taskIdCount: ids.length, uniqueTaskIdCount: new Set(ids).size });
    writeJson(`${context.dir}/shared-workload-integrity-output.json`, { status: passed ? "passed" : "failed", generatedTaskCount: artifact.sharedWorkload.generatedTaskCount, taskIdCount: ids.length });
  }
  if (stage === "limitation-copy") {
    const text = artifact.limitationCopy.join(" ").toLowerCase();
    const required = ["internal synthetic dry-run", "same neutral synthetic workload", "no optimizer", "assignment recommendation", "clinical safety", "staffing compliance", "patient outcome prediction"];
    const missing = required.filter((fragment) => !text.includes(fragment));
    context.add("limitation copy includes required non-claim boundaries", missing.length === 0, { missing });
    writeJson(`${context.dir}/limitation-copy-output.json`, { status: missing.length === 0 ? "passed" : "failed", missing });
  }
  if (stage === "internal-only") {
    const passed = artifact.internalOnlyStatus === "internal_dry_run_only" && artifact.syntheticDataOnly === true;
    context.add("comparison artifact remains internal-only and synthetic-only", passed, { internalOnlyStatus: artifact.internalOnlyStatus, syntheticDataOnly: artifact.syntheticDataOnly });
    writeJson(`${context.dir}/internal-only-output.json`, { status: passed ? "passed" : "failed" });
  }
  if (stage === "negative-fixtures") {
    const invalids = negativeFixtures(shared, artifact);
    const results = invalids.map(({ name, artifact: invalid }) => ({ name, error: capture(() => shared.validateSimulationV0ComparisonArtifact(invalid)) }));
    const passed = results.every((result) => result.error);
    context.add("invalid comparison artifacts fail validation", passed, { results });
    writeJson(`${context.dir}/negative-fixtures-output.json`, { status: passed ? "passed" : "failed", results });
  }
}

function negativeFixtures(shared, artifact) {
  const four = artifact.runs.find((run) => run.ratioPresetId === "four_to_one");
  const three = artifact.runs.find((run) => run.ratioPresetId === "three_to_one");
  return [
    { name: "duplicate 4:1 runs", artifact: { ...artifact, runs: [four, { ...four }] } },
    { name: "missing 3:1 run", artifact: { ...artifact, runs: [four] } },
    { name: "wrong runtime seed", artifact: { ...artifact, runs: [{ ...four, ratioRuntimeSeedId: shared.THREE_TO_ONE_RUNTIME_SEED_ID }, three] } },
    { name: "mismatched generated task count", artifact: { ...artifact, runs: [{ ...four, generatedTaskCount: four.generatedTaskCount + 1 }, three] } },
    { name: "duplicate task IDs", artifact: { ...artifact, sharedWorkload: { ...artifact.sharedWorkload, taskInstanceIds: [artifact.sharedWorkload.taskInstanceIds[0], artifact.sharedWorkload.taskInstanceIds[0]], generatedTaskCount: 2 } } },
    { name: "missing limitation copy", artifact: { ...artifact, limitationCopy: [] } },
    { name: "optimizer started", artifact: { ...artifact, optimizerStatus: "started" } },
    { name: "assignment recommendation started", artifact: { ...artifact, assignmentRecommendationStatus: "started" } },
    { name: "staffing compliance claim true", artifact: { ...artifact, staffingComplianceClaim: true } },
    { name: "patient outcome claim true", artifact: { ...artifact, patientOutcomePredictionClaim: true } },
    { name: "syntheticDataOnly false", artifact: { ...artifact, syntheticDataOnly: false } }
  ];
}

function capture(fn) {
  try {
    fn();
    return null;
  } catch (error) {
    return error.message;
  }
}
