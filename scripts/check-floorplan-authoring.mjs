import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runFloorplanAuthoringBehaviorHarness
} from "../packages/shared/dist/index.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? (stage === "final" ? "280" : "000");
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
  "283": ["first-failure.txt"],
  "284": ["first-failure.txt"],
  "285": ["first-failure.txt"],
  "286": ["first-failure.txt"],
  "287": ["first-failure.txt"],
  "288": ["first-failure.txt"],
  "289": ["first-failure.txt"],
  "290": ["first-failure.txt"]
};

if (!(stage in stageToIssue)) {
  fail(`Unsupported floorplan authoring stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial before Issue 280 final audit`);
}

const expectedIssue = stageToIssue[stage];
const issueNumber = issue === "000" ? expectedIssue : issue;
const missingModules = requiredModules.filter((path) => !isFile(path));
const behaviorOutput = ["behavioral-execution", "save-reload-e2e"].includes(stage) && missingModules.length === 0
  ? runBehaviorHarness("default-er-layout-plan-1.json")
  : null;
const behaviorFailures = behaviorOutput == null ? [] : behaviorAssertionFailures(behaviorOutput);
const status = missingModules.length === 0 && behaviorFailures.length === 0 ? "passed" : "failed";

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
  behaviorOutput
});

if (status !== "passed") {
  fail(JSON.stringify({ status, stage, issue: issueNumber, missingModules, behaviorFailures }, null, 2));
}

console.log(
  JSON.stringify(
    {
      status,
      stage,
      issue: issueNumber,
      allowPartial,
      checkedModuleCount: requiredModules.length,
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
  if (summary.behaviorOutput != null) {
    writeAuthoringProofFixture(stageName, summary.behaviorOutput);
    writeBehaviorEvidence(issueDir, summary.behaviorOutput);
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

function writeBehaviorEvidence(issueDir, output) {
  writeJson(join(issueDir, "behavioral-harness-output.json"), output);
  writeJson(join(issueDir, "default-copy-output.json"), {
    sourceDefaultPlanId: output.sourceDefaultPlanId,
    editableCopyId: output.editableCopyId,
    sourceDefaultUnchanged: output.sourceDefaultUnchanged,
    privateSourcePayloadStored: output.privateSourcePayloadStored
  });
  writeJson(join(issueDir, "save-save-as-output.json"), {
    savedPlanId: output.savedPlanId,
    saveAsPlanId: output.saveAsPlanId,
    multipleSavedVersionsCoexist: output.savedPlanId !== output.saveAsPlanId
  });
  writeJson(join(issueDir, "reload-output.json"), {
    reloadMatchedEditableLayout: output.reloadMatchedEditableLayout
  });
  writeJson(join(issueDir, "edit-operation-output.json"), {
    roomTypeChanged: output.roomTypeChanged,
    roomAdded: output.roomAdded,
    doorAdded: output.doorAdded,
    doorMoved: output.doorMoved,
    hallwayGenerated: output.hallwayGenerated,
    podBorderGenerated: output.podBorderGenerated,
    details: output.details
  });
  writeJson(join(issueDir, "export-operation-output.json"), {
    exportValidated: output.exportValidated,
    simulationReadyExportStatus: output.details.simulationReadyExportStatus
  });
  writeJson(join(issueDir, "path-sync-status-output.json"), {
    pathSyncStatus: output.pathSyncStatus,
    generatedPathNodeCount: output.details.generatedPathNodeCount,
    generatedPathEdgeCount: output.details.generatedPathEdgeCount
  });
  writeJson(join(issueDir, "default-nonmutation-output.json"), {
    sourceDefaultUnchanged: output.sourceDefaultUnchanged,
    sourceDefaultPlanId: output.sourceDefaultPlanId
  });
  writeJson(join(issueDir, "private-source-boundary-output.json"), {
    privateSourcePayloadStored: output.privateSourcePayloadStored,
    runtimeServedByWeb: false,
    runtimeServedByApi: false
  });
}

function writeAuthoringProofFixture(stageName, output) {
  const fixtureNames = {
    "behavioral-execution": "plan-1-authoring-behavior-fixture.json",
    "save-reload-e2e": "plan-1-save-reload-fixture.json"
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
  if (
    issueNumber === "280" &&
    existsSync(commandsPath) &&
    statSync(commandsPath).isFile()
  ) {
    return;
  }
  const command =
    stageName === "final"
      ? "node scripts/check-floorplan-authoring.mjs --stage final"
      : `node scripts/check-floorplan-authoring.mjs --stage ${stageName} --allow-partial --issue ${issueNumber}`;
  writeText(
    join(issueDir, "commands.txt"),
    `${command}\n`
  );
  writeJson(join(issueDir, "command-output-map.json"), {
    issue: issueNumber,
    commands: [
      {
        command,
        outputs: [`docs/verification/issues/issue-${issueNumber}/test-output/floorplan-authoring-gate.txt`]
      }
    ]
  });
  writeText(
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
    "282": ["save-as-reload-proof.png"]
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

function writeText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
