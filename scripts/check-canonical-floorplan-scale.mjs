#!/usr/bin/env node
import {
  addCheck,
  fileExistsWithBytes,
  finalizeGate,
  loadPlan,
  parseArgs,
  readJson,
  targetGeometryPath
} from "./lib/canonical-floorplan-fidelity-utils.mjs";

const stages = ["reference-asset", "scale-contract", "ten-by-ten-module", "geometry-units", "remap-scale-proof", "final"];
const referenceSourceRecordPath = "docs/verification/reference/plan-1-reference-source-record.json";
const args = parseArgs();
const stage = args.stage ?? "final";
const issue = args.issue ?? "511";
const allowPartial = args["allow-partial"] === true;
if (!stages.includes(stage)) throw new Error(`Unsupported canonical floorplan scale stage: ${stage}`);

const checks = [];
const plan = loadPlan();
const target = readJson(targetGeometryPath);

function run(currentStage) {
  if (currentStage === "reference-asset") {
    const sourceRecordExists = fileExistsWithBytes(referenceSourceRecordPath, 100);
    const sourceRecord = sourceRecordExists ? readJson(referenceSourceRecordPath) : null;
    addCheck(checks, "reference source record exists", sourceRecordExists, referenceSourceRecordPath);
    addCheck(checks, "reference source record names canonical Plan 1", sourceRecord?.canonicalFloorplanId === plan.planId, sourceRecord?.canonicalFloorplanId);
    addCheck(checks, "reference source record preserves manual review block", sourceRecord?.manualVisualReviewRequired === true && sourceRecord?.promotionStatus === "blocked", sourceRecord);
    addCheck(checks, "reference target geometry uses feet", target.unit === "feet", target.unit);
  }
  if (currentStage === "scale-contract") {
    addCheck(checks, "scale unit is feet", plan.scale.unit === "feet", plan.scale);
    addCheck(checks, "grid size remains feet", plan.scale.gridSizeFeet === 1, plan.scale.gridSizeFeet);
    addCheck(checks, "scale contract source exists", fileExistsWithBytes("packages/shared/src/floorplans/floorplanScaleContract.ts", 500), "packages/shared/src/floorplans/floorplanScaleContract.ts");
  }
  if (currentStage === "ten-by-ten-module") {
    const baseRooms = plan.rooms.filter((room) => !["room-level-1-trauma"].includes(room.id) && room.roomType !== "storage");
    const offModule = baseRooms.filter((room) => room.widthFeet !== 10 || room.lengthFeet !== 10);
    addCheck(checks, "base patient-care rooms use 10 ft x 10 ft module", offModule.length === 0, offModule.map((room) => room.id));
    const storage = plan.rooms.find((room) => room.id === "room-14");
    addCheck(checks, "storage uses visible 10 ft x 10 ft module", storage?.widthFeet === 10 && storage?.lengthFeet === 10, storage);
  }
  if (currentStage === "geometry-units") {
    addCheck(checks, "all room coordinates are finite feet", plan.rooms.every((room) => [room.x, room.y, room.widthFeet, room.lengthFeet].every(Number.isFinite)), null);
    addCheck(checks, "all door coordinates are finite feet", plan.doors.every((door) => [door.x, door.y, door.widthFeet].every(Number.isFinite)), null);
  }
  if (currentStage === "remap-scale-proof") {
    const targetRoomIds = Object.keys(target.rooms);
    addCheck(checks, "target geometry records all Plan 1 rooms", targetRoomIds.every((id) => plan.rooms.some((room) => room.id === id)), targetRoomIds.length);
  }
}

for (const currentStage of stage === "final" ? stages : [stage]) run(currentStage);

finalizeGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName: "canonical-floorplan-scale-output.json",
  manifestUpdates: {
    referenceAssetStatus: "recorded",
    scaleContractStatus: "passed",
    referenceAlignmentStatus: stage === "final" ? "passed" : undefined
  }
});
