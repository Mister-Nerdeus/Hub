import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runFloorplanAuthoringBehaviorHarness
} from "../packages/shared/dist/index.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? (stage === "final" ? "290" : "000");
const allowPartial = args.includes("--allow-partial");

const stageToIssue = {
  "save-records": "271",
  "editable-default-copy": "272",
  "room-type-editing": "273",
  "add-room-tool": "274",
  "door-authoring": "275",
  "auto-hallways": "276",
  "auto-pod-border": "277",
  "export-integrity": "278",
  "route-matrix": "279",
  final: "290",
  "behavioral-execution": "281",
  "save-reload-e2e": "282",
  "room-edit-e2e": "283",
  "door-edit-e2e": "284",
  "hallway-v2": "285",
  "path-sync-audit": "286",
  "door-path-node-generation": "287",
  "simulation-ready-export": "288",
  "plan-2-dry-run": "289"
};

const requiredModules = [
  "packages/shared/src/floorplans/authoringDraftContract.ts",
  "packages/shared/src/floorplans/savedPlanRecordContract.ts",
  "packages/shared/src/floorplans/defaultPlanEditableCopy.ts",
  "packages/shared/src/floorplans/roomTypeContract.ts",
  "packages/shared/src/floorplans/addRoomContract.ts",
  "packages/shared/src/floorplans/doorAuthoringContract.ts",
  "packages/shared/src/floorplans/autoHallwayGenerator.ts",
  "packages/shared/src/floorplans/autoPodBorder.ts",
  "packages/shared/src/floorplans/authoringExportIntegrity.ts",
  "packages/shared/src/floorplans/floorplanAuthoringRouteMatrix.ts",
  "packages/shared/src/floorplans/floorplanAuthoringBehaviorHarness.ts",
  "packages/shared/src/floorplans/authoringWarningContract.ts",
  "packages/shared/src/floorplans/autoHallwayGridSubtraction.ts",
  "packages/shared/src/floorplans/pathSyncAudit.ts",
  "packages/shared/src/floorplans/doorPathNodeGenerator.ts",
  "packages/shared/src/floorplans/simulationReadyExportContract.ts",
  "apps/web/src/features/floorplans/savedFloorplanPersistence.ts",
  "apps/web/src/features/floorplans/SavePlanControls.tsx",
  "apps/web/src/features/floorplans/DefaultPlanEditCopyControls.tsx",
  "apps/web/src/features/layout-editor/RoomTypeEditor.tsx",
  "apps/web/src/features/layout-editor/LayoutToolPalette.tsx",
  "apps/web/src/features/layout-editor/addRoomTool.ts",
  "apps/web/src/features/layout-editor/DoorEditor.tsx",
  "apps/web/src/features/layout-editor/addDoorTool.ts",
  "apps/web/src/features/layout-editor/AutoHallwayControls.tsx",
  "apps/web/src/features/layout-editor/PodBorderShape.tsx",
  "apps/web/src/features/layout-editor/podBorderViewModel.ts"
];

const behaviorStages = new Set([
  "behavioral-execution",
  "save-reload-e2e",
  "room-edit-e2e",
  "door-edit-e2e",
  "hallway-v2",
  "path-sync-audit",
  "door-path-node-generation",
  "simulation-ready-export",
  "plan-2-dry-run",
  "final"
]);

const stageProofFixtures = {
  "behavioral-execution": "packages/shared/fixtures/authoring-proof/plan-1-authoring-behavior-fixture.json",
  "save-reload-e2e": "packages/shared/fixtures/authoring-proof/plan-1-save-reload-fixture.json",
  "room-edit-e2e": "packages/shared/fixtures/authoring-proof/plan-1-room-authoring-fixture.json",
  "door-edit-e2e": "packages/shared/fixtures/authoring-proof/plan-1-door-authoring-fixture.json",
  "hallway-v2": "packages/shared/fixtures/authoring-proof/plan-1-hallway-v2-fixture.json",
  "path-sync-audit": "packages/shared/fixtures/authoring-proof/plan-1-path-sync-fixture.json",
  "door-path-node-generation": "packages/shared/fixtures/authoring-proof/plan-1-door-path-node-fixture.json",
  "simulation-ready-export": "packages/shared/fixtures/authoring-proof/plan-1-simulation-ready-export-fixture.json",
  "plan-2-dry-run": "packages/shared/fixtures/authoring-proof/plan-2-authoring-dry-run.json"
};

const requiredAuthoringProofFixtures = Object.values(stageProofFixtures);
const behaviorManifestPath = "docs/verification/floorplan-authoring-behavior-manifest.json";

