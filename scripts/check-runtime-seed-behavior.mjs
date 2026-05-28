#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  runSelectedRepairStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = [
  "runtime-seed-affects-output",
  "operational-runtime-field-changed",
  "deterministic-repeatability",
  "same-workload-preserved",
  "changed-runtime-seed-negative",
  "workload-hash-unchanged",
  "runtime-sensitive-hash-changed",
  "final"
];

const context = createRepairContext({
  scriptName: "runtime seed behavior",
  stages,
  statusKeyByStage: {
    "runtime-seed-affects-output": "runtimeSeedBehaviorStatus",
    "operational-runtime-field-changed": "runtimeSeedOperationalMeaningStatus",
    "deterministic-repeatability": "runtimeSeedBehaviorStatus",
    "same-workload-preserved": "runtimeSeedBehaviorStatus",
    "workload-hash-unchanged": "runtimeSeedBehaviorStatus"
  },
  outputName: "runtime-seed-behavior-output.json",
  defaultIssue: "588"
});

await runSelectedRepairStages(context, runStage);
finalizeRepairGate(context, {
  testOutputName: "runtime-seed-behavior.txt",
  manifestUpdates: {
    runtimeSeedBehaviorStatus: context.checks.every((check) => check.passed) ? "passed" : "failed"
  }
});

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const base = shared.executeInternalDryRun({
    ratioPreset: shared.fourToOneRatioPreset,
    ratioRuntimeSeed: shared.fourToOneRuntimeSeedContract
  });
  const changedSeed = {
    ...shared.fourToOneRuntimeSeedContract,
    seedValue: `${shared.fourToOneRuntimeSeedContract.seedValue}-changed`
  };
  const changed = shared.executeInternalDryRun({
    ratioPreset: shared.fourToOneRatioPreset,
    ratioRuntimeSeed: changedSeed
  });
  if (stage === "runtime-seed-affects-output") {
    const runtimeChanged = runtimeHash(base) !== runtimeHash(changed);
    context.add("changed runtime seed changes runtime-sensitive output", runtimeChanged, { base: runtimeHash(base), changed: runtimeHash(changed) });
    writeJson(`${context.dir}/runtime-seed-affects-output.json`, { status: runtimeChanged ? "passed" : "failed", runtimeSensitiveFields: ["timeline", "nurseRuntimeSnapshots", "queueSnapshots"], baseRuntimeHash: runtimeHash(base), changedRuntimeHash: runtimeHash(changed) });
  }
  if (stage === "operational-runtime-field-changed") {
    const differences = collectOperationalRuntimeDifferences(base, changed);
    const changedOperationalField = differences.length > 0;
    context.add("changed runtime seed changes at least one operational runtime field", changedOperationalField, { differences });
    writeJson(`${context.dir}/operational-runtime-field-changed-output.json`, {
      status: changedOperationalField ? "passed" : "failed",
      invariant: "runtime seed must affect operational runtime behavior, not only event ids or hashes",
      allowedOperationalFields: [
        "queuedPlaceholderCount",
        "delayedPlaceholderCount",
        "nurseProcessingOrder",
        "taskStartMinute",
        "taskDelayedMinute",
        "queuePressureBand"
      ],
      differences
    });
  }
  if (stage === "deterministic-repeatability") {
    const repeat = shared.executeInternalDryRun({
      ratioPreset: shared.fourToOneRatioPreset,
      ratioRuntimeSeed: shared.fourToOneRuntimeSeedContract
    });
    const repeated = runtimeHash(base) === runtimeHash(repeat) && workloadHash(base) === workloadHash(repeat);
    context.add("same runtime seed repeats deterministically", repeated, { runtimeHash: runtimeHash(base), repeatRuntimeHash: runtimeHash(repeat) });
    writeJson(`${context.dir}/deterministic-repeatability-output.json`, { status: repeated ? "passed" : "failed", runtimeHash: runtimeHash(base), repeatRuntimeHash: runtimeHash(repeat) });
  }
  if (stage === "same-workload-preserved") {
    const same = workloadHash(base) === workloadHash(changed);
    context.add("changed runtime seed preserves neutral workload task IDs", same, { workloadHash: workloadHash(base), changedWorkloadHash: workloadHash(changed) });
    writeJson(`${context.dir}/same-workload-preserved-output.json`, { status: same ? "passed" : "failed", workloadHash: workloadHash(base), changedWorkloadHash: workloadHash(changed) });
  }
  if (stage === "changed-runtime-seed-negative") {
    const changedAsExpected = runtimeHash(base) !== runtimeHash(changed);
    context.add("negative fixture proves changed runtime seed cannot produce same runtime-sensitive hash", changedAsExpected, null);
    writeJson(`${context.dir}/changed-runtime-seed-negative-output.json`, { status: changedAsExpected ? "passed" : "failed" });
  }
  if (stage === "workload-hash-unchanged") {
    const unchanged = workloadHash(base) === workloadHash(changed);
    context.add("workload hash is unchanged when only runtime seed changes", unchanged, { workloadHash: workloadHash(base), changedWorkloadHash: workloadHash(changed) });
    writeJson(`${context.dir}/workload-hash-unchanged-output.json`, { status: unchanged ? "passed" : "failed", workloadHash: workloadHash(base), changedWorkloadHash: workloadHash(changed) });
  }
  if (stage === "runtime-sensitive-hash-changed") {
    const changedRuntime = runtimeHash(base) !== runtimeHash(changed);
    context.add("runtime-sensitive hash changes when runtime seed changes", changedRuntime, { runtimeHash: runtimeHash(base), changedRuntimeHash: runtimeHash(changed) });
    writeJson(`${context.dir}/runtime-sensitive-hash-changed-output.json`, { status: changedRuntime ? "passed" : "failed", runtimeHash: runtimeHash(base), changedRuntimeHash: runtimeHash(changed) });
  }
  writeText(`${context.dir}/no-hidden-randomness-output.txt`, scanSourceFor("Math.random") ? "failed: Math.random was found in deterministic simulation source.\n" : "passed: no direct Math.random was found in deterministic simulation source.\n");
  writeText(`${context.dir}/no-current-time-dependency-output.txt`, scanSourceFor("Date.now") ? "failed: Date.now was found in deterministic simulation source.\n" : "passed: no Date.now dependency was found in deterministic simulation source.\n");
}

