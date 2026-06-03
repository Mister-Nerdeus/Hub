#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
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
} from "./lib/manual-scenario-foundation-utils.mjs";
import {
  DEFAULT_CO_ASSIGNMENT_POLICY,
  assignmentTargetIdFor,
  createManualAssignmentSetEntry,
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateCoAssignmentPolicyContract,
  validateManualAssignmentSetContract,
  validateManualAssignmentSetReferences
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "880");
const stage = readArg("--stage", "final");
const scriptName = "check-co-assignment-policy-contract";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-manual-assignment-validation.mjs --stage final --issue 880",
  "node scripts/check-manual-assignment-overlay.mjs --stage final --issue 880",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const floorplanId = "co-assignment-policy-script-proof";
const roomTarget = target(floorplanId, "room", "room-14", "Room 14");
const bedTarget = target(floorplanId, "bed_position", "room-02:bed-a", "Room 2A");
const zoneTarget = target(floorplanId, "zone", "zone-fast-track", "Zone Fast Track");
const supportTarget = target(floorplanId, "support_area", "support-team-room", "Support Team Room");
const policy = validateCoAssignmentPolicyContract(DEFAULT_CO_ASSIGNMENT_POLICY);
const roomValidation = validateManualAssignmentSetReferences({
  assignmentSet: assignmentSet(floorplanId, [
    assignment("staff-rn-a", roomTarget),
    assignment("staff-rn-b", roomTarget)
  ]),
  staffMembers: manualStaffFixture,
  assignmentTargets: [roomTarget, bedTarget, zoneTarget, supportTarget],
  coAssignmentPolicy: policy
});
const bedValidation = validateManualAssignmentSetReferences({
  assignmentSet: assignmentSet(floorplanId, [
    assignment("staff-rn-a", bedTarget),
    assignment("staff-rn-b", bedTarget)
  ]),
  staffMembers: manualStaffFixture,
  assignmentTargets: [roomTarget, bedTarget, zoneTarget, supportTarget],
  coAssignmentPolicy: policy
});
const supportValidation = validateManualAssignmentSetReferences({
  assignmentSet: assignmentSet(floorplanId, [
    assignment("staff-rn-a", supportTarget),
    assignment("staff-rn-b", supportTarget),
    assignment("staff-rn-c", zoneTarget),
    assignment("staff-charge-a", zoneTarget)
  ]),
  staffMembers: manualStaffFixture,
  assignmentTargets: [roomTarget, bedTarget, zoneTarget, supportTarget],
  coAssignmentPolicy: policy
});
const validationProof = {
  status: roomValidation.issues.some((entry) => entry.code === "multiple_staff_on_restricted_target") &&
    bedValidation.issues.some((entry) => entry.code === "multiple_staff_on_restricted_target") &&
    !supportValidation.issues.some((entry) => entry.code === "multiple_staff_on_restricted_target")
    ? "passed"
    : "failed",
  roomValidation,
  bedValidation,
  supportValidation
};
const overlayProof = {
  status: fileIncludes("apps/web/src/features/manual-assignment/AssignmentOverlay.tsx", [
    "assignments.push(assignment)",
    "staffLabels={staffLabels}"
  ]).passed && fileIncludes("apps/web/src/features/manual-assignment/AssignmentBadge.tsx", [
    "data-manual-assignment-staff-count",
    "<title>{fullText}</title>"
  ]).passed ? "passed" : "failed",
  overlayGroupsAssignmentsByTarget: true,
  badgeShowsAdditionalStaffCount: true
};
writeJson(issuePath(issue, "co-assignment-validation-proof.json"), validationProof);
writeJson(issuePath(issue, "co-assignment-overlay-proof.json"), overlayProof);

const blocked = [
  "overstaffed",
  "understaffed",
  "unsafe",
  "safer",
  "balanced workload",
  "better coverage",
  "recommended",
  "optimized"
];
const scannedFiles = [
  "packages/shared/src/assignments/coAssignmentPolicyContract.ts",
  "packages/shared/src/assignments/manualAssignmentValidation.ts",
  "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
  "apps/web/src/features/manual-assignment/AssignmentBadge.tsx"
];

