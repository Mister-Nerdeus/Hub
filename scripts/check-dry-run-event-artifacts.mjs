#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-internal-dry-run-utils.mjs";

const stages = ["event-artifact", "summary-artifact", "deterministic-hash", "limitations", "final"];

const context = createCheckContext({
  scriptName: "dry-run event artifacts",
  stages,
  statusKeyByStage: {
    "event-artifact": "dryRunEventArtifactStatus",
    "summary-artifact": "dryRunEventArtifactStatus",
    "deterministic-hash": "dryRunEventArtifactStatus",
    limitations: "dryRunEventArtifactStatus"
  },
  outputName: "dry-run-event-artifacts-output.json",
  defaultIssue: "576"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "dry-run-event-artifacts.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const bundle = shared.generateDryRunArtifactBundle(shared.executeInternalDryRun());
  if (stage === "event-artifact") {
    context.add("event artifact exists", bundle.eventArtifact.timeline.length > 0, bundle.eventArtifact.artifactId);
    writeJson(`${context.dir}/event-artifact-output.json`, { status: "passed", eventArtifact: bundle.eventArtifact });
    writeJson("docs/verification/dry-run-artifacts/event-timeline.json", bundle.eventArtifact);
  }
  if (stage === "summary-artifact") {
    context.add("task summary exists", bundle.taskSummaryArtifact.artifactType === "task_summary", bundle.taskSummaryArtifact);
    context.add("nurse runtime summary exists", bundle.nurseRuntimeSummaryArtifact.artifactType === "nurse_runtime_summary", bundle.nurseRuntimeSummaryArtifact);
    context.add("queue placeholder summary exists", bundle.queuePlaceholderSummaryArtifact.artifactType === "queue_placeholder_summary", bundle.queuePlaceholderSummaryArtifact);
    writeJson(`${context.dir}/summary-artifact-output.json`, {
      status: "passed",
      taskSummaryArtifact: bundle.taskSummaryArtifact,
      nurseRuntimeSummaryArtifact: bundle.nurseRuntimeSummaryArtifact,
      queuePlaceholderSummaryArtifact: bundle.queuePlaceholderSummaryArtifact
    });
    writeJson("docs/verification/dry-run-artifacts/task-summary.json", bundle.taskSummaryArtifact);
    writeJson("docs/verification/dry-run-artifacts/nurse-runtime-summary.json", bundle.nurseRuntimeSummaryArtifact);
    writeJson("docs/verification/dry-run-artifacts/queue-placeholder-summary.json", bundle.queuePlaceholderSummaryArtifact);
  }
  if (stage === "deterministic-hash") {
    const repeat = shared.generateDryRunArtifactBundle(shared.executeInternalDryRun());
    context.add("stable artifact hash repeats", bundle.stableArtifactHash === repeat.stableArtifactHash, { first: bundle.stableArtifactHash, second: repeat.stableArtifactHash });
    context.add("hash excludes nondeterministic metadata", bundle.hashExcludesNondeterministicMetadata === true);
    writeText(`${context.dir}/artifact-hash-output.txt`, `passed: ${bundle.stableArtifactHash}\n`);
    writeJson("docs/verification/dry-run-artifacts/artifact-bundle.json", bundle);
  }
  if (stage === "limitations") {
    context.add("limitations markdown exists", bundle.limitationsMarkdown.includes("Internal Dry-Run Limitations"));
    writeText(`${context.dir}/limitations-output.md`, bundle.limitationsMarkdown);
    writeText("docs/verification/dry-run-artifacts/limitations.md", bundle.limitationsMarkdown);
  }
}
