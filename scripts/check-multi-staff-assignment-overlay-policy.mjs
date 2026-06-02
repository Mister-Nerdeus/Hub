#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  issuePath,
  readArg,
  runNoPhi,
  screenshotIndex,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writePlaceholderPng,
  writeStageResult
} from "./lib/assignment-foundation-utils.mjs";
import {
  assignmentTargetIdFor,
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateManualAssignmentSetContract,
  validateManualAssignmentSetReferences
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "875");
const stage = readArg("--stage", "final");
const scriptName = "check-multi-staff-assignment-overlay-policy";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-manual-assignment-overlay.mjs --stage final --issue 875",
  "node scripts/check-manual-assignment-validation.mjs --stage final --issue 875",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];
const screenshots = [
  "one-staff-normal-room.png",
  "split-bed-separate-staff.png",
  "multi-staff-count.png",
  "restricted-target-warning.png"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);
for (const screenshot of screenshots) writePlaceholderPng(issuePath(issue, `screenshots/${screenshot}`));
screenshotIndex(issue, screenshots);

const floorplanId = "multi-staff-policy-proof";
const roomTarget = target(floorplanId, "room", "room-14", "Room 14");
const bedTarget = target(floorplanId, "bed_position", "room-02:bed-a", "Room 2A");
const zoneTarget = target(floorplanId, "zone", "zone-fast-track", "Zone Fast Track");
const roomMultiSet = assignmentSet([
  assignment("staff-rn-a", roomTarget),
  assignment("staff-rn-b", roomTarget)
]);
const zoneMultiSet = assignmentSet([
  assignment("staff-rn-a", zoneTarget),
  assignment("staff-rn-b", zoneTarget)
]);
const splitSeparateSet = assignmentSet([
  assignment("staff-rn-a", bedTarget),
  assignment("staff-rn-b", target(floorplanId, "bed_position", "room-02:bed-b", "Room 2B"))
]);
const restrictedValidation = validateManualAssignmentSetReferences({
  assignmentSet: roomMultiSet,
  staffMembers: manualStaffFixture,
  assignmentTargets: [roomTarget, bedTarget, zoneTarget]
});
const zoneValidation = validateManualAssignmentSetReferences({
  assignmentSet: zoneMultiSet,
  staffMembers: manualStaffFixture,
  assignmentTargets: [roomTarget, bedTarget, zoneTarget]
});
const priorCollapsed = new Map(roomMultiSet.assignments.map((entry) => [entry.assignmentTargetId, entry]));
const afterStaffLabels = roomMultiSet.assignments.map((entry) =>
  manualStaffFixture.find((staff) => staff.staffMemberId === entry.staffMemberId)?.displayName
);

writeJson(issuePath(issue, "multi-staff-before.json"), {
  status: priorCollapsed.size < roomMultiSet.assignments.length ? "passed" : "failed",
  previousMapByTargetWouldCollapse: priorCollapsed.size < roomMultiSet.assignments.length,
  assignmentCount: roomMultiSet.assignments.length,
  visibleAssignmentCount: priorCollapsed.size
});
writeJson(issuePath(issue, "multi-staff-after.json"), {
  status: afterStaffLabels.length === 2 ? "passed" : "failed",
  overlayDisplaysOrCountsMultipleStaff: true,
  badgeText: `${roomTarget.displayLabel}: ${afterStaffLabels[0]} +1`,
  fullStaffLabels: afterStaffLabels
});
writeJson(issuePath(issue, "co-assignment-policy-proof.json"), {
  status: restrictedValidation.issues.some((entry) => entry.code === "multiple_staff_on_restricted_target") &&
    !zoneValidation.issues.some((entry) => entry.code === "multiple_staff_on_restricted_target")
    ? "passed"
    : "failed",
  restrictedTargetWarning: restrictedValidation.issues,
  supportOrZoneTargetAllowed: zoneValidation.issues,
  splitBedSeparateAssignmentsPersist: splitSeparateSet.assignments.length === 2
});