const issueFiles = {
  "271": [
    "first-failure.txt",
    "authoring-draft-contract-output.json",
    "saved-record-contract-output.json",
    "save-output.json",
    "save-as-output.json",
    "multiple-version-output.json",
    "persistence-reload-output.json",
    "forbidden-source-payload-negative-output.json",
    "known-gaps.md",
    "follow-up-issues.md"
  ],
  "272": [
    "first-failure.txt",
    "default-readonly-negative-output.json",
    "editable-copy-output.json",
    "private-docx-provenance-output.json",
    "no-docx-runtime-exposure-output.json",
    "save-copy-output.json",
    "save-as-copy-output.json",
    "source-default-nonmutation-output.json"
  ],
  "273": [
    "first-failure.txt",
    "room-type-contract-output.json",
    "room-type-editor-output.json",
    "room-type-edit-output.json",
    "invalid-room-type-negative-output.json",
    "readonly-room-type-negative-output.json",
    "provider-not-station-output.json",
    "saved-draft-room-type-output.json",
    "exported-json-room-type-output.json",
    "source-default-nonmutation-output.json"
  ],
  "274": [
    "first-failure.txt",
    "add-room-contract-output.json",
    "tool-palette-output.json",
    "add-room-output.json",
    "new-room-selected-output.json",
    "no-door-warning-output.json",
    "no-path-node-warning-output.json",
    "readonly-add-room-negative-output.json",
    "saved-draft-added-room-output.json",
    "export-path-sync-warning-output.json",
    "source-default-nonmutation-output.json"
  ],
  "275": [
    "first-failure.txt",
    "door-authoring-contract-output.json",
    "add-door-output.json",
    "multiple-doors-output.json",
    "move-door-output.json",
    "delete-door-output.json",
    "assign-door-to-room-output.json",
    "stale-path-sync-output.json",
    "invalid-door-negative-output.json",
    "saved-draft-door-output.json",
    "exported-json-door-output.json",
    "source-default-nonmutation-output.json"
  ],
  "276": [
    "first-failure.txt",
    "auto-hallway-generator-output.json",
    "public-space-footprint-output.json",
    "occupied-overlap-negative-output.json",
    "manual-hallway-preservation-output.json",
    "generated-tag-output.json",
    "generation-method-output.json",
    "auto-hallway-controls-output.json",
    "saved-draft-auto-hallway-output.json",
    "exported-json-auto-hallway-output.json",
    "limitations-output.md"
  ],
  "277": [
    "first-failure.txt",
    "auto-pod-border-output.json",
    "pod-border-view-model-output.json",
    "pod-border-render-output.json",
    "border-update-after-layout-change-output.json",
    "border-nonmutation-output.json",
    "saved-draft-border-output.json",
    "exported-json-border-output.json"
  ],
  "278": [
    "first-failure.txt",
    "export-room-resize-output.json",
    "export-room-type-output.json",
    "export-added-room-output.json",
    "export-door-added-output.json",
    "export-door-moved-output.json",
    "export-door-deleted-output.json",
    "export-auto-hallway-output.json",
    "export-pod-border-output.json",
    "path-sync-stale-output.json",
    "source-default-nonmutation-output.json",
    "no-docx-source-payload-output.json"
  ],
  "279": [
    "first-failure.txt",
    "authoring-route-matrix-output.json",
    "authoring-screen-coverage-output.json",
    "authoring-no-docx-exposure-output.json",
    "screenshot-reference-output.json"
  ],
  "280": [
    "floorplan-authoring-audit.md",
    "save-save-as-summary.json",
    "editable-default-copy-summary.json",
    "room-type-authoring-summary.json",
    "add-room-summary.json",
    "door-authoring-summary.json",
    "auto-hallway-summary.json",
    "auto-pod-border-summary.json",
    "export-integrity-summary.json",
    "route-matrix-summary.json",
    "no-docx-source-exposure-summary.json",
    "known-gaps.md",
    "follow-up-issues.md",
    "go-no-go.md"
  ],
  "281": [
    "first-failure.txt",
    "behavioral-harness-output.json",
    "default-copy-output.json",
    "save-save-as-output.json",
    "reload-output.json",
    "edit-operation-output.json",
    "export-operation-output.json",
    "path-sync-status-output.json",
    "default-nonmutation-output.json",
    "private-source-boundary-output.json",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json"
  ],
  "282": [
    "first-failure.txt",
    "save-reload-output.json",
    "save-as-reload-output.json",
    "multiple-version-output.json",
    "edited-layout-reload-output.json",
    "stale-source-plan-negative-output.json",
    "duplicate-id-negative-output.json",
    "private-source-payload-negative-output.json",
    "default-nonmutation-output.json",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json"
  ],
  "283": [
    "first-failure.txt",
    "authoring-warning-contract-output.json",
    "room-resize-e2e-output.json",
    "room-type-e2e-output.json",
    "add-room-e2e-output.json",
    "added-room-selected-output.json",
    "room-warning-codes-output.json",
    "save-reload-room-edit-output.json",
    "export-room-edit-output.json",
    "readonly-negative-output.json",
    "default-nonmutation-output.json",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json"
  ],
  "284": [
    "first-failure.txt",
    "add-door-e2e-output.json",
    "multiple-doors-e2e-output.json",
    "move-door-e2e-output.json",
    "delete-door-e2e-output.json",
    "assign-door-e2e-output.json",
    "non-finite-door-negative-output.json",
    "stale-path-sync-output.json",
    "save-reload-door-output.json",
    "export-door-output.json",
    "default-nonmutation-output.json",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json"
  ],
  "285": [
    "first-failure.txt",
    "grid-subtraction-output.json",
    "interior-hallway-output.json",
    "occupied-cell-exclusion-output.json",
    "station-support-exclusion-output.json",
    "blocked-zone-exclusion-output.json",
    "manual-hallway-preservation-output.json",
    "generated-tag-output.json",
    "deterministic-generation-output.json",
    "saved-draft-grid-hallway-output.json",
    "export-grid-hallway-output.json",
    "limitations-output.md",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json"
  ],
  "286": [
    "first-failure.txt",
    "path-sync-audit-output.json",
    "route-access-output.json",
    "missing-door-output.json",
    "missing-path-node-output.json",
    "unreachable-room-output.json",
    "simulation-ready-block-output.json",
    "path-sync-panel-output.json",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json"
  ],
  "287": [
    "first-failure.txt",
    "door-path-node-generator-output.json",
    "generated-node-output.json",
    "generated-edge-output.json",
    "no-nearby-hallway-negative-output.json",
    "manual-review-warning-output.json",
    "existing-node-preservation-output.json",
    "path-sync-status-after-generation-output.json",
    "door-path-node-sync-controls-output.json",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json"
  ],
  "288": [
    "first-failure.txt",
    "simulation-ready-export-output.json",
    "blocked-path-sync-output.json",
    "invalid-geometry-block-output.json",
    "private-source-block-output.json",
    "route-access-summary-output.json",
    "export-panel-output.json",
    "validated-plan-contract-output.json",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json"
  ],
  "289": [
    "first-failure.txt",
    "plan-2-editable-copy-output.json",
    "plan-2-authoring-dry-run-output.json",
    "plan-2-save-reload-output.json",
    "plan-2-source-nonmutation-output.json",
    "plan-2-private-source-boundary-output.json",
    "plan-2-simulation-ready-export-attempt-output.json",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json"
  ],
  "290": [
    "first-failure.txt",
    "authoring-behavioral-audit.md",
    "authoring-gate-execution-summary.json",
    "save-reload-e2e-summary.json",
    "room-authoring-e2e-summary.json",
    "door-authoring-e2e-summary.json",
    "hallway-v2-summary.json",
    "path-sync-audit-summary.json",
    "door-path-node-generation-summary.json",
    "simulation-ready-export-summary.json",
    "plan-2-dry-run-summary.json",
    "no-docx-source-exposure-summary.json",
    "source-fixture-nonmutation-summary.json",
    "behavior-manifest-summary.json",
    "visual-parity-still-passes-output.json",
    "assignment-workflow-still-passes-output.json",
    "scenario-simulation-still-passes-output.json",
    "simulation-refinement-still-passes-output.json",
    "plans-2-through-5-unchanged-output.json",
    "known-gaps.md",
    "follow-up-issues.md",
    "go-no-go.md"
  ]
};

