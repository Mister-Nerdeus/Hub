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
} from "./lib/assignment-foundation-utils.mjs";
import {
  ASSIGNMENT_CARE_POSITION_TARGET_KIND,
  canonicalErPodGeometryFixture,
  resolveAssignmentTargetsFromFloorplan
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "873");
const stage = readArg("--stage", "final");
const scriptName = "check-assignment-care-position-terminology";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-assignment-target-contract.mjs --stage final --issue 873",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

const scopedFiles = [
  "docs/project/assignment-care-position-model.md",
  "docs/project/assignment-foundation-status.md",
  "packages/shared/src/assignments/assignmentTargetContract.ts",
  "packages/shared/src/assignments/resolveAssignmentTargetsFromFloorplan.ts",
  "apps/web/src/features/manual-assignment/AssignmentTargetListPanel.tsx",
  "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
  "apps/web/src/features/manual-assignment/AssignmentBadge.tsx"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const targets = resolveAssignmentTargetsFromFloorplan(canonicalErPodGeometryFixture);
const splitParentRoomIds = new Set(canonicalErPodGeometryFixture.splitRooms.map((splitRoom) => splitRoom.parentRoomId));
const splitBedPositionIds = canonicalErPodGeometryFixture.splitRooms.flatMap((splitRoom) =>
  splitRoom.bedPositions.map((bedPosition) => bedPosition.bedPositionId)
);
const splitParentTargets = targets.filter((target) => splitParentRoomIds.has(target.sourceId));
const splitBedTargets = targets.filter((target) =>
  target.targetKind === ASSIGNMENT_CARE_POSITION_TARGET_KIND &&
  splitBedPositionIds.includes(target.sourceId)
);
const fakeChildRooms = canonicalErPodGeometryFixture.rooms.filter((room) =>
  splitBedPositionIds.includes(room.id) || /bed-[ab]$/iu.test(room.id)
);

writeJson(issuePath(issue, "bed-position-care-position-proof.json"), {
  status: ASSIGNMENT_CARE_POSITION_TARGET_KIND === "bed_position" ? "passed" : "failed",
  bedPositionIsCurrentCarePositionModel: ASSIGNMENT_CARE_POSITION_TARGET_KIND === "bed_position",
  assignmentCarePositionTargetKind: ASSIGNMENT_CARE_POSITION_TARGET_KIND
});
writeJson(issuePath(issue, "split-parent-not-assignment-target-proof.json"), {
  status: splitParentTargets.length === 0 ? "passed" : "failed",
  splitParentRoomIds: [...splitParentRoomIds].sort(),
  splitParentTargets
});
writeJson(issuePath(issue, "split-bed-target-proof.json"), {
  status: splitBedTargets.length === splitBedPositionIds.length ? "passed" : "failed",
  splitBedPositionIds: splitBedPositionIds.slice().sort(),
  splitBedTargetIds: splitBedTargets.map((target) => target.assignmentTargetId).sort()
});

const legacyFindings = scopedFiles.flatMap((file) => {
  const result = fileExcludes(file, ["split_bay", "split bay", "patient assignment"]);
  return result.present.map((term) => ({ file, term }));
});
const checks = [];
addCheck(checks, "care position doc exists", fileIncludes("docs/project/assignment-care-position-model.md", [
  "`bed_position` as the care-position model",
  "one physical room -> two bed positions / care positions -> assignable targets",
  "not fake child rooms"
]).passed);
addCheck(checks, "shared constant defines bed_position care-position model", fileIncludes(
  "packages/shared/src/assignments/assignmentTargetContract.ts",
  ["ASSIGNMENT_CARE_POSITION_TARGET_KIND", "\"bed_position\" satisfies AssignmentTargetKind"]
).passed);
addCheck(checks, "resolver uses care-position target kind", fileIncludes(
  "packages/shared/src/assignments/resolveAssignmentTargetsFromFloorplan.ts",
  ["ASSIGNMENT_CARE_POSITION_TARGET_KIND", "buildTarget(layout.layoutId, ASSIGNMENT_CARE_POSITION_TARGET_KIND"]
).passed);
addCheck(checks, "split parent rooms are not targets", splitParentTargets.length === 0, splitParentTargets);
addCheck(checks, "split bed positions are targets", splitBedTargets.length === splitBedPositionIds.length, splitBedTargets);
addCheck(checks, "split bed targets are not fake rooms", fakeChildRooms.length === 0, fakeChildRooms);
addCheck(checks, "legacy or contradictory terminology absent from scoped files", legacyFindings.length === 0, legacyFindings);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "assignment-care-position-terminology-output.json"), {
  status,
  assignmentCarePositionTerminologyStatus: status,
  bedPositionIsCurrentCarePositionModel: ASSIGNMENT_CARE_POSITION_TARGET_KIND === "bed_position",
  splitParentRoomNotPatientAssignmentTarget: splitParentTargets.length === 0,
  splitBedPositionsAreAssignmentTargets: splitBedTargets.length === splitBedPositionIds.length,
  splitBedsNotFakeRooms: fakeChildRooms.length === 0,
  legacySplitBayNotUsedForAssignment: legacyFindings.length === 0
});

if (status === "passed") {
  updateManifest(issue, {
    assignmentCarePositionTerminologyStatus: "passed",
    bedPositionIsCurrentCarePositionModel: true,
    splitParentRoomNotPatientAssignmentTarget: true,
    splitBedPositionsAreAssignmentTargets: true,
    splitBedsNotFakeRooms: true,
    legacySplitBayNotUsedForAssignment: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Assignment Care Position Terminology Alignment",
  reviewFinding: "The resolver already preserves split-room parents as physical rooms and emits bed-position targets; this issue documents that bed_position is the current care-position model and adds a guard against contradictory terminology.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "docs/project/assignment-care-position-model.md",
    "docs/project/assignment-foundation-status.md",
    "docs/verification/assignment-foundation-manifest.json",
    "scripts/check-assignment-care-position-terminology.mjs",
    "packages/shared/src/assignments/assignmentTargetContract.ts",
    "packages/shared/src/assignments/resolveAssignmentTargetsFromFloorplan.ts",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "assignment-care-position-terminology-output.json"),
    issuePath(issue, "bed-position-care-position-proof.json"),
    issuePath(issue, "split-parent-not-assignment-target-proof.json"),
    issuePath(issue, "split-bed-target-proof.json"),
    issuePath(issue, "manifest-update-output.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Terminology is aligned for the manual assignment foundation; no schema rename from bed_position to care_position was introduced."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
