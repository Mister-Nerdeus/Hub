#!/usr/bin/env node
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["queue-placeholder", "delayed-task-placeholder", "deterministic-order", "no-outcome-claim", "final"];
const context = createCheckContext({
  scriptName: "dry-run queue placeholder",
  stages,
  statusKeyByStage: {
    "queue-placeholder": "queuePlaceholderStatus",
    "delayed-task-placeholder": "queuePlaceholderStatus",
    "deterministic-order": "queuePlaceholderStatus",
    "no-outcome-claim": "queuePlaceholderStatus"
  },
  outputName: "dry-run-queue-placeholder-output.json",
  defaultIssue: "568"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "dry-run-queue-placeholder.txt" });

async function build() {
  const shared = await import("../packages/shared/dist/index.js");
  const capacity = shared.buildScenarioCapacityIntegration();
  const roomLoad = shared.buildRoomLoadStarterContract(capacity, 4);
  const generated = shared.generateDryRunTaskInstances({ roomLoad, activityProfile: shared.typicalActivityProfile, seedContract: shared.deterministicDryRunSeedContract, templates: shared.dryRunTaskTemplates, capacity });
  const queue = shared.buildDryRunQueuePlaceholder({ taskSet: generated, seedContract: shared.deterministicDryRunSeedContract });
  return { shared, queue };
}

async function runStage(stage) {
  const { shared, queue } = await build();
  const validated = shared.validateDryRunQueuePlaceholder(queue);
  if (stage === "queue-placeholder") {
    context.add("queue placeholder validates", validated.queuedTaskIds.length > 0, validated.queuedTaskIds.length);
    writeJson(`${context.dir}/queue-placeholder-output.json`, { status: "passed", queue: validated });
  }
  if (stage === "delayed-task-placeholder") {
    context.add("delayed placeholder validates", validated.delayedTaskIds.length > 0, validated.delayedTaskIds.length);
    writeJson(`${context.dir}/delayed-task-placeholder-output.json`, { status: "passed", delayedTaskIds: validated.delayedTaskIds });
  }
  if (stage === "deterministic-order") {
    const again = shared.buildDryRunQueuePlaceholder({ taskSet: validated.taskSetSnapshot, seedContract: shared.deterministicDryRunSeedContract });
    context.add("queue order repeats", JSON.stringify(validated.queuedTaskIds) === JSON.stringify(again.queuedTaskIds));
    writeJson(`${context.dir}/deterministic-order-output.json`, { status: "passed", queuedTaskIds: validated.queuedTaskIds });
  }
  if (stage === "no-outcome-claim") {
    context.add("no outcome claim flag is false", validated.outcomeClaim === false, validated.outcomeClaim);
    writeText(`${context.dir}/no-outcome-claim-output.txt`, "passed: queue and delay placeholders do not claim patient outcome impact.\n");
  }
}
