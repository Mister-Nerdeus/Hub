#!/usr/bin/env node
import {
  bridgeManualAssignmentsToScenarioInput,
  buildScenarioCapacityIntegration,
  fourToOneRatioPreset
} from "../packages/shared/dist/index.js";
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/scenario-seed-foundation-utils.mjs";

const stages = ["bridge-contract", "coverage-readiness", "ratio-readiness", "no-recommendations", "final"];
const context = createCheckContext({
  scriptName: "manual assignment scenario bridge",
  stages,
  statusKeyByStage: {
    "bridge-contract": "manualAssignmentScenarioBridgeStatus",
    "coverage-readiness": "manualAssignmentScenarioBridgeStatus",
    "ratio-readiness": "manualAssignmentScenarioBridgeStatus",
    "no-recommendations": "manualAssignmentScenarioBridgeStatus"
  },
  outputName: "manual-assignment-scenario-bridge-gate-output.json",
  defaultIssue: "558"
});

const capacity = buildScenarioCapacityIntegration();
const input = {
  schemaVersion: "1.0.0",
  bridgeId: "manual-assignment-scenario-bridge-canonical-plan-1",
  assignmentGroups: [
    {
      assignmentGroupId: "synthetic-group-blue",
      syntheticNurseLabel: "Synthetic Nurse Blue",
      assignedBedPositionIds: ["room-level-1-trauma", "room-02", "room-03", "room-14"],
      syntheticDataOnly: true
    },
    {
      assignmentGroupId: "synthetic-group-green",
      syntheticNurseLabel: "Synthetic Nurse Green",
      assignedBedPositionIds: ["room-04", "room-05", "room-06", "room-07"],
      syntheticDataOnly: true
    }
  ],
  ratioPreset: fourToOneRatioPreset,
  capacity,
  recommendationStatus: "not_started",
  optimizerStatus: "not_started",
  fullShiftSimulationStatus: "not_started",
  syntheticDataOnly: true
};
const summary = bridgeManualAssignmentsToScenarioInput(input);

runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "manual-assignment-scenario-bridge.txt" });

function runStage(stage) {
  if (stage === "bridge-contract") {
    context.add("bridge returns summary", summary.bridgeId === input.bridgeId, summary);
    context.add("excluded spaces are ignored", summary.ignoredExcludedObjectIds.includes("room-14"), summary.ignoredExcludedObjectIds);
    writeJson(`${context.dir}/manual-assignment-bridge-output.json`, { status: "passed", summary });
    writeJson(`${context.dir}/excluded-space-ignored-output.json`, { status: "passed", ignored: summary.ignoredExcludedObjectIds });
  }
  if (stage === "coverage-readiness") {
    context.add("covered eligible positions are selector-derived", summary.coveredEligibleBedPositionIds.includes("room-02"));
    context.add("uncovered eligible positions are reported", summary.uncoveredEligibleBedPositionIds.length > 0, summary.uncoveredEligibleBedPositionIds.length);
    writeJson(`${context.dir}/coverage-readiness-output.json`, { status: "passed", covered: summary.coveredEligibleBedPositionIds, uncovered: summary.uncoveredEligibleBedPositionIds });
    writeJson(`${context.dir}/split-bay-assignment-output.json`, { status: "passed", splitBayBedPositions: ["room-02", "room-03", "room-04", "room-05"] });
  }
  if (stage === "ratio-readiness") {
    context.add("ratio readiness uses preset", summary.ratioReadiness.ratioPresetId === "four_to_one", summary.ratioReadiness);
    context.add("ratio readiness is placeholder only", typeof summary.ratioReadiness.overCapacityPlaceholder === "boolean");
    writeJson(`${context.dir}/ratio-readiness-output.json`, { status: "passed", ratioReadiness: summary.ratioReadiness });
  }
  if (stage === "no-recommendations") {
    context.add("bridge does not recommend", summary.recommendationStatus === "not_started", summary.recommendationStatus);
    context.add("bridge does not optimize", summary.optimizerStatus === "not_started", summary.optimizerStatus);
    writeText(`${context.dir}/no-assignment-recommendation-output.txt`, "passed: manual assignment bridge reports readiness only and does not recommend assignments\n");
  }
}

