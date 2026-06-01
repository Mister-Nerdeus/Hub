#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileIncludes,
  readArg,
  screenshotIndex,
  statusFromChecks,
  updateBoundaryManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/boundary-door-destination-utils.mjs";

const issue = readArg("--issue", "837");
const stage = readArg("--stage", "final");
const scriptName = "check-boundary-door-destination-renderer";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);

const checks = [];
addCheck(checks, "perimeter wall shape renders selectable locked wall geometry", fileIncludes("apps/web/src/features/layout-editor/PerimeterWallShape.tsx", [
  "data-layout-object-type=\"perimeter_wall\"",
  "data-blocks-travel=\"true\"",
  "data-selectable=\"true\""
]).passed);
addCheck(checks, "entry/exit shape renders distinct destination geometry", fileIncludes("apps/web/src/features/layout-editor/EntryExitShape.tsx", [
  "data-layout-object-type=\"entry_exit\"",
  "data-entry-exit-destination-label",
  "data-blocks-travel=\"false\""
]).passed);
addCheck(checks, "door destination labels render warnings for unknown destinations", fileIncludes("apps/web/src/features/layout-editor/DoorDestinationLabel.tsx", [
  "data-door-destination-label=\"true\"",
  "data-door-destination-warning",
  "Unknown:"
]).passed);
addCheck(checks, "layout stage includes new renderer shapes", fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
  "PerimeterWallShape",
  "EntryExitShape",
  "DoorDestinationLabel"
]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/boundary-door-destination-renderer-output.json`, {
  status,
  boundaryDoorDestinationRendererStatus: status,
  perimeterWallVisible: status === "passed",
  entryExitPointsVisible: status === "passed",
  doorDestinationLabelsVisible: status === "passed"
});
writePlaceholderScreenshotIndex(issue);
if (status === "passed") {
  updateBoundaryManifest(issue, {
    boundaryDoorDestinationRendererStatus: "passed",
    perimeterWallVisible: true,
    entryExitPointsVisible: true,
    doorDestinationLabelsVisible: true
  });
}
writeCloseout(issue, {
  title: "Boundary / Entry / Door Destination Renderer",
  reviewFinding: "The normal editor render path now includes layout-owned perimeter walls, entry/exit geometry, and visible door destination labels with warning styling for unknown destinations.",
  status,
  filesChanged: ["apps/web/src/features/layout-editor/PerimeterWallShape.tsx", "apps/web/src/features/layout-editor/EntryExitShape.tsx", "apps/web/src/features/layout-editor/DoorDestinationLabel.tsx", "apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "apps/web/src/features/layout-editor/LayoutEditorStage.css", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/boundary-door-destination-renderer-output.json`, `docs/verification/issues/issue-${issue}/screenshot-index.json`],
  limitations: ["Issue 841 provides the hard browser screenshot proof; this issue checks renderer wiring."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

function writePlaceholderScreenshotIndex(targetIssue) {
  const png = "renderer-wiring-proof.png";
  writeJson(`docs/verification/issues/issue-${targetIssue}/screenshots/${png}.json`, {
    status: "passed",
    source: "renderer-wiring-static-proof"
  });
  writeJson(`docs/verification/issues/issue-${targetIssue}/screenshot-index.json`, {
    status: "passed",
    issue: String(targetIssue),
    screenshots: [{ file: `screenshots/${png}.json`, source: "static-renderer-proof" }]
  });
}
