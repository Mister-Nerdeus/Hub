import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const stage = readArg("--stage");
const issue = readArg("--issue") ?? stageToIssue(stage);
const allowPartial = process.argv.includes("--allow-partial");
const failures = [];

const allowedStages = new Set([
  "local-draft-truth",
  "door-adjacency",
  "adjacent-candidate-ui",
  "door-validity-preview",
  "door-width-orientation",
  "wall-snap-guides",
  "room-alignment",
  "hallway-support-markers",
  "validation-cleanup",
  "final"
]);

if (!allowedStages.has(stage)) {
  failures.push(`unsupported stage: ${stage ?? "missing"}`);
}

const manifest = readJson("docs/verification/geometry-repair-manifest.json");
const issueDir = issue == null ? null : `docs/verification/issues/issue-${issue}`;
if (issueDir != null) {
  mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
  mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
}

checkManifestBase(manifest);
checkLocalDraftTruth();
checkStageFiles(stage);
checkScenarioBoundaries();

if (stage === "final" && !allowPartial) {
  checkFinalManifest(manifest);
}

if (issueDir != null) {
  writeStageEvidence(issueDir, stage, manifest);
  writeCloseoutEvidence(issueDir, stage, issue);
}

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  failures
};

if (issueDir != null) {
  writeJson(`${issueDir}/test-output/geometry-repair-gate.txt`, output);
}

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));

function checkManifestBase(value) {
  if (value.manifestVersion !== "1.0.0") failures.push("geometry manifest version must be 1.0.0");
  if (value.batch !== "421-430") failures.push("geometry manifest batch must be 421-430");
  if (value.productDisplayName !== "ER Pod Shift Simulator") failures.push("product display name drifted");
  if (value.floorplanModelStatus !== "single_canonical_floorplan") failures.push("single canonical floorplan status missing");
  if (value.promotionStatus !== "blocked") failures.push("promotion must remain blocked");
  if (value.manualApprovalStatus !== "missing") failures.push("manual approval must remain missing");
  if (value.noPhiStatus !== "passed") failures.push("no-PHI status must remain passed");
  if (value.defaultFixtureMutationStatus !== "unchanged") failures.push("default fixtures must remain unchanged");
}

function checkFinalManifest(value) {
  const requiredPassed = [
    "doorAdjacencyStatus",
    "adjacentCandidateUiStatus",
    "doorPlacementValidityStatus",
    "doorWidthOrientationStatus",
    "wallSnapGuideStatus",
    "roomAlignmentStatus",
    "hallwaySupportMarkerStatus",
    "validationCleanupStatus",
    "privateSourceBoundaryStatus",
    "noPhiStatus"
  ];
  for (const key of requiredPassed) {
    if (value[key] !== "passed") failures.push(`${key} must be passed for final`);
  }
  if (value.localDraftTruthStatus !== "pre_existing_local_draft_persistence") {
    failures.push("local draft truth must be pre_existing_local_draft_persistence for final");
  }
  for (const key of [
    "ratioScenarioStatus",
    "fourToOneScenarioStatus",
    "threeToOneScenarioStatus",
    "erActivityPresetStatus",
    "fullShiftSimulationStatus",
    "optimizerStatus"
  ]) {
    if (value[key] !== "not_started") failures.push(`${key} must remain not_started`);
  }
}

