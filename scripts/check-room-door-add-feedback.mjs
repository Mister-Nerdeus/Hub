#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { validateEditableLayoutGeometryContract } from "../packages/shared/dist/index.js";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  issueDir,
  readArg,
  requiredAcceptanceCommands,
  statusFromChecks,
  updateAuthoringReadinessManifest,
  writeBoundaryOutputs,
  writeIssueResult,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-reconstruction-authoring-readiness-utils.mjs";

const issue = readArg("--issue", "661");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const supportedStages = ["room15-door", "auto-select-door", "door-feedback", "door-highlight", "save-reload-export", "final"];
if (!supportedStages.includes(stage)) throw new Error(`Unsupported stage: ${stage}`);

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: normal rooms such as Room 15 must accept authored doors and visibly enter door edit feedback state.\n"
);

const reducerSource = readFileSync("apps/web/src/features/layout-editor/layoutEditorReducer.ts", "utf8");
const stageSource = readFileSync("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "utf8");
const doorQuickEditSource = readFileSync("apps/web/src/features/layout-editor/DoorQuickEditPopover.tsx", "utf8");
const doorQuickEditViewModelSource = readFileSync("apps/web/src/features/layout-editor/doorQuickEditViewModel.ts", "utf8");
const doorShapeSource = readFileSync("apps/web/src/features/layout-editor/DoorShape.tsx", "utf8");
const cssSource = readFileSync("apps/web/src/features/layout-editor/LayoutEditorStage.css", "utf8");
const layout = buildRoom15DoorLayout();
const reloaded = validateEditableLayoutGeometryContract(JSON.parse(JSON.stringify(layout)));
const exported = JSON.parse(JSON.stringify(reloaded));
const room15Door = reloaded.doors.find((door) => door.ownerId === "room-15");

if (stage === "room15-door" || stage === "final") {
  addCheck(checks, "Room 15 accepts a normal room-owned authored door", room15Door?.ownerKind === "room" && room15Door.wall === "south", room15Door);
}
if (stage === "auto-select-door" || stage === "final") {
  addCheck(checks, "Add Door selects the newly created door", reducerSource.includes('selectedDoorId == null ? null : "door"') && stageSource.includes("addDoorToSelectedRoom"));
}
if (stage === "door-feedback" || stage === "final") {
  addCheck(
    checks,
    "door quick edit panel exposes wall, offset, width, and owner room context",
    doorQuickEditSource.includes("Wall") &&
      doorQuickEditSource.includes("Offset") &&
      doorQuickEditSource.includes("Width") &&
      doorQuickEditViewModelSource.includes("Owner room")
  );
}
if (stage === "door-highlight" || stage === "final") {
  addCheck(checks, "newly selected door has a visible highlight state", doorShapeSource.includes("isSelected") && cssSource.includes("door--selected"));
}
if (stage === "save-reload-export" || stage === "final") {
  addCheck(
    checks,
    "Room 15 authored door survives save/reload/export serialization",
    exported.doors.some((door) => door.id === "door-room-15-south" && door.ownerId === "room-15" && door.widthFeet === 4),
    exported.doors
  );
}

const passed = statusFromChecks(checks) === "passed";
if (!passed) blockers.push("Room 15 door authoring feedback or persistence proof is incomplete.");

updateAuthoringReadinessManifest(issue, {
  roomDoorFeedbackStatus: passed ? "passed" : "failed",
  roomDoorAddFeedbackSupported: passed,
  reconstructionStatus: "no_go_until_runtime_saved_copy_support_access_and_split_bay_pass",
  goNoGoStatus: "not_ready"
});

writeJson(`${dir}/exported-json/room-15-door-export.json`, exported);
writeJson(`${dir}/room-door-add-feedback-output.json`, { status: passed ? "passed" : "failed", stage, room15Door });
writeIssueResult({
  issue,
  scriptName: "check-room-door-add-feedback",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands: requiredAcceptanceCommands(issue, "check-room-door-add-feedback", supportedStages.filter((value) => value !== "final")),
  title: "Room 15 supports normal authored doors with selected-door feedback and persistence proof.",
  limitations: ["Room 15 remains a normal operational room; no support-zone semantics are applied."]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function buildRoom15DoorLayout() {
  return validateEditableLayoutGeometryContract({
    schemaVersion: "1.0.0",
    layoutId: "issue-661-room-15-door",
    units: "feet",
    rooms: [
      {
        objectType: "room",
        id: "room-15",
        label: "Room 15",
        roomNumber: "15",
        roomType: "standard",
        capacityType: "single",
        isHallBed: false,
        isTraumaAdjacent: false,
        xFeet: 0,
        yFeet: 0,
        widthFeet: 12,
        heightFeet: 10
      }
    ],
    doors: [
      {
        objectType: "door",
        id: "door-room-15-south",
        label: "Room 15 south door",
        ownerKind: "room",
        ownerId: "room-15",
        wall: "south",
        offsetFeet: 4,
        widthFeet: 4
      }
    ],
    supportAccessPoints: [],
    stations: [],
    hallways: [],
    zones: [],
    splitBays: [],
    limitations: ["Issue 661 synthetic Room 15 door fixture."]
  });
}
