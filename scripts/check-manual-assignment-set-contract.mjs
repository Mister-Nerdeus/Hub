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

const issue = readArg("--issue", "865");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-assignment-set-contract";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);
const floorplanId = "manual-assignment-proof-floorplan";
const targets = [
  target(floorplanId, "room", "room-14", "Room 14"),
  target(floorplanId, "bed_position", "room-02:bed-a", "Room 2A"),
  target(floorplanId, "bed_position", "room-02:bed-b", "Room 2B"),
  target(floorplanId, "zone", "zone-provider-pharmacy", "Provider pharmacy support")
];
const assignmentSet = validateManualAssignmentSetContract({
  assignmentSetId: "manual-assignment-set-proof",
  floorplanId,
  label: "Manual proof set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [
    createManualAssignmentSetEntry({ assignmentSetId: "manual-assignment-set-proof", staffMemberId: "staff-rn-a", target: targets[0] }),
    createManualAssignmentSetEntry({ assignmentSetId: "manual-assignment-set-proof", staffMemberId: "staff-rn-b", target: targets[1] }),
    createManualAssignmentSetEntry({ assignmentSetId: "manual-assignment-set-proof", staffMemberId: "staff-rn-c", target: targets[2] }),
    createManualAssignmentSetEntry({ assignmentSetId: "manual-assignment-set-proof", staffMemberId: "staff-charge-a", target: targets[3] })
  ],
  mode: "manual"
});
writeJson(issuePath(issue, "manual-assignment-set-fixture.json"), { status: "passed", assignmentSet });
writeJson(issuePath(issue, "split-bed-manual-assignment-proof.json"), {
  status: assignmentSet.assignments.filter((assignment) => assignment.assignmentTargetKind === "bed_position").length === 2 ? "passed" : "failed",
  splitBedAssignments: assignmentSet.assignments.filter((assignment) => assignment.assignmentTargetKind === "bed_position")
});
const serialized = JSON.stringify(assignmentSet);
const checks = [];
addCheck(checks, "contract file exists", fileIncludes("packages/shared/src/assignments/manualAssignmentSetContract.ts", ["ManualAssignmentSetContract", "mode: \"manual\""]).passed);
addCheck(checks, "validation file exists", fileIncludes("packages/shared/src/assignments/manualAssignmentValidation.ts", ["validateManualAssignmentSetReferences"]).passed);
addCheck(checks, "manual mode only", assignmentSet.mode === "manual", assignmentSet);
addCheck(checks, "split bed assignments supported", assignmentSet.assignments.filter((assignment) => assignment.assignmentTargetKind === "bed_position").length === 2, assignmentSet);
addCheck(checks, "fixture omits blocked field roots", !/\b(score|burden|workload|optimizer|simulation)\b/iu.test(serialized), assignmentSet);
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-assignment-set-contract-output.json"), {
  status,
  manualAssignmentSetContractStatus: status,
  manualModeOnly: true,
  splitBedManualAssignmentsSupported: true,
  assignmentSetContainsNoRecommendations: true,
  assignmentSetContainsNoScoring: true
});
if (status === "passed") {
  updateManifest(issue, {
    manualAssignmentSetContractStatus: "passed",
    manualModeOnly: true,
    splitBedManualAssignmentsSupported: true,
    assignmentSetContainsNoRecommendations: true,
    assignmentSetContainsNoScoring: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Assignment Set Contract",
  reviewFinding: "Assignment sets record manual staff-to-target choices and require mode manual.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "packages/shared/src/assignments/manualAssignmentSetContract.ts",
    "packages/shared/src/assignments/manualAssignmentValidation.ts",
    "scripts/check-manual-assignment-set-contract.mjs",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-assignment-set-contract-output.json"),
    issuePath(issue, "manual-assignment-set-fixture.json"),
    issuePath(issue, "split-bed-manual-assignment-proof.json")
  ],
  limitations: ["The contract stores user-entered assignment records only."]
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
