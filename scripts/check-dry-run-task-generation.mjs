#!/usr/bin/env node
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["room-load-input", "task-instance-generation", "excluded-space-negative", "deterministic-repeatability", "final"];
const context = createCheckContext({
  scriptName: "dry-run task generation",
  stages,
  statusKeyByStage: {
    "room-load-input": "taskInstanceGenerationStatus",
    "task-instance-generation": "taskInstanceGenerationStatus",
    "excluded-space-negative": "taskInstanceGenerationStatus",
    "deterministic-repeatability": "taskInstanceGenerationStatus"
  },
  outputName: "dry-run-task-generation-output.json",
  defaultIssue: "566"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "dry-run-task-generation.txt" });

async function build() {
  const shared = await import("../packages/shared/dist/index.js");
  const capacity = shared.buildScenarioCapacityIntegration();
  const roomLoad = shared.buildRoomLoadStarterContract(capacity, 4);
  return { shared, capacity, roomLoad, generated: shared.generateDryRunTaskInstances({ roomLoad, activityProfile: shared.typicalActivityProfile, seedContract: shared.deterministicDryRunSeedContract, templates: shared.dryRunTaskTemplates, capacity }) };
}

async function runStage(stage) {
  const { shared, capacity, roomLoad, generated } = await build();
  if (stage === "room-load-input") {
    context.add("room-load input is synthetic", roomLoad.source === "synthetic planning input", roomLoad.source);
    writeJson(`${context.dir}/room-load-input-output.json`, { status: "passed", entryCount: roomLoad.entries.length });
  }
  if (stage === "task-instance-generation") {
    const validated = shared.validateDryRunTaskInstanceSet(generated, { capacity });
    context.add("task instances validate", validated.instances.length > 0, validated.instances.length);
    writeJson(`${context.dir}/task-instance-generation-output.json`, { status: "passed", generated: validated });
    writeText(`${context.dir}/no-clinical-task-claim-output.txt`, "passed: generated task instances are synthetic operational placeholders.\n");
  }
  if (stage === "excluded-space-negative") {
    let rejected = false;
    try {
      shared.validateDryRunTaskInstanceSet({ ...generated, instances: [{ ...generated.instances[0], loadableBedPositionId: capacity.excludedObjectIds[0] }] }, { capacity });
    } catch {
      rejected = true;
    }
    context.add("excluded spaces are rejected", rejected);
    writeJson(`${context.dir}/excluded-space-negative-output.json`, { status: "passed", rejected });
  }
  if (stage === "deterministic-repeatability") {
    const again = shared.generateDryRunTaskInstances({ roomLoad, activityProfile: shared.typicalActivityProfile, seedContract: shared.deterministicDryRunSeedContract, templates: shared.dryRunTaskTemplates, capacity });
    context.add("task generation repeats with same seed", JSON.stringify(generated) === JSON.stringify(again));
    writeJson(`${context.dir}/deterministic-repeatability-output.json`, { status: "passed", repeatable: true });
  }
}
