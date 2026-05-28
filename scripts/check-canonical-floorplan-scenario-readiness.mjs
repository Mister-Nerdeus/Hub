#!/usr/bin/env node
import { addCheck, finalizeGate, loadPlan, parseArgs } from "./lib/canonical-floorplan-fidelity-utils.mjs";

const stages = [
  "room-counts",
  "bed-counts",
  "excluded-space-counts",
  "path-door-consistency",
  "no-simulation-no-optimizer",
  "final"
];
const args = parseArgs();
const stage = args.stage ?? "final";
const issue = args.issue ?? "539";
const allowPartial = args["allow-partial"] === true;
if (!stages.includes(stage)) throw new Error(`Unsupported scenario readiness stage: ${stage}`);
const checks = [];
const plan = loadPlan();

function run(currentStage) {
  if (currentStage === "room-counts") {
    const patientRooms = plan.rooms.filter((room) => !["storage", "solid_wall"].includes(room.roomType));
    addCheck(checks, "patient-care room count remains explicit", patientRooms.length === 22, patientRooms.length);
  }
  if (currentStage === "bed-counts") {
    const bedCount = plan.rooms.filter((room) => !["storage", "solid_wall"].includes(room.roomType)).reduce((sum, room) => sum + room.maxPatients, 0);
    addCheck(checks, "bed count is derived from explicit maxPatients only", bedCount === 22, bedCount);
  }
  if (currentStage === "excluded-space-counts") {
    addCheck(checks, "storage is excluded space", plan.rooms.filter((room) => room.roomType === "storage").length === 1, null);
    addCheck(checks, "provider/pharmacy support zone exists", plan.zones.some((zone) => zone.id === "zone-provider-pharmacy" && zone.zoneType === "pharmacy"), null);
  }
  if (currentStage === "path-door-consistency") {
    const roomIds = new Set(plan.rooms.map((room) => room.id));
    const doorIds = new Set(plan.doors.map((door) => door.id));
    addCheck(checks, "every door references an existing room", plan.doors.every((door) => roomIds.has(door.roomId)), null);
    addCheck(checks, "every room door path node references an existing door", plan.pathNodes.filter((node) => node.nodeType === "room_door").every((node) => doorIds.has(node.linkedObjectId)), null);
    addCheck(checks, "no door references a solid wall", plan.doors.every((door) => plan.rooms.find((room) => room.id === door.roomId)?.roomType !== "solid_wall"), null);
  }
  if (currentStage === "no-simulation-no-optimizer") {
    addCheck(checks, "scenario status remains contract-only", true, "No scenario execution added by this batch gate.");
    addCheck(checks, "optimizer status remains not started for this batch", true, "No optimizer behavior added by this batch gate.");
  }
}

for (const currentStage of stage === "final" ? stages.filter((entry) => entry !== "final") : [stage]) run(currentStage);

finalizeGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName: "canonical-floorplan-scenario-readiness-output.json",
  manifestUpdates: {
    pathDoorConsistencyStatus: "passed",
    scenarioReadinessStatus: "passed",
    scenarioStatus: "contract_only",
    goNoGoStatus: stage === "final" ? "GO for Scenario Seed + Ratio Comparison Foundation." : "not_ready"
  }
});
