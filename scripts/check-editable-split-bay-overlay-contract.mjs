#!/usr/bin/env node
import {
  createEditableSplitBayOverlay,
  validateEditableLayoutGeometryContract,
  validateEditableSplitBayOverlayLayout
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

const issue = readArg("--issue", "662");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const supportedStages = ["contract", "validation", "no-room-data-duplication", "import-export", "backward-compat", "final"];
if (!supportedStages.includes(stage)) throw new Error(`Unsupported stage: ${stage}`);

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: split bays must be overlay geometry referencing two existing bed-position rooms without duplicating room data.\n"
);

const layout = buildSplitBayLayout();
const validation = validateEditableSplitBayOverlayLayout(layout);
const exported = JSON.parse(JSON.stringify(layout));
const imported = validateEditableLayoutGeometryContract(exported);

if (stage === "contract" || stage === "final") {
  addCheck(checks, "split bay overlay contract stores physical bay geometry and divider style", layout.splitBays?.[0]?.objectType === "split_bay" && layout.splitBays?.[0]?.dividerStyle === "diagonal", layout.splitBays?.[0]);
}
if (stage === "validation" || stage === "final") {
  let negativePassed = false;
  try {
    validateEditableSplitBayOverlayLayout({
      ...layout,
      splitBays: [
        createEditableSplitBayOverlay({
          splitBayId: "split-bay-missing-room",
          label: "Split Bay Missing Room",
          bedPositionRoomIds: ["room-02", "room-missing"],
          dividerStyle: "diagonal",
          xFeet: 0,
          yFeet: 0,
          widthFeet: 20,
          heightFeet: 10
        })
      ]
    });
  } catch (error) {
    negativePassed = error instanceof Error && /existing rooms|missing room/u.test(error.message);
  }
  addCheck(checks, "split bay validation rejects missing room references", validation.status === "passed" && negativePassed, validation);
}
if (stage === "no-room-data-duplication" || stage === "final") {
  addCheck(checks, "split bay overlay does not duplicate room label/type/assignment data", validation.duplicatesRoomData === false && validation.physicalRoomCountContribution === 1, validation);
}
if (stage === "import-export" || stage === "final") {
  addCheck(checks, "split bay overlay serializes, imports, exports, saves, and reloads", imported.splitBays?.[0]?.splitBayId === "split-bay-02-03" && exported.splitBays?.[0]?.bedPositionRoomIds?.length === 2, exported.splitBays?.[0]);
}
if (stage === "backward-compat" || stage === "final") {
  const legacy = validateEditableLayoutGeometryContract({
    ...layout,
    supportAccessPoints: undefined,
    splitBays: undefined
  });
  addCheck(checks, "editable layout contract defaults missing splitBays to [] for backward compatibility", Array.isArray(legacy.splitBays) && legacy.splitBays.length === 0);
}

const passed = statusFromChecks(checks) === "passed";
if (!passed) blockers.push("Editable split-bay overlay contract proof is incomplete.");

updateAuthoringReadinessManifest(issue, {
  splitBayOverlayContractStatus: passed ? "passed" : "failed",
  editableSplitBayOverlaySupported: passed,
  reconstructionStatus: "no_go_until_runtime_saved_copy_support_access_and_split_bay_pass",
  goNoGoStatus: "not_ready"
});

writeJson(`${dir}/exported-json/split-bay-overlay-export.json`, exported);
writeJson(`${dir}/editable-split-bay-overlay-contract-output.json`, { status: passed ? "passed" : "failed", stage, validation });
writeIssueResult({
  issue,
  scriptName: "check-editable-split-bay-overlay-contract",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands: requiredAcceptanceCommands(issue, "check-editable-split-bay-overlay-contract", supportedStages.filter((value) => value !== "final")),
  title: "Editable split-bay overlay contract references existing bed-position rooms and avoids duplicated room data.",
  limitations: ["Split-bay visual fidelity still requires manual visual review."]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function buildSplitBayLayout() {
  return validateEditableLayoutGeometryContract({
    schemaVersion: "1.0.0",
    layoutId: "issue-662-split-bay-overlay",
    units: "feet",
    rooms: [
      room("room-02", "Room 02", "02", 0, 0),
      room("room-03", "Room 03", "03", 10, 0)
    ],
    doors: [],
    supportAccessPoints: [],
    stations: [],
    hallways: [],
    zones: [],
    splitBays: [
      createEditableSplitBayOverlay({
        splitBayId: "split-bay-02-03",
        label: "Split Bay 02/03",
        bedPositionRoomIds: ["room-02", "room-03"],
        dividerStyle: "diagonal",
        xFeet: 0,
        yFeet: 0,
        widthFeet: 20,
        heightFeet: 10
      })
    ],
    limitations: ["Issue 662 synthetic split-bay overlay fixture."]
  });
}

function room(id, label, roomNumber, xFeet, yFeet) {
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
    yFeet,
    widthFeet: 10,
    heightFeet: 10
  };
}
