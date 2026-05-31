#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateGeometryTruthManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "775");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-artifact-quarantine-cleanup";
const title = "Artifact Quarantine and Cleanup";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-artifact-quarantine-cleanup.mjs --stage unknown-visuals-quarantined --issue 775",
  "node scripts/check-artifact-quarantine-cleanup.mjs --stage valid-geometry-preserved --issue 775",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "unknown-visuals-quarantined": checkUnknownVisualsQuarantined,
  "valid-geometry-preserved": checkValidGeometryPreserved
};

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, title, commands);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};

for (const stageName of selectedStages) {
  const runStage = stages[stageName];
  if (runStage == null) {
    throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  }
  const result = runStage();
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    artifactQuarantineCleanupStatus: "passed",
    unknownArtifactsNotNormalEditableGeometry: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      artifactQuarantineCleanupStatus: "passed",
      unknownArtifactsNotNormalEditableGeometry: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Unknown artifact-like visuals needed an explicit path away from normal editable geometry while preserving valid registered geometry.",
  filesChanged: [
    "apps/web/src/features/layout-editor/artifactQuarantine.ts",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-artifact-quarantine-cleanup.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/unknown-visuals-quarantined-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/valid-geometry-preserved-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/unknown-visuals-quarantined-output.json`,
    `docs/verification/issues/issue-${issue}/valid-geometry-preserved-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["The current issue adds the quarantine policy and detector; later renderer issues expand first-class geometry for walls and support areas."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkUnknownVisualsQuarantined() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/artifactQuarantine.ts", [
      "artifactQuarantinePolicy",
      "normalRendering: \"registry_only\"",
      "unknownVisuals: \"quarantine_as_reference_overlay\"",
      "quarantineUnknownVisuals",
      "quarantinedReferenceOverlays",
      "layer: \"reference_overlay\"",
      "sourceKind: \"reference\"",
      "editable: false",
      "removable: false",
      "Unknown visual is quarantined as locked reference overlay evidence."
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "artifactQuarantinePolicy",
      "data-artifact-quarantine-policy={artifactQuarantinePolicy.unknownVisuals}"
    ])
  ]);
}

function checkValidGeometryPreserved() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/artifactQuarantine.ts", [
      "RENDERED_OBJECT_REGISTRY",
      "renderableGeometry: registry",
      "registryIds.has(visual.renderId)",
      "registrySelectors.has(visual.selector)"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<HallwayShape",
      "<ZoneShape",
      "<SplitBayShape",
      "<RoomShape",
      "<DoorShape",
      "<SupportAccessPointShape",
      "<StationShape"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/renderedObjectRegistry.ts", [
      "editableGeometry(\"hallway\"",
      "editableGeometry(\"support-area\"",
      "editableGeometry(\"split-room-parent\"",
      "editableGeometry(\"room\"",
      "editableGeometry(\"door\"",
      "editableGeometry(\"support-access\"",
      "editableGeometry(\"nurse-station\""
    ])
  ]);
}
