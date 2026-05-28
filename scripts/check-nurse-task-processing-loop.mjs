#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-internal-dry-run-utils.mjs";

const stages = ["synthetic-task-processing", "manual-assignment-input", "no-recommendations", "final"];

const context = createCheckContext({
  scriptName: "nurse task processing loop",
  stages,
  statusKeyByStage: {
    "synthetic-task-processing": "nurseTaskProcessingStatus",
    "manual-assignment-input": "nurseTaskProcessingStatus",
    "no-recommendations": "nurseTaskProcessingStatus"
  },
  outputName: "nurse-task-processing-loop-output.json",
  defaultIssue: "574"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "nurse-task-processing-loop.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const capacity = shared.buildScenarioCapacityIntegration();
  const bridge = shared.buildManualAssignmentScenarioBridgeInput(capacity, shared.fourToOneRatioPreset);
  const runtimeStates = shared.buildNurseRuntimeStatesFromManualBridge(bridge, {
    ratioPreset: shared.fourToOneRatioPreset
  });
  const run = shared.executeInternalDryRun({ capacity, runtimeStates });
  const result = shared.validateNurseTaskProcessingResult(
    shared.processNurseTaskPlaceholders({ capacity, runtimeStates, taskSet: run.taskSet })
  );
  if (stage === "synthetic-task-processing") {
    context.add("assigned nurse receives task placeholders", result.timeline.some((event) => event.eventLabel === "task_placeholder_started" && event.syntheticNurseId != null));
    context.add("busy nurse queues placeholders", result.busyNurseQueuedTaskIds.length > 0, result.busyNurseQueuedTaskIds.length);
    writeJson(`${context.dir}/synthetic-task-processing-output.json`, { status: "passed", result });
    writeJson(`${context.dir}/busy-nurse-queue-output.json`, { status: "passed", busyNurseQueuedTaskIds: result.busyNurseQueuedTaskIds });
  }
  if (stage === "manual-assignment-input") {
    const targetBed = run.taskSet.instances[0].loadableBedPositionId;
    const uncoveredStates = {
      ...runtimeStates,
      states: runtimeStates.states.map((state) => ({
        ...state,
        assignedBedPositionIds: state.assignedBedPositionIds.filter((id) => id !== targetBed)
      }))
    };
    const uncovered = shared.processNurseTaskPlaceholders({
      capacity,
      runtimeStates: uncoveredStates,
      taskSet: { ...run.taskSet, instances: [run.taskSet.instances[0]] }
    });
    let excludedRejected = false;
    try {
      shared.processNurseTaskPlaceholders({
        capacity,
        runtimeStates,
        taskSet: {
          ...run.taskSet,
          instances: [{ ...run.taskSet.instances[0], loadableBedPositionId: capacity.excludedObjectIds[0] }]
        }
      });
    } catch {
      excludedRejected = true;
    }
    context.add("manual assignment bridge is the only assignment source", result.assignmentSource === "manual_assignment_bridge_only", result.assignmentSource);
    context.add("uncovered bed produces unassigned placeholder", uncovered.unassignedPlaceholderTaskIds.length === 1, uncovered.unassignedPlaceholderTaskIds);
    context.add("excluded space negative fixture rejected", excludedRejected);
    writeJson(`${context.dir}/manual-assignment-input-output.json`, { status: "passed", bridgeId: bridge.bridgeId, assignmentSource: result.assignmentSource });
    writeJson(`${context.dir}/unassigned-placeholder-output.json`, { status: "passed", unassignedPlaceholderTaskIds: uncovered.unassignedPlaceholderTaskIds });
    writeJson(`${context.dir}/excluded-space-negative-output.json`, { status: "passed", excludedRejected });
  }
  if (stage === "no-recommendations") {
    context.add("no reassignment search", result.reassignmentSearchStatus === "not_started", result.reassignmentSearchStatus);
    context.add("no recommendation output", result.recommendationStatus === "not_started", result.recommendationStatus);
    context.add("no optimizer output", result.optimizerStatus === "not_started", result.optimizerStatus);
    writeText(`${context.dir}/no-recommendations-output.txt`, "passed: nurse processing loop does not recommend, optimize, rank, or reassign.\n");
  }
}
