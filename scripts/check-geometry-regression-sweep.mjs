import { addCheck, ensureIssueDirs, loadGeometryTruthManifest, readArg, statusFromChecks, updateGeometryTruthManifest, writeCloseout, writeCommonIssueArtifacts, writeJson, writeStageResult } from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "806");
const stage = readArg("--stage", "final");
const scriptName = "check-geometry-regression-sweep";
const commands = [
  `node scripts/${scriptName}.mjs --stage reference-overlay --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage hallways-walls-support --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage split-room-parent-bed --issue ${issue}`,
  "node scripts/check-door-authoring-browser-regression.mjs --stage final --issue 806",
  "node scripts/check-active-floorplan-workflow-go-no-go.mjs --stage final --issue 806",
  "node scripts/check-workspace-ux-repair-go-no-go.mjs --stage final --issue 806",
  "node scripts/check-no-phi-fields.mjs"
];
ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, "Geometry Regression Sweep", commands);
const manifest = loadGeometryTruthManifest();
const checks = [];
function requireFlags(name, flags) {
  if (stage === name || stage === "final") {
    const missing = flags.filter(([key, value]) => manifest[key] !== value);
    addCheck(checks, `${name} manifest flags passed`, missing.length === 0, { missing });
  }
}
requireFlags("reference-overlay", [
  ["referenceOverlayContractStatus", "passed"],
  ["referenceOverlayToggleUiStatus", "passed"],
  ["lockedReferenceStylingStatus", "passed"],
  ["artifactQuarantineCleanupStatus", "passed"]
]);
requireFlags("hallways-walls-support", [
  ["hallwayGeometryContractStatus", "passed"],
  ["hallwayRendererStatus", "passed"],
  ["outerWallGeometryContractStatus", "passed"],
  ["outerWallRendererStatus", "passed"],
  ["supportStorageAreaContractStatus", "passed"],
  ["supportStorageAreaRendererStatus", "passed"]
]);
requireFlags("split-room-parent-bed", [
  ["splitRoomParentBedContractStatus", "passed"],
  ["convertRoomToSplitRoomStatus", "passed"],
  ["splitRoomRendererStatus", "passed"],
  ["splitBedPositionSelectionStatus", "passed"],
  ["splitRoomValidationStatus", "passed"]
]);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, { status, issue: String(issue), stage, checks });
if (status === "passed") updateGeometryTruthManifest(issue, { geometryRegressionSweepStatus: "passed" });
writeCloseout(issue, {
  title: "Geometry Regression Sweep",
  reviewFinding: "Geometry truth work needed a combined sweep across reference overlays, hallways/walls/support, and split-room parent-bed contracts.",
  status,
  filesChanged: ["scripts/check-geometry-regression-sweep.mjs", "docs/verification/geometry-truth-repair-manifest.json", `docs/verification/issues/issue-${issue}/`],
  commands,
  commandOutputMap: commands.map((command) => ({ command, outputs: [`docs/verification/issues/issue-${issue}/${stage}-output.json`] })),
  evidence: [`docs/verification/issues/issue-${issue}/reference-overlay-output.json`, `docs/verification/issues/issue-${issue}/hallways-walls-support-output.json`, `docs/verification/issues/issue-${issue}/split-room-parent-bed-output.json`, `docs/verification/issues/issue-${issue}/manifest-update-output.json`],
  limitations: ["Sweep is manifest-driven and local-first; GitHub Actions are not expanded."]
});
writeStageResult(issue, scriptName, stage, checks, { definitionOfDone: { geometryRegressionSweepStatus: status } });
if (status !== "passed") process.exitCode = 1;