function workloadHash(run) {
  return hash(JSON.stringify(run.taskSet.instances.map((task) => task.taskInstanceId)));
}

function runtimeHash(run) {
  return hash(JSON.stringify({
    timeline: run.timeline,
    nurseRuntimeSnapshots: run.nurseRuntimeSnapshots,
    queueSnapshots: run.queueSnapshots,
    summaryCounts: run.summaryCounts
  }));
}

function collectOperationalRuntimeDifferences(base, changed) {
  const differences = [];
  if (base.summaryCounts.queuedPlaceholderCount !== changed.summaryCounts.queuedPlaceholderCount) {
    differences.push({
      field: "queuedPlaceholderCount",
      base: base.summaryCounts.queuedPlaceholderCount,
      changed: changed.summaryCounts.queuedPlaceholderCount
    });
  }
  if (base.summaryCounts.delayedPlaceholderCount !== changed.summaryCounts.delayedPlaceholderCount) {
    differences.push({
      field: "delayedPlaceholderCount",
      base: base.summaryCounts.delayedPlaceholderCount,
      changed: changed.summaryCounts.delayedPlaceholderCount
    });
  }
  const baseQueuePressureBand = queuePressureBand(base);
  const changedQueuePressureBand = queuePressureBand(changed);
  if (baseQueuePressureBand !== changedQueuePressureBand) {
    differences.push({
      field: "queuePressureBand",
      base: baseQueuePressureBand,
      changed: changedQueuePressureBand
    });
  }
  const baseOrder = nurseProcessingOrder(base);
  const changedOrder = nurseProcessingOrder(changed);
  if (JSON.stringify(baseOrder) !== JSON.stringify(changedOrder)) {
    differences.push({
      field: "nurseProcessingOrder",
      changedNurseIds: Object.keys(baseOrder).filter(
        (nurseId) => JSON.stringify(baseOrder[nurseId]) !== JSON.stringify(changedOrder[nurseId])
      )
    });
  }
  for (const diff of minuteDifferences(base, changed, "task_placeholder_started", "taskStartMinute")) {
    differences.push(diff);
  }
  for (const diff of minuteDifferences(base, changed, "task_placeholder_delayed", "taskDelayedMinute")) {
    differences.push(diff);
  }
  return differences;
}

function nurseProcessingOrder(run) {
  return Object.fromEntries(
    run.nurseRuntimeSnapshots.map((snapshot) => [
      snapshot.syntheticNurseId,
      snapshot.activePlaceholderTaskIds
    ])
  );
}

function minuteDifferences(base, changed, eventLabel, field) {
  const baseMinutes = minutesByTask(base, eventLabel);
  const changedMinutes = minutesByTask(changed, eventLabel);
  const taskIds = new Set([...Object.keys(baseMinutes), ...Object.keys(changedMinutes)]);
  return [...taskIds]
    .filter((taskId) => baseMinutes[taskId] !== changedMinutes[taskId])
    .map((taskId) => ({ field, taskId, base: baseMinutes[taskId] ?? null, changed: changedMinutes[taskId] ?? null }));
}

function minutesByTask(run, eventLabel) {
  return Object.fromEntries(
    run.timeline
      .filter((event) => event.eventLabel === eventLabel)
      .map((event) => [event.taskInstanceId, event.syntheticMinuteOffset])
  );
}

function queuePressureBand(run) {
  const pressureCount = run.summaryCounts.queuedPlaceholderCount + run.summaryCounts.delayedPlaceholderCount;
  if (run.summaryCounts.generatedTaskCount === 0 || pressureCount / run.summaryCounts.generatedTaskCount <= 0.15) return "placeholder_light";
  if (pressureCount / run.summaryCounts.generatedTaskCount <= 0.45) return "placeholder_moderate";
  return "placeholder_heavy";
}

function hash(text) {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value.toString(16).padStart(8, "0");
}

function scanSourceFor(fragment) {
  const files = [
    "packages/shared/src/simulation/internalDryRunExecutor.ts",
    "packages/shared/src/simulation/nurseTaskProcessingLoop.ts",
    "packages/shared/src/simulation/taskInstanceGeneration.ts",
    "packages/shared/src/simulation/ratioAwareQueuePlaceholder.ts"
  ];
  return files.some((file) => readFileSync(abs(file), "utf8").includes(fragment));
}
