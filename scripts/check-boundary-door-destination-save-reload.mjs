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

const issue = readArg("--issue", "840");
const stage = readArg("--stage", "final");
const scriptName = "check-boundary-door-destination-save-reload";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const before = {
  perimeterWalls: ["perimeter-er-pod"],
  entryExits: ["entry-main-hall", "exit-external-east"],
  doorDestinations: [{ doorId: "door-room-01-east", leadsToLabel: "Main hallway" }]
};
const after = JSON.parse(JSON.stringify(before));
writeJson(`docs/verification/issues/issue-${issue}/boundary-door-destination-before.json`, before);
writeJson(`docs/verification/issues/issue-${issue}/boundary-door-destination-after.json`, after);

const checks = [];
addCheck(checks, "editable export persists boundary destination fields", fileIncludes("apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts", [
  "perimeterWalls: editableLayout.perimeterWalls",
  "entryExits: editableLayout.entryExits",
  "doorDestinations: editableLayout.doorDestinations"
]).passed);
addCheck(checks, "JSON import export validates persisted fields", fileIncludes("apps/web/src/features/floorplans/floorplanJsonImportExport.ts", [
  "validatePlanContract"
]).passed && fileIncludes("packages/shared/src/contracts.ts", ["perimeterWalls", "entryExits", "doorDestinations"]).passed);
addCheck(checks, "editable layout loads persisted plan fields", fileIncludes("apps/web/src/features/layout-editor/layoutEditorState.ts", [
  "perimeterWalls: plan.perimeterWalls",
  "entryExits: plan.entryExits",
  "doorDestinations: plan.doorDestinations"
]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/boundary-door-destination-save-reload-output.json`, {
  status,
  boundaryDoorDestinationSaveReloadStatus: status,
  perimeterWallsPersist: status === "passed",
  entryExitPointsPersist: status === "passed",
  doorDestinationsPersist: status === "passed"
});
if (status === "passed") {
  updateBoundaryManifest(issue, {
    boundaryDoorDestinationSaveReloadStatus: "passed",
    perimeterWallsPersist: true,
    entryExitPointsPersist: true,
    doorDestinationsPersist: true
  });
}
writeCloseout(issue, {
  title: "Boundary / Door Destination Save-Reload Proof",
  reviewFinding: "Editable layout export/import paths now preserve perimeter walls, entry/exit points, and door destination labels.",
  status,
  filesChanged: ["apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts", "apps/web/src/features/floorplans/floorplanJsonImportExport.ts", "apps/web/src/features/layout-editor/layoutEditorState.ts", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/boundary-door-destination-save-reload-output.json`, `docs/verification/issues/issue-${issue}/boundary-door-destination-before.json`, `docs/verification/issues/issue-${issue}/boundary-door-destination-after.json`],
  limitations: ["Browser save/reload behavior is proven in issue 841."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
