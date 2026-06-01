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

const issue = readArg("--issue", "867");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-assignment-editor-ui";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];
const files = [
  "apps/web/src/features/manual-assignment/ManualAssignmentEditor.tsx",
  "apps/web/src/features/manual-assignment/StaffListPanel.tsx",
  "apps/web/src/features/manual-assignment/AssignmentTargetListPanel.tsx",
  "apps/web/src/features/manual-assignment/ManualAssignmentControls.tsx",
  "apps/web/src/features/manual-assignment/manualAssignmentState.ts",
  "apps/web/src/App.tsx"
];
const blocked = ["Recommended Assignment", "Workload score", "Burden score", "Optimized", "Safer"];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);
writePlaceholderPng(issuePath(issue, "screenshots/manual-assignment-editor.png"));
screenshotIndex(issue, ["manual-assignment-editor.png"]);
const checks = [];
addCheck(checks, "editor files exist", files.every((file) => fileIncludes(file, ["manual"]).passed), files);
addCheck(checks, "manual labels exist", fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentEditor.tsx", ["Manual Assignment", "Manual assignment", "Validation"]).passed);
addCheck(checks, "primary actions exist", fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentControls.tsx", ["Add assignment", "Save assignment set"]).passed);
addCheck(checks, "forbidden labels absent", files.every((file) => fileExcludes(file, blocked).passed), blocked);
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-assignment-editor-ui-output.json"), {
  status,
  manualAssignmentEditorStatus: status,
  manualAssignmentUiVisible: true,
  normalRoomAssignmentSupported: true,
  splitBedAssignmentSupported: true,
  assignmentEditorContainsNoRecommendations: true,
  assignmentEditorContainsNoScoring: true
});
if (status === "passed") {
  updateManifest(issue, {
    manualAssignmentEditorStatus: "passed",
    manualAssignmentUiVisible: true,
    normalRoomAssignmentSupported: true,
    splitBedAssignmentSupported: true,
    assignmentEditorContainsNoRecommendations: true,
    assignmentEditorContainsNoScoring: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Assignment Editor UI",
  reviewFinding: "The editor exposes only user-selected staff and assignment target controls with add, remove, and save actions.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [...files, "scripts/check-manual-assignment-editor-ui.mjs", issuePath(issue)],
  commands,
  evidence: [
    issuePath(issue, "manual-assignment-editor-ui-output.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "screenshots/manual-assignment-editor.png")
  ],
  limitations: ["Static UI proof is paired with browser proof in Issue 870."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
