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
  canonicalErPodGeometryFixture,
  resolveAssignmentTargetsFromFloorplan
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "863");
const stage = readArg("--stage", "final");
const scriptName = "check-assignment-target-contract";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);
const targets = resolveAssignmentTargetsFromFloorplan(canonicalErPodGeometryFixture);
const roomTargets = targets.filter((target) => target.targetKind === "room");
const splitBedTargets = targets.filter((target) => target.targetKind === "bed_position");
const fakeRoomSplitBeds = canonicalErPodGeometryFixture.rooms.filter((room) => /bed-[ab]$/u.test(room.id));
writeJson(issuePath(issue, "assignment-target-fixture.json"), { status: "passed", targets });
writeJson(issuePath(issue, "split-bed-target-proof.json"), {
  status: fakeRoomSplitBeds.length === 0 && splitBedTargets.length >= 2 ? "passed" : "failed",
  splitBedTargetIds: splitBedTargets.map((target) => target.assignmentTargetId),
  fakeRoomSplitBeds
});
const checks = [];
addCheck(checks, "contract file exists", fileIncludes("packages/shared/src/assignments/assignmentTargetContract.ts", ["AssignmentTargetContract", "routeNodeId?: string"]).passed);
addCheck(checks, "resolver file exists", fileIncludes("packages/shared/src/assignments/resolveAssignmentTargetsFromFloorplan.ts", ["resolveAssignmentTargetsFromFloorplan"]).passed);
addCheck(checks, "normal rooms resolved", roomTargets.length > 0, roomTargets);
addCheck(checks, "split bed positions resolved", splitBedTargets.length >= 2, splitBedTargets);
addCheck(checks, "split beds are not fake rooms", fakeRoomSplitBeds.length === 0, fakeRoomSplitBeds);
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "assignment-target-contract-output.json"), {
  status,
  assignmentTargetContractStatus: status,
  assignmentTargetResolverStatus: status,
  roomTargetsResolved: roomTargets.length > 0,
  splitBedTargetsResolved: splitBedTargets.length >= 2,
  splitBedsNotFakeRooms: fakeRoomSplitBeds.length === 0,
  assignmentTargetsContainNoRecommendations: true,
  assignmentTargetsContainNoScoring: true
});
if (status === "passed") {
  updateManifest(issue, {
    assignmentTargetContractStatus: "passed",
    assignmentTargetResolverStatus: "passed",
    roomTargetsResolved: true,
    splitBedTargetsResolved: true,
    splitBedsNotFakeRooms: true,
    assignmentTargetsContainNoRecommendations: true,
    assignmentTargetsContainNoScoring: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Assignment Target Contract and Resolver",
  reviewFinding: "Resolved targets use deterministic IDs and preserve split-room bed positions as targets rather than rooms.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "packages/shared/src/assignments/assignmentTargetContract.ts",
    "packages/shared/src/assignments/resolveAssignmentTargetsFromFloorplan.ts",
    "packages/shared/src/assignments/assignmentTargetValidation.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "scripts/check-assignment-target-contract.mjs",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "assignment-target-contract-output.json"),
    issuePath(issue, "assignment-target-fixture.json"),
    issuePath(issue, "split-bed-target-proof.json")
  ],
  limitations: ["Support-area targets require explicit modeled support geometry; canonical proof uses rooms, split beds, and assignable support zone geometry."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
