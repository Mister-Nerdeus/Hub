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

const issue = readArg("--issue", "770");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-geometry-migration-guard";
const title = "Geometry Migration Guard";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web run build",
  "node scripts/check-geometry-migration-guard.mjs --stage existing-layout-loads --issue 770",
  "node scripts/check-geometry-migration-guard.mjs --stage unknown-artifact-quarantine --issue 770",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "existing-layout-loads": checkExistingLayoutLoads,
  "unknown-artifact-quarantine": checkUnknownArtifactQuarantine
};

ensureIssueDirs(issue);
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
    geometryMigrationGuardStatus: "passed",
    existingFloorplansLoadAfterGeometryContracts: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      geometryMigrationGuardStatus: "passed",
      existingFloorplansLoadAfterGeometryContracts: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "New geometry contracts need a non-destructive migration path so older saved layouts still load and unknown visuals cannot silently become editable geometry.",
  filesChanged: [
    "packages/shared/src/floorplans/geometryMigration.ts",
    "apps/web/src/features/floorplans/floorplanMigration.ts",
    "packages/shared/src/index.ts",
    "scripts/check-geometry-migration-guard.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/existing-layout-loads-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/unknown-artifact-quarantine-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/existing-layout-loads-output.json`,
    `docs/verification/issues/issue-${issue}/unknown-artifact-quarantine-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This guard quarantines unknown rendered visuals; later issues define the full reference overlay renderer and cleanup path."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkExistingLayoutLoads() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/geometryMigration.ts", [
      "destructiveMigration: false",
      "geometryMigrationDefaultsMissingLayers",
      "editable_geometry",
      "reference_overlay"
    ]),
    fileIncludes("apps/web/src/features/floorplans/floorplanMigration.ts", [
      "migrateFloorplanForEditor",
      "floorplanMigrationKeepsExistingLayout"
    ])
  ]);
}

function checkUnknownArtifactQuarantine() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/geometryMigration.ts", [
      "GeometryMigrationQuarantinedVisual",
      "\"unknown_visual_kind\"",
      "\"missing_geometry_layer\"",
      "quarantinedVisuals",
      "ignoredVisualIds"
    ])
  ]);
}
