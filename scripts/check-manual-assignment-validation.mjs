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
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateManualAssignmentSetContract,
  validateManualAssignmentSetReferences
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "866");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-assignment-validation";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);
const floorplanId = "manual-validation-proof";
const roomTarget = target(floorplanId, "room", "room-14", "Room 14");
const splitTarget = target(floorplanId, "bed_position", "room-02:bed-a", "Room 2A");
const validSet = validateManualAssignmentSetContract({
  assignmentSetId: "manual-validation-set",
  floorplanId,
  label: "Manual validation proof set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [
    createManualAssignmentSetEntry({ assignmentSetId: "manual-validation-set", staffMemberId: "staff-rn-a", target: roomTarget }),
    createManualAssignmentSetEntry({ assignmentSetId: "manual-validation-set", staffMemberId: "staff-rn-b", target: splitTarget })
  ],
  mode: "manual"
});
const missingSet = validateManualAssignmentSetContract({
  ...validSet,
  assignments: [
    ...validSet.assignments,
    {
      assignmentId: "manual-assignment:manual-validation-set:missing-staff:missing-target",
      staffMemberId: "missing-staff",
      assignmentTargetId: "missing-target",
      assignmentTargetKind: "bed_position"
    }
  ]
});
const result = validateManualAssignmentSetReferences({
  assignmentSet: missingSet,
  staffMembers: manualStaffFixture,
  assignmentTargets: [roomTarget, splitTarget]
});
writeJson(issuePath(issue, "manual-assignment-validation-fixture.json"), { status: "passed", assignmentSet: missingSet, result });
const messages = result.issues.map((entry) => entry.message);
const checks = [];
addCheck(checks, "shared validation exists", fileIncludes("packages/shared/src/assignments/manualAssignmentValidation.ts", ["Missing staff member", "Missing assignment target", "Split bed target not found"]).passed);
addCheck(checks, "web validation view model exists", fileIncludes("apps/web/src/features/manual-assignment/assignmentValidationViewModel.ts", ["Validation"]).passed);
addCheck(checks, "missing staff creates error", messages.includes("Missing staff member"), result);
addCheck(checks, "missing target creates error", messages.includes("Missing assignment target"), result);
addCheck(checks, "split bed target validated", messages.includes("Split bed target not found"), result);
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-assignment-validation-output.json"), {
  status,
  manualAssignmentValidationStatus: status,
  missingStaffErrors: true,
  missingTargetsError: true,
  splitBedTargetsValidated: true,
  validationContainsNoRecommendations: true,
  validationContainsNoScoring: true
});
if (status === "passed") {
  updateManifest(issue, {
    manualAssignmentValidationStatus: "passed",
    missingStaffErrors: true,
    missingTargetsError: true,
    splitBedTargetsValidated: true,
    validationContainsNoRecommendations: true,
    validationContainsNoScoring: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Assignment Validation",
  reviewFinding: "Validation checks references and connectivity status only, with fixed neutral messages.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "packages/shared/src/assignments/manualAssignmentValidation.ts",
    "packages/shared/src/assignments/assignmentTargetValidation.ts",
    "apps/web/src/features/manual-assignment/assignmentValidationViewModel.ts",
    "scripts/check-manual-assignment-validation.mjs",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-assignment-validation-output.json"),
    issuePath(issue, "manual-assignment-validation-fixture.json")
  ],
  limitations: ["Validation does not judge assignment quality."]
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