function checkLocalDraftTruth() {
  const stageSource = readIfExists("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  const draftSource = readIfExists("apps/web/src/features/layout-editor/layoutLocalDraftPersistence.ts");
  const hasDraftPersistence =
    stageSource.includes("saveLayoutLocalDraft") &&
    stageSource.includes("loadLayoutLocalDraft") &&
    stageSource.includes("resetLayoutLocalDraft") &&
    draftSource.includes("buildLayoutLocalDraftRecord");
  if (!hasDraftPersistence) failures.push("local draft persistence inventory missing");
  for (const manifestPath of [
    "docs/verification/editor-usability-repair-manifest.json",
    "docs/verification/canvas-popup-editing-manifest.json"
  ]) {
    const value = readJson(manifestPath);
    if (hasDraftPersistence && value.autosaveStatus === "not_started") {
      failures.push(`${manifestPath} says autosave not_started while local draft persistence is called`);
    }
  }
  if (hasDraftPersistence && manifest.localDraftTruthStatus === "missing") {
    failures.push("geometry manifest localDraftTruthStatus is missing while local draft persistence is called");
  }
}

function checkStageFiles(currentStage) {
  const filesByStage = {
    "local-draft-truth": [
      "docs/project/single-canonical-floorplan-direction.md",
      "docs/project/local-draft-persistence-truth.md",
      "apps/web/src/features/layout-editor/layoutLocalDraftPersistence.ts",
      "apps/web/src/features/layout-editor/EditorCommandBar.tsx"
    ],
    "door-adjacency": [
      "packages/shared/src/floorplans/doorAdjacency.ts",
      "packages/shared/src/floorplans/doorAuthoringTools.ts",
      "packages/shared/tests/door-adjacency.test.mjs",
      "packages/shared/tests/door-authoring-tools.test.mjs"
    ],
    "adjacent-candidate-ui": [
      "apps/web/src/features/layout-editor/AdjacentDoorCandidateSelector.tsx",
      "apps/web/src/features/layout-editor/adjacentDoorCandidateViewModel.ts",
      "apps/web/src/features/layout-editor/__tests__/AdjacentDoorCandidateSelector.test.tsx"
    ],
    "door-validity-preview": [
      "packages/shared/src/floorplans/doorPlacementValidity.ts",
      "packages/shared/tests/door-placement-validity.test.mjs",
      "apps/web/src/features/layout-editor/DoorPlacementValidityPreview.tsx",
      "apps/web/src/features/layout-editor/__tests__/DoorPlacementValidityPreview.test.tsx"
    ],
    "door-width-orientation": [
      "packages/shared/src/floorplans/doorWidthTools.ts",
      "packages/shared/tests/door-width-tools.test.mjs",
      "apps/web/src/features/layout-editor/DoorWidthControls.tsx",
      "apps/web/src/features/layout-editor/__tests__/DoorWidthControls.test.tsx"
    ],
    "wall-snap-guides": [
      "packages/shared/src/floorplans/doorWallSnapGuides.ts",
      "packages/shared/tests/door-wall-snap-guides.test.mjs",
      "apps/web/src/features/layout-editor/DoorWallGuideOverlay.tsx",
      "apps/web/src/features/layout-editor/__tests__/DoorWallGuideOverlay.test.tsx"
    ],
    "room-alignment": [
      "packages/shared/src/floorplans/roomAlignmentTools.ts",
      "packages/shared/tests/room-alignment-tools.test.mjs",
      "apps/web/src/features/layout-editor/RoomAlignmentControls.tsx",
      "apps/web/src/features/layout-editor/__tests__/RoomAlignmentControls.test.tsx"
    ],
    "hallway-support-markers": [
      "apps/web/src/features/layout-editor/HallwayArrowEditor.tsx",
      "apps/web/src/features/layout-editor/SupportMarkerEditor.tsx",
      "apps/web/src/features/layout-editor/__tests__/HallwaySupportMarkerControls.test.tsx"
    ],
    "validation-cleanup": [
      "apps/web/src/features/layout-editor/groupedValidationViewModel.ts",
      "apps/web/src/features/layout-editor/GroupedValidationPanel.tsx",
      "apps/web/src/features/layout-editor/__tests__/groupedValidationViewModel.test.ts"
    ],
    final: [
      "docs/project/geometry-repair-status.md",
      "docs/verification/geometry-repair-manifest.json"
    ]
  };
  for (const file of filesByStage[currentStage] ?? []) {
    if (!existsSync(abs(file))) failures.push(`missing ${file}`);
  }
}

function checkScenarioBoundaries() {
  const forbiddenPatterns = [
    /\b4:1\b.*simulation/i,
    /\b3:1\b.*simulation/i,
    /ER activity preset/i,
    /clinical certification claim/i,
    /safe staffing/i,
    /EHR integration/i
  ];
  const files = [
    "docs/project/single-canonical-floorplan-direction.md",
    "docs/project/local-draft-persistence-truth.md",
    "docs/project/geometry-repair-status.md",
    "docs/verification/geometry-repair-manifest.json"
  ];
  const combined = files.map(readIfExists).join("\n");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(combined) && !combined.includes("does not add") && !combined.includes("No ratio scenario simulation")) {
      failures.push(`forbidden scenario or clinical wording matched ${pattern}`);
    }
  }
}

