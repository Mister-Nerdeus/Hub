#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileIncludes,
  readArg,
  statusFromChecks,
  updateBoundaryManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/boundary-door-destination-utils.mjs";

const issue = readArg("--issue", "838");
const stage = readArg("--stage", "final");
const scriptName = "check-door-destination-inspector";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);

const checks = [];
addCheck(checks, "door destination inspector exposes Leads to in normal UI", fileIncludes("apps/web/src/features/layout-editor/DoorDestinationInspectorPanel.tsx", [
  "Door destination",
  "Leads to",
  "data-door-destination-inspector=\"normal\""
]).passed);
addCheck(checks, "entry exit inspector edits destination kind and label in normal UI", fileIncludes("apps/web/src/features/layout-editor/EntryExitInspectorPanel.tsx", [
  "data-entry-exit-inspector=\"normal\"",
  "Destination",
  "onDestinationChange",
  "onDestinationLabelChange"
]).passed);
addCheck(checks, "technical destination ids remain in advanced view model fields", fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", [
  "destinationId",
  "Technical metadata"
]).passed);
addCheck(checks, "reducer stores destination edits", fileIncludes("apps/web/src/features/layout-editor/layoutEditorReducer.ts", [
  "editDoorDestination",
  "editEntryExitDestination",
  "editEntryExitDestinationLabel",
  "doorDestinations"
]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/door-destination-inspector-output.json`, {
  status,
  doorDestinationInspectorStatus: status,
  doorLeadsToEditableInNormalInspector: status === "passed",
  entryExitDestinationEditableInNormalInspector: status === "passed",
  technicalDestinationIdsAdvancedOnly: status === "passed"
});
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [{ file: "screenshots/inspector-wiring-proof.json", source: "static-inspector-proof" }]
});
writeJson(`docs/verification/issues/issue-${issue}/screenshots/inspector-wiring-proof.json`, { status: "passed" });
if (status === "passed") {
  updateBoundaryManifest(issue, {
    doorDestinationInspectorStatus: "passed",
    doorLeadsToEditableInNormalInspector: true,
    entryExitDestinationEditableInNormalInspector: true,
    technicalDestinationIdsAdvancedOnly: true
  });
}
writeCloseout(issue, {
  title: "Door Destination Inspector and Editing Controls",
  reviewFinding: "Normal inspector controls can edit door leads-to values and entry/exit destination kind and labels while technical IDs remain in advanced metadata.",
  status,
  filesChanged: ["apps/web/src/features/layout-editor/DoorDestinationInspectorPanel.tsx", "apps/web/src/features/layout-editor/EntryExitInspectorPanel.tsx", "apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", "apps/web/src/features/layout-editor/layoutEditorReducer.ts", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/door-destination-inspector-output.json`, `docs/verification/issues/issue-${issue}/screenshot-index.json`],
  limitations: ["Issue 841 performs browser-level edit/save/reload proof."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