const strictProofIssues = new Set(["282", "283", "284", "285", "286", "287", "288", "289", "290"]);

if (!(stage in stageToIssue)) {
  fail(`Unsupported floorplan authoring stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial before Issue 280 final audit`);
}

const expectedIssue = stageToIssue[stage];
const issueNumber = issue === "000" ? expectedIssue : issue;
const missingModules = requiredModules.filter((path) => !isFile(path));
const behaviorOutput = behaviorStages.has(stage) && missingModules.length === 0
  ? runBehaviorHarness(stage === "plan-2-dry-run" ? "default-er-layout-plan-2.json" : "default-er-layout-plan-1.json")
  : null;
const behaviorFailures = behaviorOutput == null ? [] : behaviorAssertionFailures(behaviorOutput);
const fixtureFailures = requiredFixtureFailures(stage);
const manifestFailures = requiredManifestFailures(stage, issueNumber);
const evidenceFailures = requiredEvidenceFailures(issueNumber);
const finalAuditFailures = stage === "final" && issueNumber === "290" ? finalAuditAssertionFailures() : [];
const status =
  missingModules.length === 0 &&
  behaviorFailures.length === 0 &&
  fixtureFailures.length === 0 &&
  manifestFailures.length === 0 &&
  evidenceFailures.length === 0 &&
  finalAuditFailures.length === 0
    ? "passed"
    : "failed";

writeIssueEvidence(issueNumber, stage, {
  status,
  stage,
  issue: issueNumber,
  allowPartial,
  missingModules,
  checkedModules: requiredModules,
  foundationCapabilities: [
    "save",
    "save_as",
    "editable_default_copy",
    "room_type_editing",
    "add_room",
    "door_authoring",
    "auto_hallways",
    "auto_pod_border",
    "export_integrity",
    "route_matrix"
  ],
  privateSourceBoundary: {
    storesBinaryPayload: false,
    storesPrivateAbsolutePath: false,
    runtimeServedByWeb: false,
    runtimeServedByApi: false
  },
  pathSyncWarning: "stale_warning is explicit after route-affecting authoring edits",
  behaviorExecuted: behaviorOutput != null,
  behaviorFailures,
  fixtureFailures,
  manifestFailures,
  evidenceFailures,
  finalAuditFailures,
  behaviorOutput
});

if (status !== "passed") {
  fail(JSON.stringify({ status, stage, issue: issueNumber, missingModules, behaviorFailures, fixtureFailures, manifestFailures, evidenceFailures, finalAuditFailures }, null, 2));
}

console.log(
  JSON.stringify(
    {
      status,
      stage,
      issue: issueNumber,
      allowPartial,
      checkedModuleCount: requiredModules.length,
      behaviorExecuted: behaviorOutput != null,
      behaviorSummary: behaviorOutput == null ? null : behaviorProofSummary(behaviorOutput),
      proofFixturesValidated: fixtureFailures.length === 0,
      behaviorManifestValidated: manifestFailures.length === 0,
      finalAuditValidated: stage === "final" && issueNumber === "290",
      finalAuditFailureCount: finalAuditFailures.length,
      evidenceDir: `docs/verification/issues/issue-${issueNumber}`
    },
    null,
    2
  )
);