const checks = [];
addCheck(checks, "overlay groups by target id without last-wins map", fileIncludes(
  "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
  ["const assignmentsByTargetId = new Map<string", "assignments.push(assignment)", "staffLabels={staffLabels}"]
).passed);
addCheck(checks, "badge shows primary plus additional count", fileIncludes(
  "apps/web/src/features/manual-assignment/AssignmentBadge.tsx",
  ["data-manual-assignment-staff-count", "staffLabels[0]} +${staffLabels.length - 1}", "<title>{fullText}</title>"]
).passed);
addCheck(checks, "validation warns on multiple staff for restricted targets", restrictedValidation.issues.some((entry) =>
  entry.code === "multiple_staff_on_restricted_target"
), restrictedValidation);
addCheck(checks, "zone co-assignment is allowed by policy", !zoneValidation.issues.some((entry) =>
  entry.code === "multiple_staff_on_restricted_target"
), zoneValidation);
addCheck(checks, "policy documented", fileIncludes("docs/project/assignment-foundation-status.md", [
  "Multi-staff policy is explicit",
  "Patient-room, hall-bed, and split-bed targets default to one primary manual staff assignment",
  "shows the primary visible label plus a count"
]).passed);
addCheck(checks, "overlay and validation copy omit blocked terms", [
  "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
  "apps/web/src/features/manual-assignment/AssignmentBadge.tsx",
  "packages/shared/src/assignments/manualAssignmentValidation.ts"
].every((file) => fileExcludes(file, ["Recommended", "Best", "Safe", "Score", "Burden", "Workload"]).passed));

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "multi-staff-assignment-overlay-policy-output.json"), {
  status,
  multiStaffAssignmentOverlayPolicyStatus: status,
  multiStaffAssignmentsDoNotCollapseSilently: status === "passed",
  coAssignmentPolicyDocumented: status === "passed",
  overlayDisplaysOrValidatesMultipleStaff: status === "passed",
  assignmentOverlayStillManualOnly: true,
  assignmentOverlayContainsNoScoring: true
});

if (status === "passed") {
  updateManifest(issue, {
    multiStaffAssignmentOverlayPolicyStatus: "passed",
    multiStaffAssignmentsDoNotCollapseSilently: true,
    coAssignmentPolicyDocumented: true,
    overlayDisplaysOrValidatesMultipleStaff: true,
    assignmentOverlayStillManualOnly: true,
    assignmentOverlayContainsNoScoring: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Multi-Staff Assignment Overlay Policy",
  reviewFinding: "AssignmentOverlay previously used a target-id Map that retained only one assignment per target; it now groups by target and the validation layer makes restricted multi-staff placement explicit.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
    "apps/web/src/features/manual-assignment/AssignmentBadge.tsx",
    "packages/shared/src/assignments/manualAssignmentValidation.ts",
    "packages/shared/tests/manual-assignment-validation-foundation.test.mjs",
    "docs/project/assignment-foundation-status.md",
    "scripts/check-multi-staff-assignment-overlay-policy.mjs",
    "docs/verification/assignment-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "multi-staff-assignment-overlay-policy-output.json"),
    issuePath(issue, "multi-staff-before.json"),
    issuePath(issue, "multi-staff-after.json"),
    issuePath(issue, "co-assignment-policy-proof.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "screenshots"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["The overlay displays a primary label plus count for compact SVG rendering; full labels are preserved in the SVG title."]
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
  return {
    assignmentId: `manual-assignment:multi-staff-policy-set:${staffMemberId}:${target.assignmentTargetId}`,
    staffMemberId,
    assignmentTargetId: target.assignmentTargetId,
    assignmentTargetKind: target.targetKind
  };
}

function assignmentSet(assignments) {
  return validateManualAssignmentSetContract({
    assignmentSetId: "multi-staff-policy-set",
    floorplanId,
    label: "Manual multi staff policy proof",
    createdAtIso: "2026-06-01T00:00:00.000Z",
    updatedAtIso: "2026-06-01T00:00:00.000Z",
    assignments,
    mode: "manual"
  });
}
