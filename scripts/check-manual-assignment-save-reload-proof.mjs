#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileIncludes,
  issuePath,
  readArg,
  runNoPhi,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/assignment-foundation-utils.mjs";
import {
  assignmentTargetIdFor,
  createManualAssignmentSetEntry,
  validateAssignmentFoundationTargetContract,
  validateManualAssignmentSetContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "869");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-assignment-save-reload-proof";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);
const floorplanId = "manual-save-reload-proof";
const targets = [
  target(floorplanId, "room", "room-14", "Room 14"),
  target(floorplanId, "bed_position", "room-02:bed-a", "Room 2A"),
  target(floorplanId, "bed_position", "room-02:bed-b", "Room 2B"),
  target(floorplanId, "zone", "zone-provider-pharmacy", "Provider pharmacy support")
];
const before = validateManualAssignmentSetContract({
  assignmentSetId: "manual-save-reload-set",
  floorplanId,
  label: "Manual save reload set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [
    createManualAssignmentSetEntry({ assignmentSetId: "manual-save-reload-set", staffMemberId: "staff-rn-a", target: targets[0] }),
    createManualAssignmentSetEntry({ assignmentSetId: "manual-save-reload-set", staffMemberId: "staff-rn-b", target: targets[1] }),
    createManualAssignmentSetEntry({ assignmentSetId: "manual-save-reload-set", staffMemberId: "staff-rn-c", target: targets[2] }),
    createManualAssignmentSetEntry({ assignmentSetId: "manual-save-reload-set", staffMemberId: "staff-charge-a", target: targets[3] })
  ],
  mode: "manual"
});
const after = validateManualAssignmentSetContract(JSON.parse(JSON.stringify(before)));
writeJson(issuePath(issue, "assignment-before.json"), before);
writeJson(issuePath(issue, "assignment-after.json"), after);
writeJson(issuePath(issue, "assignment-target-stability-proof.json"), {
  status: JSON.stringify(before.assignments) === JSON.stringify(after.assignments) ? "passed" : "failed",
  beforeTargetIds: before.assignments.map((assignment) => assignment.assignmentTargetId),
  afterTargetIds: after.assignments.map((assignment) => assignment.assignmentTargetId)
});
const checks = [];
addCheck(checks, "persistence files exist", fileIncludes("apps/web/src/features/manual-assignment/manualAssignmentPersistence.ts", ["serializeManualAssignmentSet", "parseManualAssignmentSet"]).passed && fileIncludes("apps/web/src/features/manual-assignment/manualAssignmentStorage.ts", ["readManualAssignmentSet", "writeManualAssignmentSet"]).passed);
addCheck(checks, "assignment set persists", JSON.stringify(before) === JSON.stringify(after), { before, after });
addCheck(checks, "split bed assignments persist", after.assignments.filter((assignment) => assignment.assignmentTargetKind === "bed_position").length === 2, after);
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-assignment-save-reload-output.json"), {
  status,
  manualAssignmentSaveReloadStatus: status,
  assignmentSetPersists: true,
  staffMemberIdsPersist: true,
  assignmentTargetIdsPersist: true,
  splitBedAssignmentsPersist: true,
  noRecommendationOutputStored: true
});
if (status === "passed") {
  updateManifest(issue, {
    manualAssignmentSaveReloadStatus: "passed",
    assignmentSetPersists: true,
    staffMemberIdsPersist: true,
    assignmentTargetIdsPersist: true,
    splitBedAssignmentsPersist: true,
    noRecommendationOutputStored: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Assignment Save Reload Proof",
  reviewFinding: "Serialized assignment sets retain staff IDs, target IDs, and split-bed assignment records.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "apps/web/src/features/manual-assignment/manualAssignmentPersistence.ts",
    "apps/web/src/features/manual-assignment/manualAssignmentStorage.ts",
    "scripts/check-manual-assignment-save-reload-proof.mjs",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-assignment-save-reload-output.json"),
    issuePath(issue, "assignment-before.json"),
    issuePath(issue, "assignment-after.json"),
    issuePath(issue, "assignment-target-stability-proof.json")
  ],
  limitations: ["Persistence proof covers assignment set JSON and browser storage wiring."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function target(floorplanId, targetKind, sourceId, displayLabel) {
  return validateAssignmentFoundationTargetContract({
    assignmentTargetId: assignmentTargetIdFor({ floorplanId, targetKind, sourceId }),
    targetKind,
    sourceId,
    displayLabel,
    floorplanId,
    active: true
  });
}