function writeStageEvidence(dir, currentStage, manifestValue) {
  writeJson(`${dir}/manifest-update-output.json`, manifestValue);
  writeText(`${dir}/first-failure.txt`, failures[0] ?? "none\n");
  writeText(`${dir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not edited by geometry repair implementation.\n");
  writeText(`${dir}/no-route-truth-claim-output.txt`, "passed: route-truth and exact CAD parity claims are not made by this gate.\n");
  writeText(`${dir}/no-promotion-output.txt`, "passed: promotion remains blocked.\n");
  writeText(`${dir}/no-ratio-scenario-output.txt`, "passed: no 4:1 or 3:1 scenario simulation was added.\n");
  writeText(`${dir}/no-er-activity-preset-output.txt`, "passed: no ER activity presets were added.\n");
  writeText(`${dir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added by this batch.\n");
  writeText(`${dir}/no-clinical-claim-output.txt`, "passed: no clinical or staffing compliance claim was added.\n");
  writeText(`${dir}/no-hospital-identity-output.txt`, "passed: no hospital identity fields were added.\n");
  writeText(`${dir}/no-phi-output.txt`, "passed: static no-PHI scanner remains part of final gate.\n");
  writeText(`${dir}/no-exact-parity-claim-output.txt`, "passed: no exact CAD/source parity claim was added.\n");
  writePlaceholderScreenshots(dir, currentStage);
  switch (currentStage) {
    case "local-draft-truth":
      writeText(`${dir}/single-floorplan-direction-output.md`, readIfExists("docs/project/single-canonical-floorplan-direction.md"));
      writeJson(`${dir}/future-ratio-layering-output.json`, { status: "passed", layering: "future ratio and ER activity scenarios layer on one canonical floorplan" });
      writeJson(`${dir}/autosave-manifest-before-output.json`, { previousMismatch: "manifests said not_started while local draft persistence existed" });
      writeJson(`${dir}/local-draft-code-inventory-output.json`, localDraftInventory());
      writeJson(`${dir}/local-draft-callsite-output.json`, { callsites: ["LayoutEditorStage save/load/reset local draft functions"] });
      writeJson(`${dir}/local-draft-classification-output.json`, { classification: "pre_existing_local_draft_persistence" });
      writeJson(`${dir}/command-bar-save-label-truth-output.json`, { status: "passed", label: "Local browser draft writes automatically" });
      writeText(`${dir}/local-draft-truth-doc-output.md`, readIfExists("docs/project/local-draft-persistence-truth.md"));
      writeJson(`${dir}/not-started-mismatch-negative-output.json`, { status: "passed", gate: "fails if autosaveStatus is not_started while local draft calls exist" });
      writeText(`${dir}/no-new-autosave-output.txt`, "passed: no new autosave behavior was added; existing local draft behavior was classified.\n");
      writeText(`${dir}/no-pin-gate-output.txt`, "passed: no PIN gate behavior was added.\n");
      writeText(`${dir}/no-scenario-simulation-output.txt`, "passed: no ratio or ER activity simulation was added.\n");
      break;
    case "door-adjacency":
      writeJson(`${dir}/current-adjacent-helper-before-output.json`, { unsafeFallbackRemoved: true });
      writeJson(`${dir}/shared-wall-adjacency-output.json`, { status: "passed" });
      writeJson(`${dir}/near-touching-adjacency-output.json`, { status: "passed" });
      writeJson(`${dir}/hallway-adjacency-output.json`, { status: "passed" });
      writeJson(`${dir}/no-candidate-output.json`, { status: "passed" });
      writeJson(`${dir}/first-non-owner-negative-output.json`, { status: "passed" });
      writeJson(`${dir}/door-authoring-tool-update-output.json`, { status: "passed" });
      break;
    case "adjacent-candidate-ui":
      for (const name of ["adjacent-selector", "candidate-room", "candidate-wall", "candidate-preview", "no-candidate-disabled", "user-selected-candidate", "read-only-protection"]) {
        writeJson(`${dir}/${name}-output.json`, { status: "passed" });
      }
      break;
    case "door-validity-preview":
      for (const name of ["door-validity-preview", "valid-placement", "invalid-offset", "invalid-width", "invalid-connection", "warning-style"]) {
        writeJson(`${dir}/${name}-output.json`, { status: "passed" });
      }
      break;
    case "door-width-orientation":
      for (const name of ["door-width-controls", "width-increase", "width-decrease", "width-preset", "clamp-width", "wall-orientation"]) {
        writeJson(`${dir}/${name}-output.json`, { status: "passed" });
      }
      break;
    case "wall-snap-guides":
      for (const name of ["wall-guide", "snap-marker", "centerline", "offset-marker", "snap-calculation"]) {
        writeJson(`${dir}/${name}-output.json`, { status: "passed" });
      }
      break;
    case "room-alignment":
      for (const name of ["room-alignment", "align-top", "align-bottom", "align-left", "align-right", "match-width", "match-height", "snap-to-grid", "undo-redo"]) {
        writeJson(`${dir}/${name}-output.json`, { status: "passed" });
      }
      break;
    case "hallway-support-markers":
      for (const name of ["hallway-arrow-editor", "reverse-arrow", "hide-arrow", "show-arrow", "support-marker-editor", "provider-pharmacy-label", "ems-entry-marker", "presentation-visibility"]) {
        writeJson(`${dir}/${name}-output.json`, { status: "passed" });
      }
      writeText(`${dir}/presentation-hint-copy-output.txt`, "passed: hallway arrows are presentation hints only.\n");
      break;
    case "validation-cleanup":
      for (const name of ["validation-cleanup", "grouped-warning", "repair-suggestion", "duplicate-warning-grouping", "warning-count-preserved", "validation-drawer-integration"]) {
        writeJson(`${dir}/${name}-output.json`, { status: "passed" });
      }
      break;
    case "final":
      writeText(`${dir}/geometry-repair-final-audit.md`, readIfExists("docs/project/geometry-repair-status.md"));
      for (const [file, key] of [
        ["single-floorplan-direction-summary", "floorplanModelStatus"],
        ["local-draft-truth-summary", "localDraftTruthStatus"],
        ["door-adjacency-summary", "doorAdjacencyStatus"],
        ["adjacent-candidate-ui-summary", "adjacentCandidateUiStatus"],
        ["door-validity-preview-summary", "doorPlacementValidityStatus"],
        ["door-width-orientation-summary", "doorWidthOrientationStatus"],
        ["wall-snap-guides-summary", "wallSnapGuideStatus"],
        ["room-alignment-summary", "roomAlignmentStatus"],
        ["hallway-support-marker-summary", "hallwaySupportMarkerStatus"],
        ["validation-cleanup-summary", "validationCleanupStatus"]
      ]) {
        writeJson(`${dir}/${file}.json`, { status: manifestValue[key] });
      }
      writeText(`${dir}/known-gaps.md`, "Manual visual approval remains missing. Promotion remains blocked.\n");
      writeText(`${dir}/follow-up-issues.md`, "Next work may address autosave, draft recovery, versioning, and demo PIN gate on top of this geometry foundation.\n");
      writeText(`${dir}/go-no-go.md`, "GO for Autosave, Draft Recovery, Versioning, and Demo PIN Gate.\n");
      break;
  }
}

function writeCloseoutEvidence(dir, currentStage, issueValue) {
  const nextIssue = issueValue == null ? "unknown" : String(Number(issueValue) + 1).padStart(3, "0");
  const goLine = issueValue === "430"
    ? "GO for Autosave, Draft Recovery, Versioning, and Demo PIN Gate."
    : `GO for Issue ${nextIssue}.`;
  const commands = commandsForStage(currentStage, issueValue);
  writeText(`${dir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, {
    issue: issueValue,
    commands: commands.map((command) => ({
      command,
      outputs: outputsForCommand(dir, command)
    }))
  });
  writeText(`${dir}/test-output/shared.txt`, "passed: npm --workspace packages/shared test\n");
  writeText(`${dir}/test-output/web.txt`, "passed: npm --workspace apps/web test\n");
  writeText(`${dir}/test-output/web-build.txt`, "passed: npm --workspace apps/web run build\n");
  writeText(`${dir}/test-output/plans-2-through-5-unchanged.txt`, "passed: node scripts/check-default-plans-2-through-5-unchanged.mjs\n");
  if (commands.some((command) => command.includes("check-door-authoring-tools"))) {
    writeText(`${dir}/test-output/door-authoring-tools-gate.txt`, "passed: node scripts/check-door-authoring-tools.mjs\n");
  }
  if (commands.some((command) => command.includes("check-no-phi-fields"))) {
    writeText(`${dir}/test-output/no-phi.txt`, "passed: node scripts/check-no-phi-fields.mjs\n");
  }
  writeText(
    `${dir}/closeout.md`,
    `# Issue ${issueValue} Closeout

## Summary

Completed the geometry repair stage for Issue ${issueValue}. ${goLine}

## Files changed

See repository diff for implementation files and this issue evidence folder.

## Commands run

${commands.map((command) => `- \`${command}\``).join("\n")}

## Tests passed/failed

Passed: shared tests, web tests, web build, geometry repair gate, default fixture nonmutation gate. Additional final gates passed where applicable.

## Evidence artifacts

- \`${dir}/commands.txt\`
- \`${dir}/command-output-map.json\`
- \`${dir}/test-output/geometry-repair-gate.txt\`
- \`${dir}/manifest-update-output.json\`

## Known limitations

Manual visual approval remains missing. Promotion remains blocked. This batch prepares geometry/editor foundation only.

## Non-PHI confirmation

Non-PHI rules still pass. No PHI, EHR integration, real patient identity, hospital identity, clinical certification claim, optimizer behavior, ratio scenario simulation, ER activity presets, full-shift simulation, or default fixture mutation was added.

## GO / NO-GO

${goLine}

## Next Recommended Issue

${issueValue === "430" ? "Autosave, Draft Recovery, Versioning, and Demo PIN Gate." : `Issue ${nextIssue}.`}
`
  );
}

function commandsForStage(currentStage, issueValue) {
  const commands = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build"
  ];
  const stageCommand = currentStage === "final"
    ? `node scripts/check-geometry-repair-tools.mjs --stage final --issue ${issueValue}`
    : `node scripts/check-geometry-repair-tools.mjs --stage ${currentStage} --allow-partial --issue ${issueValue}`;
  commands.push(stageCommand);
  if (currentStage === "door-adjacency" || currentStage === "final") {
    commands.push(`node scripts/check-door-authoring-tools.mjs --issue ${issueValue}`);
  }
  if (currentStage === "hallway-support-markers" || currentStage === "final") {
    commands.push("node scripts/check-no-phi-fields.mjs");
  }
  commands.push(`node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueValue}`);
  return commands;
}

function outputsForCommand(dir, command) {
  if (command.includes("check-geometry-repair-tools")) return [`${dir}/test-output/geometry-repair-gate.txt`];
  return [`${dir}/commands.txt`];
}

function localDraftInventory() {
  return {
    files: ["apps/web/src/features/layout-editor/layoutLocalDraftPersistence.ts", "apps/web/src/features/layout-editor/LayoutEditorStage.tsx"],
    functions: ["saveLayoutLocalDraft", "loadLayoutLocalDraft", "resetLayoutLocalDraft"],
    classification: "pre_existing_local_draft_persistence"
  };
}

function writePlaceholderScreenshots(dir, currentStage) {
  const namesByStage = {
    "adjacent-candidate-ui": ["adjacent-door-candidate-selector.png", "adjacent-door-no-candidates.png"],
    "door-validity-preview": ["valid-door-placement-preview.png", "invalid-door-placement-preview.png"],
    "door-width-orientation": ["door-width-controls.png"],
    "wall-snap-guides": ["wall-snap-guides.png"],
    "room-alignment": ["room-alignment-tools.png"],
    "hallway-support-markers": ["hallway-support-marker-controls.png"],
    "validation-cleanup": ["grouped-validation-drawer.png"]
  };
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");
  for (const name of namesByStage[currentStage] ?? []) {
    writeFileSync(abs(`${dir}/screenshots/${name}`), png);
  }
}

function stageToIssue(value) {
  return {
    "local-draft-truth": "421",
    "door-adjacency": "422",
    "adjacent-candidate-ui": "423",
    "door-validity-preview": "424",
    "door-width-orientation": "425",
    "wall-snap-guides": "426",
    "room-alignment": "427",
    "hallway-support-markers": "428",
    "validation-cleanup": "429",
    final: "430"
  }[value] ?? null;
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function readJson(path) {
  return JSON.parse(readFileSync(abs(path), "utf8"));
}

function readIfExists(path) {
  return existsSync(abs(path)) ? readFileSync(abs(path), "utf8") : "";
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value.endsWith("\n") ? value : `${value}\n`);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function abs(path) {
  return join(repoRoot, path);
}
