#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  loadGeometryTruthManifest,
  readArg,
  statusFromChecks,
  updateGeometryTruthManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "810");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-geometry-truth-go-no-go";
const title = "Geometry Truth GO/NO-GO Audit";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "node scripts/check-geometry-truth-preflight.mjs --stage final --issue 810",
  "node scripts/check-no-phi-fields.mjs"
];

if (stage !== "final" && stage !== "manifest") {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);

const manifest = loadGeometryTruthManifest();
const requiredPassed = [
  "geometryTruthPreflightStatus",
  "geometryLayerContractStatus",
  "renderedObjectIdentityContractStatus",
  "editableGeometryRegistryStatus",
  "assignmentTargetContractStatus",
  "referenceOverlayContractStatus",
  "nonClickableArtifactDetectorStatus",
  "hallwayGeometryContractStatus",
  "hallwayRendererStatus",
  "outerWallGeometryContractStatus",
  "outerWallRendererStatus",
  "supportStorageAreaContractStatus",
  "supportStorageAreaRendererStatus",
  "geometryHitTestingStatus",
  "renderLayerOrderStatus",
  "splitRoomParentBedContractStatus",
  "convertRoomToSplitRoomStatus",
  "splitRoomRendererStatus",
  "splitBedPositionSelectionStatus",
  "splitRoomParentMoveStatus",
  "splitRoomParentResizeStatus",
  "splitDividerControlsStatus",
  "splitRoomAssignmentTargetGenerationStatus",
  "splitRoomValidationStatus",
  "geometrySaveReloadProofStatus",
  "geometryImportExportProofStatus",
  "geometryNoOverclaimStatus",
  "geometryRegressionSweepStatus"
];
const missing = requiredPassed.filter((key) => manifest[key] !== "passed");
const checks = [];
addCheck(checks, "required geometry truth manifest statuses passed", missing.length === 0, { missing });
addCheck(checks, "status doc keeps next milestone gated by stable assignment targets", checkStatusDoc().passed, checkStatusDoc());

const status = statusFromChecks(checks);
if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    geometryTruthGoNoGoStatus: "go_for_durable_assignment_foundation",
    assignmentTargetsStable: true,
    splitRoomParentBedModelStatus: "passed",
    goNoGoStatus: "go_for_next_milestone"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    missing,
    skippedPatch: {
      geometryTruthGoNoGoStatus: "go_for_durable_assignment_foundation",
      assignmentTargetsStable: true,
      splitRoomParentBedModelStatus: "passed",
      goNoGoStatus: "go_for_next_milestone"
    }
  });
}

writeJson(`docs/verification/issues/issue-${issue}/go-no-go-output.json`, {
  status,
  missing,
  manifestBeforeAudit: manifest
});

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "GO/NO-GO stays blocked unless each geometry truth contract and proof gate records a passed local manifest status.",
  filesChanged: [
    "scripts/check-geometry-truth-go-no-go.mjs",
    "docs/project/geometry-truth-repair-status.md",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: commands.map((command, index) => ({
    command,
    outputs: [`docs/verification/issues/issue-${issue}/${index === 5 ? "no-phi-output.txt" : "go-no-go-output.json"}`]
  })),
  evidence: [
    `docs/verification/issues/issue-${issue}/go-no-go-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    "docs/verification/geometry-truth-repair-manifest.json"
  ],
  limitations: ["Issue 810 cannot pass until the full geometry truth batch has written passing manifest statuses."]
});

writeStageResult(issue, scriptName, stage, checks, { missing });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkStatusDoc() {
  return fileIncludes("docs/project/geometry-truth-repair-status.md", [
    "Durable assignment foundation remains blocked",
    "stable assignment targets"
  ]);
}
