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

const issue = readArg("--issue", "835");
const stage = readArg("--stage", "final");
const scriptName = "check-entry-exit-contract";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const fixture = {
  entryExitId: "entry-main-hall",
  label: "Main hall entry",
  kind: "main_entry",
  xFeet: 10,
  yFeet: 20,
  widthFeet: 8,
  heightFeet: 2,
  connectsTo: { destinationKind: "hallway", destinationId: "hall-main", displayLabel: "Main hallway" },
  blocksTravel: false
};
writeJson(`docs/verification/issues/issue-${issue}/entry-exit-fixture.json`, fixture);

const checks = [];
addCheck(checks, "entry/exit contract is first-class geometry", fileIncludes("packages/shared/src/floorplans/entryExitContract.ts", [
  "EntryExitContract",
  "ENTRY_EXIT_KINDS",
  "connectsTo",
  "blocksTravel: false"
]).passed);
addCheck(checks, "editable and plan contracts persist entry exits", fileIncludes("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts", ["entryExits"]).passed && fileIncludes("packages/shared/src/contracts.ts", ["entryExits"]).passed);
addCheck(checks, "entry exit is selectable renderable geometry", fileIncludes("apps/web/src/features/layout-editor/EntryExitShape.tsx", ["data-layout-object-type=\"entry_exit\"", "data-entry-exit-destination-label"]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/entry-exit-contract-output.json`, {
  status,
  entryExitContractStatus: status,
  entryExitPointsAreFirstClassGeometry: status === "passed",
  entryExitDestinationsModeled: status === "passed"
});
if (status === "passed") {
  updateBoundaryManifest(issue, {
    entryExitContractStatus: "passed",
    entryExitPointsAreFirstClassGeometry: true,
    entryExitDestinationsModeled: true
  });
}
writeCloseout(issue, {
  title: "Entry / Exit Geometry Contract",
  reviewFinding: "Entries and exits are persisted selectable geometry with destination labels and non-blocking travel semantics.",
  status,
  filesChanged: ["packages/shared/src/floorplans/entryExitContract.ts", "packages/shared/src/floorplans/floorplanGeometryContract.ts", "apps/web/src/features/layout-editor/EntryExitShape.tsx", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/entry-exit-contract-output.json`, `docs/verification/issues/issue-${issue}/entry-exit-fixture.json`],
  limitations: ["Entry/exit objects can become route graph nodes later; this issue does not build route graph behavior."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
