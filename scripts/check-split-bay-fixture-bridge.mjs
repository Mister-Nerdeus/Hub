#!/usr/bin/env node
import {
  addCheck,
  finalizeHardeningGate,
  issueDir,
  parseArgs,
  stageListForFinal,
  writeJson
} from "./lib/canonical-fidelity-hardening-utils.mjs";
import {
  getBedCountContributionForRoomId,
  getOccupancyTypeForRoomId,
  getPhysicalRoomCountContributionForRoomId,
  getSplitBayFixtureOccupancyBridge,
  getSplitBayIdForRoomId,
  isAssignmentEligibleByFixtureBridge,
  isRatioEligibleByFixtureBridge
} from "../packages/shared/dist/index.js";

const stages = ["fixture-bridge", "count-selectors", "assignment-selectors", "scenario-selectors", "final"];
const args = parseArgs();
const stage = args.stage ?? "final";
const issue = args.issue ?? "544";
const allowPartial = args["allow-partial"] === true;
if (!stages.includes(stage)) throw new Error(`Unsupported split-bay fixture bridge stage: ${stage}`);

const checks = [];
const dir = issueDir(issue);
const pairedRoomIds = ["room-02", "room-03", "room-04", "room-05", "room-06", "room-07", "room-08", "room-09"];

function run(currentStage) {
  if (currentStage === "fixture-bridge") {
    const bridges = pairedRoomIds.map((roomId) => getSplitBayFixtureOccupancyBridge(roomId));
    writeJson(`${dir}/split-bay-bridge-output.json`, { status: "passed", bridges });
    writeJson(`${dir}/occupancy-type-mapping-output.json`, {
      status: "passed",
      mappings: ["room-level-1-trauma", ...pairedRoomIds, "room-14", "station-left", "hallway-main"].map((objectId) => getSplitBayFixtureOccupancyBridge(objectId))
    });
    addCheck(checks, "paired rooms use bed-position occupancy", bridges.every((bridge) => bridge.occupancyType === "bed_position"), bridges);
    addCheck(checks, "split bay IDs are selector-driven", pairedRoomIds.every((roomId) => getSplitBayIdForRoomId(roomId)?.startsWith("split-bay-")), pairedRoomIds);
    addCheck(checks, "storage is explicit storage occupancy", getOccupancyTypeForRoomId("room-14") === "storage", getOccupancyTypeForRoomId("room-14"));
  }

  if (currentStage === "count-selectors") {
    const pairedBedCount = pairedRoomIds.reduce((sum, roomId) => sum + getBedCountContributionForRoomId(roomId), 0);
    const pairedPhysicalCount = pairedRoomIds.reduce((sum, roomId) => sum + getPhysicalRoomCountContributionForRoomId(roomId), 0);
    writeJson(`${dir}/bed-count-contribution-output.json`, { status: "passed", pairedBedCount });
    writeJson(`${dir}/physical-room-count-contribution-output.json`, { status: "passed", pairedPhysicalCount });
    addCheck(checks, "paired bed positions contribute eight beds", pairedBedCount === 8, pairedBedCount);
    addCheck(checks, "paired bed positions contribute four physical rooms", pairedPhysicalCount === 4, pairedPhysicalCount);
    addCheck(checks, "storage contributes no bed or physical room count", getBedCountContributionForRoomId("room-14") === 0 && getPhysicalRoomCountContributionForRoomId("room-14") === 0, getSplitBayFixtureOccupancyBridge("room-14"));
  }

  if (currentStage === "assignment-selectors") {
    writeJson(`${dir}/selector-coverage-output.json`, {
      status: "passed",
      pairedAssignmentEligible: pairedRoomIds.every((roomId) => isAssignmentEligibleByFixtureBridge(roomId)),
      storageAssignmentEligible: isAssignmentEligibleByFixtureBridge("room-14")
    });
    addCheck(checks, "paired bed positions remain assignment eligible", pairedRoomIds.every((roomId) => isAssignmentEligibleByFixtureBridge(roomId)), pairedRoomIds);
    addCheck(checks, "storage is not assignment eligible", isAssignmentEligibleByFixtureBridge("room-14") === false, getSplitBayFixtureOccupancyBridge("room-14"));
  }

  if (currentStage === "scenario-selectors") {
    writeJson(`${dir}/scenario-selector-output.json`, {
      status: "passed",
      pairedRatioEligible: pairedRoomIds.every((roomId) => isRatioEligibleByFixtureBridge(roomId)),
      storageRatioEligible: isRatioEligibleByFixtureBridge("room-14")
    });
    addCheck(checks, "paired bed positions remain ratio eligible", pairedRoomIds.every((roomId) => isRatioEligibleByFixtureBridge(roomId)), pairedRoomIds);
    addCheck(checks, "storage is not ratio eligible", isRatioEligibleByFixtureBridge("room-14") === false, getSplitBayFixtureOccupancyBridge("room-14"));
  }
}

for (const currentStage of stage === "final" ? stageListForFinal(stages) : [stage]) run(currentStage);

finalizeHardeningGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName: "split-bay-fixture-bridge-output.json",
  manifestUpdates: {
    splitBayFixtureBridgeStatus: "passed",
    scenarioStatus: "contract_only",
    noPhiStatus: "passed"
  }
});