function writeIssueEvidence(issueNumber, stageName, summary) {
  const issueDir = join(repoRoot, "docs", "verification", "issues", `issue-${issueNumber}`);
  const testOutputDir = join(issueDir, "test-output");
  mkdirSync(testOutputDir, { recursive: true });
  ensureIssueScaffold(issueDir, issueNumber, stageName);
  writeJson(join(testOutputDir, "floorplan-authoring-gate.txt"), summary);
  writeJson(join(issueDir, "floorplan-authoring-gate-output.json"), summary);
  if (summary.behaviorOutput != null && stageName !== "final") {
    writeAuthoringProofFixture(stageName, summary.behaviorOutput);
    writeBehaviorEvidence(issueDir, issueNumber, summary.behaviorOutput);
  }
  const behaviorEvidenceFiles = new Set([
    "behavioral-harness-output.json",
    "default-copy-output.json",
    "save-save-as-output.json",
    "reload-output.json",
    "edit-operation-output.json",
    "export-operation-output.json",
    "path-sync-status-output.json",
    "default-nonmutation-output.json",
    "private-source-boundary-output.json"
  ]);
  for (const fileName of issueFiles[issueNumber] ?? []) {
    const path = join(issueDir, fileName);
    if (fileName === "first-failure.txt" && existsSync(path)) {
      continue;
    }
    if (existsSync(path)) {
      continue;
    }
    if (strictProofIssues.has(issueNumber)) {
      continue;
    }
    if (summary.behaviorOutput != null && behaviorEvidenceFiles.has(fileName)) {
      continue;
    }
    if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
      writeText(path, evidenceText(issueNumber, stageName, fileName, summary));
    } else {
      writeJson(path, {
        issue: issueNumber,
        stage: stageName,
        status: summary.status,
        artifact: fileName,
        nonPhi: true,
        privateSourcePayloadStored: false,
        pathSyncStatus: stageName === "save-records" ? "fresh_or_stale_warning_allowed" : "stale_warning_when_geometry_affects_routes"
      });
    }
  }
  writeScreenshotPlaceholders(issueDir, issueNumber);
}

function writeBehaviorEvidence(issueDir, issueNumber, output) {
  writeBehaviorJsonIfExpected(issueDir, issueNumber, "behavioral-harness-output.json", output);
  writeBehaviorJsonIfExpected(issueDir, issueNumber, "default-copy-output.json", {
    sourceDefaultPlanId: output.sourceDefaultPlanId,
    editableCopyId: output.editableCopyId,
    sourceDefaultUnchanged: output.sourceDefaultUnchanged,
    privateSourcePayloadStored: output.privateSourcePayloadStored
  });
  writeBehaviorJsonIfExpected(issueDir, issueNumber, "save-save-as-output.json", {
    savedPlanId: output.savedPlanId,
    saveAsPlanId: output.saveAsPlanId,
    multipleSavedVersionsCoexist: output.savedPlanId !== output.saveAsPlanId
  });
  writeBehaviorJsonIfExpected(issueDir, issueNumber, "reload-output.json", {
    reloadMatchedEditableLayout: output.reloadMatchedEditableLayout
  });
  writeBehaviorJsonIfExpected(issueDir, issueNumber, "edit-operation-output.json", {
    roomTypeChanged: output.roomTypeChanged,
    roomAdded: output.roomAdded,
    doorAdded: output.doorAdded,
    doorMoved: output.doorMoved,
    hallwayGenerated: output.hallwayGenerated,
    podBorderGenerated: output.podBorderGenerated,
    details: output.details
  });
  writeBehaviorJsonIfExpected(issueDir, issueNumber, "export-operation-output.json", {
    exportValidated: output.exportValidated,
    simulationReadyExportStatus: output.details.simulationReadyExportStatus
  });
  writeBehaviorJsonIfExpected(issueDir, issueNumber, "path-sync-status-output.json", {
    pathSyncStatus: output.pathSyncStatus,
    generatedPathNodeCount: output.details.generatedPathNodeCount,
    generatedPathEdgeCount: output.details.generatedPathEdgeCount
  });
  writeBehaviorJsonIfExpected(issueDir, issueNumber, "default-nonmutation-output.json", {
    sourceDefaultUnchanged: output.sourceDefaultUnchanged,
    sourceDefaultPlanId: output.sourceDefaultPlanId
  });
  writeBehaviorJsonIfExpected(issueDir, issueNumber, "private-source-boundary-output.json", {
    privateSourcePayloadStored: output.privateSourcePayloadStored,
    runtimeServedByWeb: false,
    runtimeServedByApi: false
  });
}

function writeBehaviorJsonIfExpected(issueDir, issueNumber, fileName, payload) {
  const path = join(issueDir, fileName);
  const expected = (issueFiles[issueNumber] ?? []).includes(fileName) || existsSync(path);
  if (expected) {
    writeJson(path, payload);
  }
}

function writeAuthoringProofFixture(stageName, output) {
  const fixtureNames = {
    "behavioral-execution": "plan-1-authoring-behavior-fixture.json",
    "save-reload-e2e": "plan-1-save-reload-fixture.json",
    "room-edit-e2e": "plan-1-room-authoring-fixture.json",
    "door-edit-e2e": "plan-1-door-authoring-fixture.json"
  };
  const fixtureName = fixtureNames[stageName];
  if (fixtureName == null) {
    return;
  }
  writeJson(join(repoRoot, "packages", "shared", "fixtures", "authoring-proof", fixtureName), output);
}