const checks = [];
addCheck(checks, "co-assignment policy contract exists", fileIncludes(
  "packages/shared/src/assignments/coAssignmentPolicyContract.ts",
  [
    "CoAssignmentPolicyMode",
    "single_primary_per_patient_target",
    "allow_multiple_manual_staff",
    "DEFAULT_CO_ASSIGNMENT_POLICY",
    "allowMultipleForTargetKinds",
    "warningOnly"
  ]
).passed);
addCheck(checks, "manual assignment validation uses explicit policy", fileIncludes(
  "packages/shared/src/assignments/manualAssignmentValidation.ts",
  ["DEFAULT_CO_ASSIGNMENT_POLICY", "coAssignmentPolicyAllowsMultipleStaff", "Multiple staff assigned to target"]
).passed);
addCheck(checks, "shared regression test covers room bed support and zone", fileIncludes(
  "packages/shared/tests/co-assignment-policy-contract.test.mjs",
  ["multiple staff on patient-care targets", "configured support or zone targets", "configured as blocking"]
).passed);
addCheck(checks, "validation proof matches default policy", validationProof.status === "passed", validationProof);
addCheck(checks, "overlay still displays multiple staff visibly", overlayProof.status === "passed", overlayProof);
addCheck(checks, "policy docs are updated", fileIncludes(
  "docs/project/assignment-foundation-status.md",
  ["shared co-assignment policy contract", "Patient-room, hall-bed, and split-bed targets default"]
).passed && fileIncludes(
  "docs/project/manual-scenario-foundation-status.md",
  ["Co-assignment policy remains part of manual assignment validation"]
).passed);
addCheck(checks, "blocked co-assignment copy absent", scannedFiles.every((file) => fileExcludes(file, blocked).passed), blocked);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "co-assignment-policy-contract-output.json"), {
  status,
  coAssignmentPolicyContractStatus: status,
  coAssignmentPolicyExplicit: status === "passed",
  patientTargetMultiStaffValidated: status === "passed",
  supportTargetMultiStaffPolicySupported: status === "passed",
  coAssignmentContainsNoRecommendations: status === "passed",
  coAssignmentContainsNoScoring: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    coAssignmentPolicyContractStatus: "passed",
    coAssignmentPolicyExplicit: true,
    patientTargetMultiStaffValidated: true,
    supportTargetMultiStaffPolicySupported: true,
    coAssignmentContainsNoRecommendations: true,
    coAssignmentContainsNoScoring: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Co-Assignment Policy Contract",
  reviewFinding: "Manual assignment validation now uses an explicit co-assignment policy contract instead of hardcoded patient-target behavior.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "packages/shared/src/assignments/coAssignmentPolicyContract.ts",
    "packages/shared/src/assignments/manualAssignmentValidation.ts",
    "packages/shared/src/index.ts",
    "packages/shared/tests/co-assignment-policy-contract.test.mjs",
    "docs/project/assignment-foundation-status.md",
    "docs/project/manual-scenario-foundation-status.md",
    "scripts/check-co-assignment-policy-contract.mjs",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "co-assignment-policy-contract-output.json"),
    issuePath(issue, "co-assignment-validation-proof.json"),
    issuePath(issue, "co-assignment-overlay-proof.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["The policy validates manual co-assignment state only; it does not rank or evaluate assignments."]
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

function assignment(staffMemberId, target) {
  return createManualAssignmentSetEntry({
    assignmentSetId: "co-assignment-policy-set",
    staffMemberId,
    target
  });
}

function assignmentSet(floorplanId, assignments) {
  return validateManualAssignmentSetContract({
    assignmentSetId: "co-assignment-policy-set",
    floorplanId,
    label: "Manual co-assignment policy proof",
    createdAtIso: "2026-06-01T00:00:00.000Z",
    updatedAtIso: "2026-06-01T00:00:00.000Z",
    assignments,
    mode: "manual"
  });
}
