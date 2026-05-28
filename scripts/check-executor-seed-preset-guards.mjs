#!/usr/bin/env node
import {
  createRepairContext,
  finalizeRepairGate,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = [
  "matching-inputs",
  "mismatched-ratio-runtime-negative",
  "mismatched-activity-profile-negative",
  "mismatched-canonical-seed-negative",
  "synthetic-only-negative",
  "final"
];

const context = createRepairContext({
  scriptName: "executor seed preset guards",
  stages,
  statusKeyByStage: {
    "matching-inputs": "executorSeedPresetGuardStatus",
    "mismatched-ratio-runtime-negative": "executorSeedPresetGuardStatus",
    "mismatched-activity-profile-negative": "executorSeedPresetGuardStatus",
    "mismatched-canonical-seed-negative": "executorSeedPresetGuardStatus",
    "synthetic-only-negative": "executorSeedPresetGuardStatus"
  },
  outputName: "executor-seed-preset-guards-output.json",
  defaultIssue: "587"
});

await runSelectedRepairStages(context, runStage);
finalizeRepairGate(context, {
  testOutputName: "executor-seed-preset-guards.txt",
  manifestUpdates: {
    executorSeedPresetGuardStatus: context.checks.every((check) => check.passed) ? "passed" : "failed"
  }
});

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  if (stage === "matching-inputs") {
    const four = shared.executeInternalDryRun({
      ratioPreset: shared.fourToOneRatioPreset,
      ratioRuntimeSeed: shared.fourToOneRuntimeSeedContract
    });
    const three = shared.executeInternalDryRun({
      ratioPreset: shared.threeToOneRatioPreset,
      ratioRuntimeSeed: shared.threeToOneRuntimeSeedContract
    });
    const passed = four.ratioPresetId === "four_to_one" && three.ratioPresetId === "three_to_one";
    context.add("valid 4:1 and 3:1 seed/preset matrices pass", passed, { four: four.ratioRuntimeSeedId, three: three.ratioRuntimeSeedId });
    writeJson(`${context.dir}/matching-inputs-output.json`, { status: passed ? "passed" : "failed", validInputs: [summary(four), summary(three)] });
  }
  if (stage === "mismatched-ratio-runtime-negative") {
    const failures = [
      capture(() => shared.executeInternalDryRun({ ratioPreset: shared.fourToOneRatioPreset, ratioRuntimeSeed: shared.threeToOneRuntimeSeedContract })),
      capture(() => shared.executeInternalDryRun({ ratioPreset: shared.threeToOneRatioPreset, ratioRuntimeSeed: shared.fourToOneRuntimeSeedContract }))
    ];
    context.add("mismatched ratio/runtime seed pairs are rejected", failures.every(Boolean), { failures });
    writeJson(`${context.dir}/mismatched-ratio-runtime-negative-output.json`, { status: failures.every(Boolean) ? "passed" : "failed", failures });
  }
  if (stage === "mismatched-activity-profile-negative") {
    const busyWorkload = { ...shared.neutralWorkloadSeedContract, activityProfileId: "busy" };
    const slammedRuntime = { ...shared.fourToOneRuntimeSeedContract, activityProfileId: "slammed" };
    const failures = [
      capture(() => shared.executeInternalDryRun({ activityProfile: shared.typicalActivityProfile, neutralWorkloadSeed: busyWorkload })),
      capture(() => shared.executeInternalDryRun({ activityProfile: shared.typicalActivityProfile, ratioRuntimeSeed: slammedRuntime }))
    ];
    context.add("mismatched activity profile seeds are rejected", failures.every(Boolean), { failures });
    writeJson(`${context.dir}/mismatched-activity-profile-negative-output.json`, { status: failures.every(Boolean) ? "passed" : "failed", failures });
  }
  if (stage === "mismatched-canonical-seed-negative") {
    const badSeed = { ...shared.neutralWorkloadSeedContract, canonicalScenarioSeedId: "wrong-seed" };
    const failure = capture(() => shared.executeInternalDryRun({ neutralWorkloadSeed: badSeed }));
    context.add("mismatched canonical scenario seed is rejected", Boolean(failure), { failure });
    writeJson(`${context.dir}/mismatched-canonical-seed-negative-output.json`, { status: failure ? "passed" : "failed", failure });
  }
  if (stage === "synthetic-only-negative") {
    const badPreset = { ...shared.fourToOneRatioPreset, syntheticDataOnly: false };
    const failure = capture(() => shared.executeInternalDryRun({ ratioPreset: badPreset }));
    context.add("syntheticDataOnly false is rejected at executor boundary", Boolean(failure), { failure });
    writeJson(`${context.dir}/synthetic-only-negative-output.json`, { status: failure ? "passed" : "failed", failure });
  }
}

function capture(fn) {
  try {
    fn();
    return null;
  } catch (error) {
    return error.message;
  }
}

function summary(run) {
  return {
    ratioPresetId: run.ratioPresetId,
    neutralWorkloadSeedId: run.neutralWorkloadSeedId,
    ratioRuntimeSeedId: run.ratioRuntimeSeedId,
    activityProfileId: run.activityProfileId,
    canonicalScenarioSeedId: run.canonicalScenarioSeedId
  };
}