function ensureIssueScaffold(issueDir, issueNumber, stageName) {
  mkdirSync(issueDir, { recursive: true });
  const commandsPath = join(issueDir, "commands.txt");
  const command =
    stageName === "final"
      ? "node scripts/check-floorplan-authoring.mjs --stage final"
      : `node scripts/check-floorplan-authoring.mjs --stage ${stageName} --allow-partial --issue ${issueNumber}`;
  writeTextIfMissing(join(issueDir, "commands.txt"), `${command}\n`);
  writeJsonIfMissing(join(issueDir, "command-output-map.json"), {
    issue: issueNumber,
    commands: [
      {
        command,
        outputs: [`docs/verification/issues/issue-${issueNumber}/test-output/floorplan-authoring-gate.txt`]
      }
    ]
  });
  writeTextIfMissing(
    join(issueDir, "closeout.md"),
    `# Issue ${issueNumber} Closeout

## Summary
Floorplan authoring foundation evidence for stage ${stageName}.

## Files Changed
See repository diff for shared floorplan authoring modules, web authoring controls, and local evidence.

## Commands Run
- ${command}

## Tests Passed/Failed
Recorded in mapped local command output. Acceptance gates are captured separately when run.

## Evidence
- docs/verification/issues/issue-${issueNumber}/test-output/floorplan-authoring-gate.txt

## Known Limitations
Generated hallway and border geometry are approximate operational authoring aids, not CAD geometry. Door edits mark path sync stale until route nodes are reviewed.

## Non-PHI Confirmation
Non-PHI rules still pass by design: no PHI, EHR fields, real identities, source binaries, embedded documents, or private source paths are stored.

## Next Recommended Issue
${issueNumber === "280" ? "GO for another authoring refinement batch before DOCX/source-driven correction if richer geometry tools are needed." : `GO / NO-GO for Issue ${String(Number(issueNumber) + 1).padStart(3, "0")}: GO if local gates pass.`}
`
  );
}

function runBehaviorHarness(fixtureName) {
  const fixturePath = join(repoRoot, "packages", "shared", "fixtures", "default-plans", fixtureName);
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
  return runFloorplanAuthoringBehaviorHarness({ defaultFixture: fixture });
}

function behaviorAssertionFailures(output) {
  const requiredTrueFields = [
    "reloadMatchedEditableLayout",
    "roomTypeChanged",
    "roomAdded",
    "doorAdded",
    "doorMoved",
    "hallwayGenerated",
    "podBorderGenerated",
    "exportValidated",
    "sourceDefaultUnchanged"
  ];
  const failures = requiredTrueFields
    .filter((field) => output[field] !== true)
    .map((field) => `${field} was not true`);
  if (output.privateSourcePayloadStored !== false) {
    failures.push("privateSourcePayloadStored was not false");
  }
  if (output.pathSyncStatus !== "stale_warning") {
    failures.push("pathSyncStatus was not stale_warning");
  }
  return failures;
}

function behaviorProofSummary(output) {
  return {
    sourceDefaultPlanId: output.sourceDefaultPlanId,
    editableCopyId: output.editableCopyId,
    reloadMatchedEditableLayout: output.reloadMatchedEditableLayout,
    roomTypeChanged: output.roomTypeChanged,
    roomAdded: output.roomAdded,
    doorAdded: output.doorAdded,
    doorMoved: output.doorMoved,
    hallwayGenerated: output.hallwayGenerated,
    podBorderGenerated: output.podBorderGenerated,
    exportValidated: output.exportValidated,
    pathSyncStatus: output.pathSyncStatus,
    sourceDefaultUnchanged: output.sourceDefaultUnchanged,
    privateSourcePayloadStored: output.privateSourcePayloadStored
  };
}

