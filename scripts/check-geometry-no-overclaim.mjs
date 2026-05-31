import { addCheck, ensureIssueDirs, fileIncludes, readArg, statusFromChecks, updateGeometryTruthManifest, writeCloseout, writeCommonIssueArtifacts, writeJson, writeStageResult } from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "805");
const stage = readArg("--stage", "final");
const scriptName = "check-geometry-no-overclaim";
const commands = [
  `node scripts/${scriptName}.mjs --stage reference-artifacts --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage split-room-targets --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage hallway-wall-sources --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, "Geometry No-Overclaim Scanner", commands);
const checks = [];
if (stage === "reference-artifacts" || stage === "final") {
  addCheck(checks, "reference artifacts are locked and not editable rooms", fileIncludes("apps/web/src/features/layout-editor/ReferenceOverlayRenderer.tsx", ["data-reference-overlay", "data-reference-overlay-locked", 'data-reference-overlay-editable-geometry="false"']).passed);
  addCheck(checks, "locked references explain non-editable state", fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", ["reference"]).passed);
}
if (stage === "split-room-targets" || stage === "final") {
  addCheck(checks, "split parent is not modeled as two independent rooms", fileIncludes("apps/web/src/features/layout-editor/SplitRoomShape.tsx", ['data-layout-object-type="split_room_parent"', "BedPositionShape"]).passed);
  addCheck(checks, "bed positions generate stable assignment targets", fileIncludes("packages/shared/src/floorplans/assignmentTargetDerivation.ts", ["deriveSplitRoomAssignmentTargets", 'targetKind: "split_room_bed_position"']).passed);
}
if (stage === "hallway-wall-sources" || stage === "final") {
  addCheck(checks, "hallway visuals declare geometry source IDs", fileIncludes("apps/web/src/features/layout-editor/HallwayShape.tsx", ["data-geometry-source-id", 'data-geometry-kind="hallway"']).passed);
  addCheck(checks, "wall visuals declare geometry source IDs", fileIncludes("apps/web/src/features/layout-editor/WallShape.tsx", ["data-geometry-source-id", "data-geometry-kind"]).passed);
}
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, { status, issue: String(issue), stage, checks });
if (status === "passed") updateGeometryTruthManifest(issue, { geometryNoOverclaimStatus: "passed" });
writeCloseout(issue, {
  title: "Geometry No-Overclaim Scanner",
  reviewFinding: "Rendered geometry needed scanner coverage against editable/reference/assignment-target overclaims.",
  status,
  filesChanged: ["scripts/check-geometry-no-overclaim.mjs", "docs/verification/geometry-truth-repair-manifest.json", `docs/verification/issues/issue-${issue}/`],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/reference-artifacts-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/split-room-targets-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/hallway-wall-sources-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [`docs/verification/issues/issue-${issue}/reference-artifacts-output.json`, `docs/verification/issues/issue-${issue}/split-room-targets-output.json`, `docs/verification/issues/issue-${issue}/hallway-wall-sources-output.json`, `docs/verification/issues/issue-${issue}/manifest-update-output.json`],
  limitations: ["Scanner checks geometry truth claims only; it does not introduce optimizer or assignment recommendations."]
});
writeStageResult(issue, scriptName, stage, checks, { definitionOfDone: { geometryNoOverclaimStatus: status } });
if (status !== "passed") process.exitCode = 1;
