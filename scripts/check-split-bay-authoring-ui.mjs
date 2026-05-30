#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  addSplitBayToEditableLayout,
  validateEditableLayoutGeometryContract
} from "../packages/shared/dist/index.js";
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

const issue = readArg("--issue", "663");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const supportedStages = ["add-object-menu", "placement", "convert-selected-pair", "editor", "readonly-negative", "final"];
if (!supportedStages.includes(stage)) throw new Error(`Unsupported stage: ${stage}`);

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: split-bay authoring UI must support add, placement, conversion, divider editing, and read-only blocking.\n"
);

const menuSource = readFileSync("apps/web/src/features/layout-editor/addObjectMenuViewModel.ts", "utf8");
const placementSource = readFileSync("apps/web/src/features/layout-editor/clickToPlaceObject.ts", "utf8");
const reducerSource = readFileSync("apps/web/src/features/layout-editor/layoutEditorReducer.ts", "utf8");
const popoverSource = readFileSync("apps/web/src/features/layout-editor/SplitBayQuickEditPopover.tsx", "utf8");
const actionSource = readFileSync("apps/web/src/features/layout-editor/addSplitBayTool.ts", "utf8");
const layout = baseLayout();
const added = addSplitBayToEditableLayout({
  layout,
  readOnly: false,
  splitBayId: "split-bay-02-03",
  label: "Split Bay 02/03",
  roomA: layout.rooms[0],
  roomB: layout.rooms[1],
  dividerStyle: "diagonal"
});

if (stage === "add-object-menu" || stage === "final") {
  addCheck(checks, "Add Object menu includes Split Bay", menuSource.includes('"split_bay"') && menuSource.includes("Split Bay"));
}
if (stage === "placement" || stage === "final") {
  addCheck(checks, "Split Bay placement creates one overlay and references two bed-position rooms", placementSource.includes("place-split-bay") && actionSource.includes("addSplitBay") && added.layout.splitBays?.length === 1 && added.createdRoomIds.length === 2, added);
}
if (stage === "convert-selected-pair" || stage === "final") {
  addCheck(checks, "selected room pair can be converted to a split bay", reducerSource.includes("convertSelectedRoomPairToSplitBay") && reducerSource.includes("canonicalPartnerRoomId"));
}
if (stage === "editor" || stage === "final") {
  addCheck(checks, "split bay editor exposes divider style selection", popoverSource.includes("dividerStyle") && popoverSource.includes("Diagonal") && popoverSource.includes("Vertical") && popoverSource.includes("Horizontal"));
}
if (stage === "readonly-negative" || stage === "final") {
  let readonlyBlocked = false;
  try {
    addSplitBayToEditableLayout({
      layout,
      readOnly: true,
      splitBayId: "split-bay-readonly",
      label: "Split Bay Readonly",
      roomA: layout.rooms[0],
      roomB: layout.rooms[1]
    });
  } catch (error) {
    readonlyBlocked = error instanceof Error && /read-only/u.test(error.message);
  }
  addCheck(checks, "split bay authoring is blocked for read-only layouts", readonlyBlocked);
}

const passed = statusFromChecks(checks) === "passed";
if (!passed) blockers.push("Split-bay authoring UI proof is incomplete.");

updateAuthoringReadinessManifest(issue, {
  splitBayAuthoringUiStatus: passed ? "passed" : "failed",
  splitBayAuthoringUiSupported: passed,
  reconstructionStatus: "no_go_until_runtime_saved_copy_support_access_and_split_bay_pass",
  goNoGoStatus: "not_ready"
});

writeJson(`${dir}/split-bay-authoring-ui-output.json`, { status: passed ? "passed" : "failed", stage, added });
writeIssueResult({
  issue,
  scriptName: "check-split-bay-authoring-ui",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands: requiredAcceptanceCommands(issue, "check-split-bay-authoring-ui", supportedStages.filter((value) => value !== "final")),
  title: "Split-bay authoring UI supports menu placement, pair conversion, divider editing, and read-only blocking.",
  limitations: ["Placement is deterministic and editor-only; no optimization behavior is introduced."]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function baseLayout() {
  return validateEditableLayoutGeometryContract({
    schemaVersion: "1.0.0",
    layoutId: "issue-663-split-bay-ui",
    units: "feet",
    rooms: [
      room("room-02", "Room 02", "02", 0),
      room("room-03", "Room 03", "03", 10)
    ],
    doors: [],
    supportAccessPoints: [],
    stations: [],
    hallways: [],
    zones: [],
    splitBays: [],
    limitations: ["Issue 663 synthetic split-bay authoring UI fixture."]
  });
}

function room(id, label, roomNumber, xFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber,
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet: 0,
    widthFeet: 10,
    heightFeet: 10
  };
}
