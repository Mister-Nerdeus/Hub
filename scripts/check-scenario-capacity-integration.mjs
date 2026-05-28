#!/usr/bin/env node
import {
  assertScenarioCapacityIntegration,
  buildCanonicalCapacityCountReport,
  buildScenarioCapacityIntegration
} from "../packages/shared/dist/index.js";
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/scenario-seed-foundation-utils.mjs";

const stages = ["capacity-report", "split-bay-bridge", "excluded-spaces", "no-raw-room-counts", "final"];
const context = createCheckContext({
  scriptName: "scenario capacity integration",
  stages,
  statusKeyByStage: {
    "capacity-report": "capacityIntegrationStatus",
    "split-bay-bridge": "capacityIntegrationStatus",
    "excluded-spaces": "capacityIntegrationStatus",
    "no-raw-room-counts": "capacityIntegrationStatus"
  },
  outputName: "scenario-capacity-integration-gate-output.json",
  defaultIssue: "555"
});

const report = buildCanonicalCapacityCountReport();
const integration = assertScenarioCapacityIntegration(buildScenarioCapacityIntegration(report));
runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "scenario-capacity-integration.txt" });

function runStage(stage) {
  if (stage === "capacity-report") {
    context.add("scenario capacity uses canonical report", integration.usesCanonicalCapacityReport, integration);
    context.add("capacity counts are selector-driven", integration.source === "semantic_selectors", integration.source);
    writeJson(`${context.dir}/scenario-capacity-integration-output.json`, { status: "passed", integration });
    writeJson(`${context.dir}/capacity-report-integration-output.json`, { status: "passed", report });
  }
  if (stage === "split-bay-bridge") {
    context.add("split bays flow from bridge", integration.splitBayCount === 4 && integration.usesSplitBayFixtureBridge, integration.splitBayCount);
    context.add("bed positions differ from physical room count", integration.bedPositionCount !== integration.physicalRoomCount, integration);
    writeJson(`${context.dir}/split-bay-bridge-integration-output.json`, { status: "passed", splitBayCount: integration.splitBayCount });
  }
  if (stage === "excluded-spaces") {
    context.add("storage is excluded", integration.excludedObjectIds.includes("room-14"));
    context.add("support is excluded", integration.excludedObjectIds.includes("station-left"));
    context.add("hallway is excluded", integration.excludedObjectIds.includes("hallway-main"));
    writeJson(`${context.dir}/excluded-space-proof-output.json`, { status: "passed", excludedObjectIds: integration.excludedObjectIds });
  }
  if (stage === "no-raw-room-counts") {
    context.add("raw room iteration flag is false", integration.rawFixtureRoomIterationUsed === false);
    writeText(`${context.dir}/no-raw-room-counts-output.txt`, "passed: scenario capacity integration is based on canonical capacity selectors and split-bay bridge output\n");
  }
}

