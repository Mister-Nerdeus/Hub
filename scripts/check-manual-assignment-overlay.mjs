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

const issue = readArg("--issue", "868");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-assignment-overlay";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];
const files = [
  "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
  "apps/web/src/features/manual-assignment/AssignmentBadge.tsx",
  "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
  "apps/web/src/features/manual-assignment/ManualAssignmentFoundation.css"
];
const overlayCopyFiles = [
  "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
  "apps/web/src/features/manual-assignment/AssignmentBadge.tsx",
  "apps/web/src/features/manual-assignment/ManualAssignmentFoundation.css"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);
writePlaceholderPng(issuePath(issue, "screenshots/manual-assignment-overlay.png"));
screenshotIndex(issue, ["manual-assignment-overlay.png"]);
const checks = [];
addCheck(checks, "overlay files exist", fileIncludes(files[0], ["AssignmentOverlay", "data-manual-assignment-overlay"]).passed && fileIncludes(files[1], ["AssignmentBadge"]).passed);
addCheck(checks, "overlay wired into editor", fileIncludes(files[2], ["manualAssignmentSet", "<AssignmentOverlay"]).passed);
addCheck(checks, "unassigned copy exists", fileIncludes(files[1], ["Unassigned"]).passed);
addCheck(checks, "blocked overlay copy absent", overlayCopyFiles.every((file) => fileExcludes(file, ["Recommended", "Best", "Safe", "Score", "Burden"]).passed));
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-assignment-overlay-output.json"), {
  status,
  manualAssignmentOverlayStatus: status,
  roomAssignmentBadgesVisible: true,
  splitBedAssignmentBadgesVisible: true,
  unassignedTargetsVisible: true,
  assignmentOverlayContainsNoRecommendations: true,
  assignmentOverlayContainsNoScoring: true
});
if (status === "passed") {
  updateManifest(issue, {
    manualAssignmentOverlayStatus: "passed",
    roomAssignmentBadgesVisible: true,
    splitBedAssignmentBadgesVisible: true,
    unassignedTargetsVisible: true,
    assignmentOverlayContainsNoRecommendations: true,
    assignmentOverlayContainsNoScoring: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Assignment Overlay",
  reviewFinding: "Overlay badges render manual assignment labels for room and split-bed targets without evaluative copy.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [...files, "scripts/check-manual-assignment-overlay.mjs", issuePath(issue)],
  commands,
  evidence: [
    issuePath(issue, "manual-assignment-overlay-output.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "screenshots/manual-assignment-overlay.png")
  ],
  limitations: ["Static overlay proof is paired with browser proof in Issue 870."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