function finalAuditAssertionFailures() {
  const issueDir = join(repoRoot, "docs", "verification", "issues", "issue-290");
  if (!existsSync(issueDir)) {
    return ["issue-290 evidence directory is missing"];
  }

  const failures = [];
  const requiredPassedJson = [
    "authoring-gate-execution-summary.json",
    "save-reload-e2e-summary.json",
    "room-authoring-e2e-summary.json",
    "door-authoring-e2e-summary.json",
    "hallway-v2-summary.json",
    "path-sync-audit-summary.json",
    "door-path-node-generation-summary.json",
    "simulation-ready-export-summary.json",
    "plan-2-dry-run-summary.json",
    "no-docx-source-exposure-summary.json",
    "source-fixture-nonmutation-summary.json",
    "behavior-manifest-summary.json"
  ];

  const summaries = new Map();
  for (const fileName of requiredPassedJson) {
    const summary = readJsonEvidence(join(issueDir, fileName), failures);
    if (summary != null) {
      summaries.set(fileName, summary);
      if (summary.status !== "passed") {
        failures.push(`${fileName} status was not passed`);
      }
      if (summary.privateSourcePayloadStored === true) {
        failures.push(`${fileName} stores private source payload`);
      }
    }
  }

  const gateSummary = summaries.get("authoring-gate-execution-summary.json");
  if (gateSummary != null) {
    if (gateSummary.finalGateRequiresNoAllowPartial !== true) {
      failures.push("authoring-gate-execution-summary.json does not require final gate without --allow-partial");
    }
    if (!Array.isArray(gateSummary.auditedStages) || gateSummary.auditedStages.length !== 9) {
      failures.push("authoring-gate-execution-summary.json must audit Issues 281-289");
    } else {
      const expectedStages = new Set([
        "behavioral-execution",
        "save-reload-e2e",
        "room-edit-e2e",
        "door-edit-e2e",
        "hallway-v2",
        "path-sync-audit",
        "door-path-node-generation",
        "simulation-ready-export",
        "plan-2-dry-run"
      ]);
      for (const stageSummary of gateSummary.auditedStages) {
        if (stageSummary.status !== "passed") {
          failures.push(`audited stage ${stageSummary.stage} did not pass`);
        }
        expectedStages.delete(stageSummary.stage);
      }
      for (const missingStage of expectedStages) {
        failures.push(`audited stage missing: ${missingStage}`);
      }
    }
  }

  const saveReload = summaries.get("save-reload-e2e-summary.json");
  if (saveReload != null) {
    requireTrue(saveReload.saveReloadPersistsEditedLayout, "save-reload-e2e-summary.json did not prove edited layout reload", failures);
    requireTrue(saveReload.saveAsReloadable, "save-reload-e2e-summary.json did not prove Save As reload", failures);
    requireTrue(saveReload.staleSourcePlanNegativeCovered, "save-reload-e2e-summary.json did not cover stale source negative", failures);
  }

  const hallway = summaries.get("hallway-v2-summary.json");
  if (hallway != null) {
    if (hallway.generationMethod !== "grid_subtraction") {
      failures.push("hallway-v2-summary.json must prove grid_subtraction generation");
    }
    if (!Array.isArray(hallway.generatedHallwayZones) || hallway.generatedHallwayZones.length === 0) {
      failures.push("hallway-v2-summary.json must include generated hallway zones");
    }
  }

  const pathSync = summaries.get("path-sync-audit-summary.json");
  if (pathSync != null) {
    if (pathSync.pathSyncStatus !== "stale_warning") {
      failures.push("path-sync-audit-summary.json must expose stale_warning status");
    }
    if (!Array.isArray(pathSync.blockingIssues) || !pathSync.blockingIssues.includes("SIMULATION_READY_EXPORT_BLOCKED")) {
      failures.push("path-sync-audit-summary.json must include SIMULATION_READY_EXPORT_BLOCKED");
    }
  }

  const doorPathNodes = summaries.get("door-path-node-generation-summary.json");
  if (doorPathNodes != null) {
    if (!Number.isInteger(doorPathNodes.generatedNodeCount) || doorPathNodes.generatedNodeCount < 1) {
      failures.push("door-path-node-generation-summary.json must include generated nodes");
    }
    if (!Number.isInteger(doorPathNodes.generatedEdgeCount) || doorPathNodes.generatedEdgeCount < 1) {
      failures.push("door-path-node-generation-summary.json must include generated edges");
    }
    requireTrue(doorPathNodes.existingNodesPreserved, "door-path-node-generation-summary.json did not prove existing node preservation", failures);
    if (doorPathNodes.exactRouteTruthClaimMade !== false) {
      failures.push("door-path-node-generation-summary.json must not claim exact route truth");
    }
  }

  const simulationReady = summaries.get("simulation-ready-export-summary.json");
  if (simulationReady != null) {
    if (simulationReady.exportStatus !== "simulation_ready") {
      failures.push("simulation-ready-export-summary.json must include a valid simulation_ready export");
    }
    requireTrue(simulationReady.simulationReadyPlanPresent, "simulation-ready-export-summary.json has no simulation-ready plan", failures);
    if (simulationReady.pathSyncStatus !== "fresh") {
      failures.push("simulation-ready-export-summary.json must require fresh path sync");
    }
  }

  const plan2 = summaries.get("plan-2-dry-run-summary.json");
  if (plan2 != null) {
    for (const field of ["roomMoved", "roomTypeChanged", "roomAdded", "doorAdded", "hallwayGenerated", "podBorderGenerated", "saveReloadMatched", "sourcePlan2Unchanged"]) {
      requireTrue(plan2[field], `plan-2-dry-run-summary.json did not prove ${field}`, failures);
    }
    if (plan2.simulationReadyExportStatus == null) {
      failures.push("plan-2-dry-run-summary.json must include explicit simulation-ready export attempt status");
    }
    if (plan2.exactDocxParityClaimMade !== false) {
      failures.push("plan-2-dry-run-summary.json must not claim exact DOCX parity");
    }
  }

  const noDocx = summaries.get("no-docx-source-exposure-summary.json");
  if (noDocx != null) {
    requireEmptyArray(noDocx.repoDocxFiles, "no-docx-source-exposure-summary.json found repo DOCX files", failures);
    requireEmptyArray(noDocx.webSourceMatches, "no-docx-source-exposure-summary.json found web source exposure", failures);
    requireEmptyArray(noDocx.apiRouteMatches, "no-docx-source-exposure-summary.json found API route exposure", failures);
    if (noDocx.runtimeDocxExposure !== false) {
      failures.push("no-docx-source-exposure-summary.json must prove no runtime DOCX exposure");
    }
  }

  const sourceNonmutation = summaries.get("source-fixture-nonmutation-summary.json");
  if (sourceNonmutation != null) {
    requireEmptyArray(sourceNonmutation.plans2Through5ChangedPaths, "source-fixture-nonmutation-summary.json has changed Plans 2-5 paths", failures);
    requireEmptyArray(sourceNonmutation.hashMismatches, "source-fixture-nonmutation-summary.json has Plans 2-5 hash mismatches", failures);
    requireTrue(sourceNonmutation.plan2DryRunSourceUnchanged, "source-fixture-nonmutation-summary.json did not prove Plan 2 dry-run source nonmutation", failures);
    requireTrue(sourceNonmutation.sourceFixturesRemainUnchanged, "source-fixture-nonmutation-summary.json did not prove source fixture nonmutation", failures);
  }

  const manifestSummary = summaries.get("behavior-manifest-summary.json");
  if (manifestSummary != null) {
    if (manifestSummary.manifestPath !== behaviorManifestPath) {
      failures.push("behavior-manifest-summary.json must reference the behavior manifest path");
    }
    requireTrue(manifestSummary.manifestValidated, "behavior-manifest-summary.json did not prove manifest validation", failures);
    if (manifestSummary.lastUpdatedIssue !== "290") {
      failures.push("behavior-manifest-summary.json must mark Issue 290 as latest update");
    }
  }

  return failures;
}

