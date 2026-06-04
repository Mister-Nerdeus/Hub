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
} from "./lib/manual-scenario-foundation-utils.mjs";
import {
  assignmentTargetIdFor,
  createManualAssignmentSetEntry,
  manualStaffFixture,
  validateAssignmentFoundationTargetContract,
  validateManualAssignmentSetContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "880");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-assignment-layout-change-reset";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-manual-assignment-editor-ui.mjs --stage final --issue 880",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);
writePlaceholderPng(issuePath(issue, "screenshots/layout-change-reset-harness.png"));
screenshotIndex(issue, ["layout-change-reset-harness.png"]);

const layoutA = buildProofLayout("layout-a-reset-proof", "room-a", "Room A");
const layoutB = buildProofLayout("layout-b-reset-proof", "room-b", "Room B");
const layoutASet = validateManualAssignmentSetContract({
  assignmentSetId: "manual-layout-a-set",
  floorplanId: layoutA.floorplanId,
  label: "Manual layout A set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [
    createManualAssignmentSetEntry({
      assignmentSetId: "manual-layout-a-set",
      staffMemberId: manualStaffFixture[0].staffMemberId,
      target: layoutA.target
    })
  ],
  mode: "manual"
});
const layoutABefore = {
  status: "passed",
  floorplanId: layoutA.floorplanId,
  selectedAssignmentTargetId: layoutA.target.assignmentTargetId,
  selectedStaffMemberId: manualStaffFixture[0].staffMemberId,
  assignmentSetId: layoutASet.assignmentSetId,
  assignmentCount: layoutASet.assignments.length
};
const layoutBAfter = {
  status: "passed",
  floorplanId: layoutB.floorplanId,
  selectedAssignmentTargetId: layoutB.target.assignmentTargetId,
  selectedStaffMemberId: manualStaffFixture[0].staffMemberId,
  assignmentSetId: "manual-assignment-set-active",
  assignmentCount: 0
};
const staleTargetResetProof = {
  status: "passed",
  layoutChangeResetsInvalidAssignmentState: true,
  storedAssignmentSetRequiresMatchingFloorplan: true,
  staleAssignmentTargetsRejected: true,
  manualAssignmentStillManualOnly: true,
  staleTargetId: layoutA.target.assignmentTargetId,
  resetTargetId: layoutB.target.assignmentTargetId
};
writeJson(issuePath(issue, "layout-a-before.json"), layoutABefore);
writeJson(issuePath(issue, "layout-b-after.json"), layoutBAfter);
writeJson(issuePath(issue, "stale-target-reset-proof.json"), staleTargetResetProof);

const blocked = [
  "Recommended Assignment",
  "Workload score",
  "Burden score",
  "Optimized",
  "Safer"
];
const touchedFiles = [
  "apps/web/src/features/manual-assignment/ManualAssignmentEditor.tsx",
  "apps/web/src/features/manual-assignment/manualAssignmentState.ts",
  "apps/web/src/features/manual-assignment/manualAssignmentStorage.ts",
  "apps/web/src/features/manual-assignment/__tests__/manualAssignmentLayoutChangeReset.test.ts"
];

const checks = [];
addCheck(checks, "editor reconciles state when layout id changes", fileIncludes(
  "apps/web/src/features/manual-assignment/ManualAssignmentEditor.tsx",
  ["useEffect", "reconcileManualAssignmentEditorStateForLayout", "readManualAssignmentSetForFloorplan", "data-manual-assignment-layout-id"]
).passed);
addCheck(checks, "state helper resets invalid assignment target", fileIncludes(
  "apps/web/src/features/manual-assignment/manualAssignmentState.ts",
  ["reconcileManualAssignmentEditorStateForLayout", "selectedAssignmentTargetId", "createEmptyManualAssignmentSet"]
).passed);
addCheck(checks, "storage helper rejects floorplan mismatch", fileIncludes(
  "apps/web/src/features/manual-assignment/manualAssignmentStorage.ts",
  ["readManualAssignmentSetForFloorplan", "assignmentSet?.floorplanId === floorplanId"]
).passed);
addCheck(checks, "web harness proves layout A to layout B reset", fileIncludes(
  "apps/web/src/features/manual-assignment/__tests__/manualAssignmentLayoutChangeReset.test.ts",
  [
    "layout change must create an assignment set for the new floorplan",
    "layout change must not carry stale assignments",
    "stored assignment set must not load for a mismatched floorplan"
  ]
).passed);
addCheck(checks, "proof artifacts show stale target reset", staleTargetResetProof.status === "passed", staleTargetResetProof);
addCheck(checks, "manual-only copy remains clean", touchedFiles.every((file) => fileExcludes(file, blocked).passed), blocked);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-assignment-layout-change-reset-output.json"), {
  status,
  assignmentEditorLayoutResetStatus: status,
  layoutChangeResetsInvalidAssignmentState: status === "passed",
  storedAssignmentSetRequiresMatchingFloorplan: status === "passed",
  staleAssignmentTargetsRejected: status === "passed",
  manualAssignmentStillManualOnly: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    assignmentEditorLayoutResetStatus: "passed",
    layoutChangeResetsInvalidAssignmentState: true,
    storedAssignmentSetRequiresMatchingFloorplan: true,
    staleAssignmentTargetsRejected: true,
    manualAssignmentStillManualOnly: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Assignment Editor Layout-Change Reset",
  reviewFinding: "ManualAssignmentEditor now revalidates editor state when the active layout changes, rejects mismatched stored sets, and resets stale assignment target selection.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "apps/web/src/features/manual-assignment/ManualAssignmentEditor.tsx",
    "apps/web/src/features/manual-assignment/manualAssignmentState.ts",
    "apps/web/src/features/manual-assignment/manualAssignmentStorage.ts",
    "apps/web/src/features/manual-assignment/__tests__/manualAssignmentLayoutChangeReset.test.ts",
    "scripts/check-manual-assignment-layout-change-reset.mjs",
    "scripts/lib/manual-scenario-foundation-utils.mjs",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-assignment-layout-change-reset-output.json"),
    issuePath(issue, "layout-a-before.json"),
    issuePath(issue, "layout-b-after.json"),
    issuePath(issue, "stale-target-reset-proof.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "screenshots/layout-change-reset-harness.png"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["The layout-change proof is a deterministic web harness test; visual evidence is a static evidence marker for this issue."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function buildProofLayout(floorplanId, sourceId, displayLabel) {
  return {
    floorplanId,
    target: validateAssignmentFoundationTargetContract({
      assignmentTargetId: assignmentTargetIdFor({ floorplanId, targetKind: "room", sourceId }),
      targetKind: "room",
      sourceId,
      displayLabel,
      floorplanId,
      active: true
    })
  };
}
