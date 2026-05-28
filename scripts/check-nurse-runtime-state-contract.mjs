#!/usr/bin/env node
import { createCheckContext, finalizeGate, runSelectedStages, writeJson } from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["runtime-state-contract", "manual-assignment-input", "synthetic-nurse-labels", "no-recommendations", "final"];
const context = createCheckContext({
  scriptName: "nurse runtime state contract",
  stages,
  statusKeyByStage: {
    "runtime-state-contract": "nurseRuntimeStateStatus",
    "manual-assignment-input": "nurseRuntimeStateStatus",
    "synthetic-nurse-labels": "nurseRuntimeStateStatus",
    "no-recommendations": "nurseRuntimeStateStatus"
  },
  outputName: "nurse-runtime-state-contract-output.json",
  defaultIssue: "567"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "nurse-runtime-state-contract.txt" });

async function build() {
  const shared = await import("../packages/shared/dist/index.js");
  const capacity = shared.buildScenarioCapacityIntegration();
  const bridge = shared.buildManualAssignmentScenarioBridgeInput(capacity, shared.fourToOneRatioPreset);
  const states = shared.buildNurseRuntimeStatesFromManualBridge(bridge, { ratioPreset: shared.fourToOneRatioPreset });
  return { shared, capacity, bridge, states };
}

async function runStage(stage) {
  const { shared, capacity, bridge, states } = await build();
  if (stage === "runtime-state-contract") {
    const validated = shared.validateNurseRuntimeStateSet(states, { capacity });
    context.add("runtime state set validates", validated.states.length > 0, validated.states.length);
    writeJson(`${context.dir}/nurse-runtime-state-output.json`, { status: "passed", states: validated });
    let rejected = false;
    try {
      shared.validateNurseRuntimeStateSet(
        {
          ...states,
          states: [
            {
              ...states.states[0],
              assignedBedPositionIds: [capacity.excludedObjectIds[0]]
            }
          ]
        },
        { capacity }
      );
    } catch {
      rejected = true;
    }
    writeJson(`${context.dir}/excluded-space-negative-output.json`, { status: "passed", rejected });
  }
  if (stage === "manual-assignment-input") {
    context.add("runtime state uses manual assignment bridge", states.manualAssignmentBridgeId === bridge.bridgeId, states.manualAssignmentBridgeId);
    writeJson(`${context.dir}/manual-assignment-input-output.json`, { status: "passed", bridgeId: bridge.bridgeId });
  }
  if (stage === "synthetic-nurse-labels") {
    context.add("nurse labels are synthetic", states.states.every((state) => /^Synthetic Nurse [A-Z]$/u.test(state.syntheticNurseLabel)));
    writeJson(`${context.dir}/synthetic-nurse-label-output.json`, { status: "passed", labels: states.states.map((state) => state.syntheticNurseLabel) });
  }
  if (stage === "no-recommendations") {
    context.add("recommendations remain not started", states.recommendationStatus === "not_started", states.recommendationStatus);
  }
}