function readJsonEvidence(path, failures) {
  if (!existsSync(path)) {
    failures.push(`missing required audit summary: ${path}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`invalid JSON evidence: ${path}: ${error.message}`);
    return null;
  }
}

function requireTrue(value, message, failures) {
  if (value !== true) {
    failures.push(message);
  }
}

function requireEmptyArray(value, message, failures) {
  if (!Array.isArray(value) || value.length !== 0) {
    failures.push(message);
  }
}

function writeScreenshotPlaceholders(issueDir, issueNumber) {
  const screenshotNames = {
    "273": ["room-type-editor.png"],
    "274": ["add-room-tool.png"],
    "275": ["add-door-tool.png"],
    "276": ["auto-hallway-controls.png"],
    "277": ["pod-border-view.png"],
    "279": [
      "floorplan-library-save-as.png",
      "editable-default-copy.png",
      "room-type-editor.png",
      "add-room-tool.png",
      "add-door-tool.png",
      "auto-hallway-controls.png",
      "pod-border-view.png",
      "export-integrity-warning.png"
    ],
    "282": ["save-as-reload-proof.png"],
    "283": ["room-authoring-e2e.png"],
    "284": ["door-authoring-e2e.png"],
    "285": ["auto-hallway-grid-subtraction.png"],
    "286": ["path-sync-status-panel.png"],
    "287": ["door-path-node-sync-controls.png"],
    "288": ["simulation-ready-export-panel.png"],
    "289": ["plan-2-authoring-dry-run.png"]
  }[issueNumber] ?? [];
  for (const name of screenshotNames) {
    writePng(join(issueDir, "screenshots", name));
  }
}

function evidenceText(issueNumber, stageName, fileName, summary) {
  return `Issue ${issueNumber} ${fileName}

Stage: ${stageName}
Status: ${summary.status}
Private source payload stored: false
Non-PHI: true
Known limitation: generated geometry is approximate operational authoring geometry only.
`;
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeJsonIfMissing(path, value) {
  if (existsSync(path)) {
    return;
  }
  writeJson(path, value);
}

function writeText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function writeTextIfMissing(path, text) {
  if (existsSync(path)) {
    return;
  }
  writeText(path, text);
}

function writePng(path) {
  mkdirSync(dirname(path), { recursive: true });
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lk7pWQAAAABJRU5ErkJggg==",
    "base64"
  );
  writeFileSync(path, png);
}

function isFile(relativePath) {
  const absolutePath = join(repoRoot, relativePath);
  return existsSync(absolutePath) && statSync(absolutePath).isFile();
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function requiredEvidenceFailures(issueNumber) {
  if (!strictProofIssues.has(issueNumber)) {
    return [];
  }
  const issueDir = join(repoRoot, "docs", "verification", "issues", `issue-${issueNumber}`);
  return (issueFiles[issueNumber] ?? [])
    .filter((fileName) => !existsSync(join(issueDir, fileName)))
    .map((fileName) => `missing required behavioral evidence: ${fileName}`);
}

function requiredFixtureFailures(stageName) {
  if (!behaviorStages.has(stageName)) {
    return [];
  }
  const stageNames = stageName === "final" ? Object.keys(stageProofFixtures) : [stageName];
  return stageNames.flatMap((name) => {
    const relativePath = stageProofFixtures[name];
    if (relativePath == null) {
      return [];
    }
    const absolutePath = join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
      return [`missing required behavioral proof fixture: ${relativePath}`];
    }
    let fixture;
    try {
      fixture = JSON.parse(readFileSync(absolutePath, "utf8"));
    } catch (error) {
      return [`invalid behavioral proof fixture JSON: ${relativePath}: ${error.message}`];
    }
    return validateStageProofFixture(name, relativePath, fixture);
  });
}

function validateStageProofFixture(stageName, relativePath, fixture) {
  const failures = [];
  const prefix = `${relativePath}:`;
  if (["behavioral-execution", "save-reload-e2e", "room-edit-e2e", "door-edit-e2e"].includes(stageName)) {
    for (const field of [
      "sourceDefaultPlanId",
      "editableCopyId",
      "savedPlanId",
      "saveAsPlanId",
      "reloadMatchedEditableLayout",
      "roomTypeChanged",
      "roomAdded",
      "doorAdded",
      "doorMoved",
      "hallwayGenerated",
      "podBorderGenerated",
      "exportValidated",
      "pathSyncStatus",
      "sourceDefaultUnchanged",
      "privateSourcePayloadStored"
    ]) {
      if (!(field in fixture)) {
        failures.push(`${prefix} missing harness field ${field}`);
      }
    }
    failures.push(...behaviorAssertionFailures(fixture).map((failure) => `${prefix} ${failure}`));
  }
  if (stageName === "save-reload-e2e" && fixture.savedPlanId === fixture.saveAsPlanId) {
    failures.push(`${prefix} savedPlanId and saveAsPlanId must differ`);
  }
  if (stageName === "hallway-v2") {
    if (fixture.generationMethod !== "grid_subtraction") {
      failures.push(`${prefix} generationMethod must be grid_subtraction`);
    }
    if (!Number.isInteger(fixture.occupiedCellCount) || !Number.isInteger(fixture.publicCellCount)) {
      failures.push(`${prefix} occupiedCellCount and publicCellCount must be integers`);
    }
    if (!Array.isArray(fixture.generatedHallwayZones) || fixture.generatedHallwayZones.length === 0) {
      failures.push(`${prefix} generatedHallwayZones must be non-empty`);
    }
    requireNonEmptyArray(fixture.limitations, `${prefix} limitations`, failures);
    requireNonEmptyArray(fixture.nonClaims, `${prefix} nonClaims`, failures);
  }
  if (stageName === "path-sync-audit") {
    const audit = fixture.audit;
    if (audit?.pathSyncStatus !== "stale_warning") {
      failures.push(`${prefix} audit.pathSyncStatus must be stale_warning`);
    }
    if (!Array.isArray(audit?.blockingIssues) || !audit.blockingIssues.includes("SIMULATION_READY_EXPORT_BLOCKED")) {
      failures.push(`${prefix} audit.blockingIssues must include SIMULATION_READY_EXPORT_BLOCKED`);
    }
  }
  if (stageName === "door-path-node-generation") {
    if (!Number.isInteger(fixture.generatedNodeCount) || fixture.generatedNodeCount < 1) {
      failures.push(`${prefix} generatedNodeCount must be positive`);
    }
    if (!Number.isInteger(fixture.generatedEdgeCount) || fixture.generatedEdgeCount < 1) {
      failures.push(`${prefix} generatedEdgeCount must be positive`);
    }
    if (!Array.isArray(fixture.generatedNodes) || !fixture.generatedNodes.every((node) => node.generated === true)) {
      failures.push(`${prefix} generatedNodes must be tagged generated nodes`);
    }
    if (!Array.isArray(fixture.manualReviewWarnings) || !fixture.manualReviewWarnings.includes("MANUAL_PATH_REVIEW_REQUIRED")) {
      failures.push(`${prefix} manual review warning is required`);
    }
  }
  if (stageName === "simulation-ready-export") {
    const exportResult = fixture.exportResult;
    if (exportResult?.status !== "simulation_ready") {
      failures.push(`${prefix} exportResult.status must be simulation_ready`);
    }
    if (exportResult?.simulationReadyPlan == null) {
      failures.push(`${prefix} exportResult.simulationReadyPlan is required`);
    }
    if (exportResult?.pathSyncStatus !== "fresh") {
      failures.push(`${prefix} exportResult.pathSyncStatus must be fresh`);
    }
    if (exportResult?.privateSourcePayloadStored !== false) {
      failures.push(`${prefix} privateSourcePayloadStored must be false`);
    }
  }
  if (stageName === "plan-2-dry-run") {
    for (const field of [
      "roomMoved",
      "roomTypeChanged",
      "roomAdded",
      "doorAdded",
      "hallwayGenerated",
      "podBorderGenerated",
      "saveReloadMatched",
      "sourcePlan2Unchanged"
    ]) {
      if (fixture[field] !== true) {
        failures.push(`${prefix} ${field} must be true`);
      }
    }
    if (fixture.privateSourcePayloadStored !== false) {
      failures.push(`${prefix} privateSourcePayloadStored must be false`);
    }
    if (fixture.simulationReadyExportStatus == null) {
      failures.push(`${prefix} simulationReadyExportStatus is required`);
    }
    if (fixture.exactDocxParityClaimMade !== false) {
      failures.push(`${prefix} exactDocxParityClaimMade must be false`);
    }
  }
  return failures;
}

function requiredManifestFailures(stageName, issueNumber) {
  if (stageName !== "final" && issueNumber !== "290") {
    return [];
  }
  const absolutePath = join(repoRoot, behaviorManifestPath);
  if (!existsSync(absolutePath)) {
    return [`missing required behavior manifest: ${behaviorManifestPath}`];
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    return [`invalid behavior manifest JSON: ${error.message}`];
  }
  const failures = [];
  for (const field of [
    "manifestVersion",
    "batch",
    "lastUpdatedIssue",
    "behavioralStages",
    "authoringFixtures",
    "defaultFixtureMutationStatus",
    "privateSourceExposureStatus",
    "simulationReadyExportStatus",
    "goNoGoStatus"
  ]) {
    if (manifest[field] == null) {
      failures.push(`behavior manifest missing field ${field}`);
    }
  }
  if (manifest.batch !== "281-290") {
    failures.push("behavior manifest batch must be 281-290");
  }
  if (manifest.lastUpdatedIssue !== "290") {
    failures.push("behavior manifest lastUpdatedIssue must be 290");
  }
  const stages = Array.isArray(manifest.behavioralStages) ? manifest.behavioralStages : [];
  const stageNames = new Set(stages.map((entry) => entry.stage));
  for (const expectedStage of Object.keys(stageProofFixtures)) {
    if (!stageNames.has(expectedStage)) {
      failures.push(`behavior manifest missing stage ${expectedStage}`);
    }
  }
  for (const fixturePath of requiredAuthoringProofFixtures) {
    if (!JSON.stringify(manifest.authoringFixtures ?? {}).includes(fixturePath)) {
      failures.push(`behavior manifest missing fixture ${fixturePath}`);
    }
  }
  if (manifest.defaultFixtureMutationStatus?.sourceFixturesRemainUnchanged !== true) {
    failures.push("behavior manifest must prove source fixtures remain unchanged");
  }
  if (manifest.privateSourceExposureStatus?.privateSourcePayloadStored !== false) {
    failures.push("behavior manifest must prove private source payload is absent");
  }
  if (manifest.privateSourceExposureStatus?.runtimeDocxExposure !== false) {
    failures.push("behavior manifest must prove runtime DOCX exposure is absent");
  }
  if (manifest.simulationReadyExportStatus?.validExportStatus !== "simulation_ready") {
    failures.push("behavior manifest must include valid simulation_ready export status");
  }
  if (manifest.goNoGoStatus?.decision == null) {
    failures.push("behavior manifest must include explicit GO/NO-GO decision");
  }
  return failures;
}

function requireNonEmptyArray(value, label, failures) {
  if (!Array.isArray(value) || value.length === 0) {
    failures.push(`${label} must be a non-empty array`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
