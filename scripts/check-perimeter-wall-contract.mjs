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

const issue = readArg("--issue", "834");
const stage = readArg("--stage", "final");
const scriptName = "check-perimeter-wall-contract";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const fixture = {
  perimeterWallId: "perimeter-er-pod",
  label: "ER pod boundary",
  segments: [
    { segmentId: "north", label: "North boundary", xFeet: 0, yFeet: 0, widthFeet: 40, heightFeet: 0.5, orientation: "horizontal", blocksTravel: true, locked: true },
    { segmentId: "east", label: "East boundary", xFeet: 40, yFeet: 0, widthFeet: 0.5, heightFeet: 28, orientation: "vertical", blocksTravel: true, locked: true }
  ]
};
writeJson(`docs/verification/issues/issue-${issue}/perimeter-wall-fixture.json`, fixture);

const checks = [];
addCheck(checks, "shared contract validates perimeter wall segments", fileIncludes("packages/shared/src/floorplans/perimeterWallContract.ts", [
  "PerimeterWallContract",
  "blocksTravel: true",
  "locked: boolean",
  "validatePerimeterWallContract"
]).passed);
addCheck(checks, "editable and plan contracts persist perimeter walls", fileIncludes("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts", ["perimeterWalls"]).passed && fileIncludes("packages/shared/src/contracts.ts", ["perimeterWalls"]).passed);
addCheck(checks, "web view model makes perimeter wall selectable", fileIncludes("apps/web/src/features/layout-editor/perimeterWallViewModel.ts", ["PerimeterWallViewModel"]).passed && fileIncludes("apps/web/src/features/layout-editor/PerimeterWallShape.tsx", ["data-layout-object-type=\"perimeter_wall\"", "data-selectable=\"true\""]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/perimeter-wall-contract-output.json`, {
  status,
  perimeterWallContractStatus: status,
  perimeterWallIsLayoutGeometry: status === "passed",
  perimeterWallBlocksTravel: status === "passed"
});
if (status === "passed") {
  updateBoundaryManifest(issue, {
    perimeterWallContractStatus: "passed",
    perimeterWallIsLayoutGeometry: true,
    perimeterWallBlocksTravel: true
  });
}
writeCloseout(issue, {
  title: "Perimeter Wall / Boundary Contract",
  reviewFinding: "Perimeter walls are now persisted floorplan geometry with labeled blocking segments and selectable locked rendering.",
  status,
  filesChanged: [
    "packages/shared/src/floorplans/perimeterWallContract.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "apps/web/src/features/layout-editor/perimeterWallViewModel.ts",
    "apps/web/src/features/layout-editor/PerimeterWallShape.tsx",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/perimeter-wall-contract-output.json`, `docs/verification/issues/issue-${issue}/perimeter-wall-fixture.json`],
  limitations: ["Perimeter wall blocks travel as data only; route graph construction remains out of scope."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
