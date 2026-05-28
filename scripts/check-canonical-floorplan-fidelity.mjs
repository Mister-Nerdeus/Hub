#!/usr/bin/env node
import {
  addCheck,
  finalizeGate,
  loadPlan,
  parseArgs,
  readJson,
  readText,
  targetGeometryPath,
  writeGeometryEvidence
} from "./lib/canonical-floorplan-fidelity-utils.mjs";

const stages = [
  "reference-audit",
  "left-trauma-pod",
  "right-pod",
  "far-right-bank",
  "left-side-bank",
  "bottom-bank",
  "provider-pharmacy",
  "nurse-stations",
  "doors-access",
  "hallways",
  "room-bank-alignment",
  "final"
];
const args = parseArgs();
const stage = args.stage ?? "final";
const issue = args.issue ?? "511";
const allowPartial = args["allow-partial"] === true;
if (!stages.includes(stage)) throw new Error(`Unsupported canonical floorplan fidelity stage: ${stage}`);
const checks = [];
const plan = loadPlan();
const target = readJson(targetGeometryPath);

const regionMap = {
  "left-trauma-pod": ["room-level-1-trauma", "room-02", "room-03", "room-04", "room-05", "room-14", "door-01", "door-02", "door-03", "door-04", "door-05", "door-14"],
  "right-pod": ["room-06", "room-07", "room-08", "room-09", "room-10", "room-13", "door-06", "door-07", "door-08", "door-09", "door-10", "door-13"],
  "far-right-bank": ["room-11", "room-12", "door-11", "door-12"],
  "left-side-bank": ["room-15", "room-16", "room-17", "door-15", "door-16", "door-17"],
  "bottom-bank": ["room-19", "room-20", "room-21", "room-22", "room-23", "room-24", "door-18", "door-19", "door-20", "door-21", "door-22", "door-23"],
  "provider-pharmacy": ["zone-provider-pharmacy"],
  "nurse-stations": ["station-left", "station-right"],
  "doors-access": plan.doors.map((door) => door.id),
  hallways: plan.hallways.map((hallway) => hallway.id)
};

function room(id) {
  return plan.rooms.find((candidate) => candidate.id === id);
}

function run(currentStage) {
  if (currentStage === "reference-audit") {
    addCheck(checks, "reference audit document exists", readText("docs/project/canonical-reference-layout-audit.md").includes("Mismatch Inventory"), "canonical-reference-layout-audit.md");
    addCheck(checks, "reference source record exists", readJson("docs/verification/reference/plan-1-reference-source-record.json").canonicalFloorplanId === plan.planId, plan.planId);
  }
  if (currentStage === "room-bank-alignment") {
    const bank = readText("packages/shared/src/floorplans/roomBankContract.ts");
    for (const id of ["left-trauma-pod", "right-pod", "far-right-vertical-bank", "left-side-vertical-bank", "bottom-bank", "provider-pharmacy-support-band"]) {
      addCheck(checks, `room bank ${id} exists`, bank.includes(id), "roomBankContract.ts");
    }
  }
  if (["left-trauma-pod", "right-pod", "far-right-bank", "left-side-bank", "bottom-bank"].includes(currentStage)) {
    for (const id of regionMap[currentStage].filter((id) => id.startsWith("room-"))) {
      const expected = target.rooms[id];
      if (expected == null) continue;
      const actual = room(id);
      addCheck(checks, `${id} matches reference target geometry`, actual?.x === expected.x && actual?.y === expected.y && actual?.widthFeet === expected.widthFeet && actual?.lengthFeet === expected.lengthFeet, { actual, expected });
    }
  }
  if (currentStage === "provider-pharmacy") {
    const zone = plan.zones.find((candidate) => candidate.id === "zone-provider-pharmacy");
    const expected = target.support["zone-provider-pharmacy"];
    addCheck(checks, "provider/pharmacy remains support zone", zone?.zoneType === "pharmacy", zone);
    addCheck(checks, "provider/pharmacy matches target geometry", zone?.x === expected.x && zone?.y === expected.y && zone?.widthFeet === expected.widthFeet && zone?.lengthFeet === expected.lengthFeet, { zone, expected });
  }
  if (currentStage === "nurse-stations") {
    for (const id of ["station-left", "station-right"]) {
      const station = plan.nurseStations.find((candidate) => candidate.id === id);
      const expected = target.support[id];
      addCheck(checks, `${id} matches target geometry`, station?.x === expected.x && station?.y === expected.y && station?.widthFeet === expected.widthFeet && station?.lengthFeet === expected.lengthFeet, { station, expected });
    }
  }
  if (currentStage === "doors-access") {
    for (const door of plan.doors) {
      const owner = room(door.roomId);
      addCheck(checks, `${door.id} references existing non-wall owner`, owner != null && owner.roomType !== "solid_wall", { doorId: door.id, roomId: door.roomId });
    }
  }
  if (currentStage === "hallways") {
    addCheck(checks, "hallway corridor contract exists", readText("packages/shared/src/floorplans/hallwayCorridorContract.ts").includes("pannableBackgroundEligible"), "hallwayCorridorContract.ts");
    addCheck(checks, "canonical hallway count retained", plan.hallways.length >= 7, plan.hallways.length);
    addCheck(checks, "hallway nodes retained", plan.pathNodes.some((node) => node.nodeType === "hallway"), "pathNodes");
  }
}

for (const currentStage of stage === "final" ? stages.filter((entry) => entry !== "final") : [stage]) run(currentStage);
if (regionMap[stage] != null || ["final"].includes(stage)) writeGeometryEvidence(issue, regionMap[stage] ?? null);

finalizeGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName: "canonical-floorplan-fidelity-output.json",
  manifestUpdates: {
    referenceAuditStatus: "passed",
    roomBankGroupingStatus: "passed",
    hallwayReferenceModelStatus: "passed",
    supportAreaModelStatus: "passed",
    referenceAlignmentStatus: stage === "final" ? "passed" : "in_progress"
  }
});
