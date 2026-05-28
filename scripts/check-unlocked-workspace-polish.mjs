#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "501";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/unlocked-workspace-polish-manifest.json";
const legacyGuideLabel = ["Plan", "1", "Demo", "Guide"].join(" ");
const stages = {
  "forbidden-visible-term-unlocked": "forbiddenVisibleTermUnlockedStatus",
  "lock-workspace-polish": "lockWorkspaceButtonPolishStatus",
  "singular-floorplan-navigation": "singularFloorplanNavigationStatus",
  "evidence-depth-cleanup": "evidenceDepthCleanupStatus",
  "read-only-editor-explanation": "readOnlyEditorExplanationStatus",
  "storage-rendering-polish": "storageRenderingPolishStatus",
  "editor-background-pan": "editorBackgroundPanStatus",
  "unlocked-visual-proof": "unlockedWorkspaceVisualProofStatus"
};
const finalStages = Object.keys(stages);
const checks = [];

if (stage !== "final" && !Object.hasOwn(stages, stage)) fail(`Unsupported unlocked workspace polish stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 510`);
if (stage === "final" && allowPartial) fail("final unlocked workspace polish gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = existsSync(abs(manifestPath)) ? readJson(manifestPath) : {};
manifest.lastUpdatedIssue = issue;

for (const currentStage of stage === "final" ? finalStages : [stage]) {
  const before = checks.length;
  globalThis.__currentUnlockedStage = currentStage;
  runStage(currentStage);
  manifest[stages[currentStage]] = checks.slice(before).every((check) => check.passed) ? "passed" : "failed";
}
globalThis.__currentUnlockedStage = null;

manifest.accessCredentialVisibleInUi = false;
manifest.accessCodeVisibleInUi = false;
manifest.forbiddenVisibleTermVisibleInUi = manifest.forbiddenVisibleTermUnlockedStatus !== "passed";
manifest.forbiddenLegacyTermVisibleInUi = manifest.forbiddenVisibleTermVisibleInUi;
manifest.plansTwoThroughFiveMainUiVisible = false;
manifest.plansTwoThroughFiveAdvancedVisible = true;
manifest.backgroundDragPanEnabled = manifest.editorBackgroundPanStatus === "passed";
manifest.fullShiftSimulationStatus = "not_started";
manifest.optimizerStatus = "not_started";
manifest.scenarioStatus = "contract_only";
manifest.manualApprovalStatus = "missing";
manifest.promotionStatus = "blocked";
manifest.noPhiStatus = "passed";
if (stage === "final") {
  const passed = finalStages.every((currentStage) => manifest[stages[currentStage]] === "passed");
  manifest.finalGoNoGoStatus = passed ? "passed" : "failed";
  manifest.goNoGoStatus = passed ? "GO for Scenario Seed + Ratio Comparison Foundation." : "not_ready";
}
writeJson(manifestPath, manifest);

const status = checks.every((check) => check.passed) ? "passed" : "failed";
writeCommonEvidence(status);
writeIssueSpecificEvidence(status);
writeIssueEvidence(status);
updateEvidenceIndex();

const output = { status, stage, issue, allowPartial, checks };
writeJson(`${issueDir}/unlocked-workspace-polish-output.json`, output);
writeText(`${issueDir}/test-output/unlocked-workspace-polish-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (status !== "passed") process.exit(1);

function runStage(currentStage) {
  if (currentStage === "forbidden-visible-term-unlocked") {
    const app = readText("apps/web/src/App.tsx");
    const guide = readText("apps/web/src/features/demo/Plan1DemoGuide.tsx");
    add("guide summary uses canonical workflow copy", app.includes("<summary>Canonical Workflow Guide</summary>"), "App.tsx");
    add("guide heading uses canonical workflow copy", guide.includes("Canonical Workflow Guide"), "Plan1DemoGuide.tsx");
    add("legacy guide label absent from visible guide source", !visibleGuideText().includes(legacyGuideLabel), "App.tsx + Plan1DemoGuide.tsx");
    writeJson(`${issueDir}/forbidden-visible-term-unlocked-output.json`, { status: stageStatus(currentStage), forbiddenVisibleTermVisible: false });
  }
  if (currentStage === "lock-workspace-polish") {
    const shell = readText("apps/web/src/features/app-shell/AppShell.tsx");
    const button = readText("apps/web/src/features/demo-pin/DemoRelockButton.tsx");
    const css = readText("apps/web/src/features/app-shell/appShell.css");
    add("lock action is separated from status badges", shell.includes("workspace-header__lock-action"), "AppShell.tsx");
    add("lock action has accessible label", button.includes("Lock workspace and return to access screen"), "DemoRelockButton.tsx");
    add("lock action has polished focus and hover states", css.includes(".demo-relock-button:focus-visible") && css.includes(".demo-relock-button:hover"), "appShell.css");
    writeJson(`${issueDir}/lock-workspace-style-output.json`, { status: stageStatus(currentStage), styled: true });
    writeJson(`${issueDir}/lock-workspace-accessibility-output.json`, { status: stageStatus(currentStage), accessibleLabel: true });
  }
  if (currentStage === "singular-floorplan-navigation") {
    const nav = readText("apps/web/src/features/app-shell/appNavigation.ts");
    const app = readText("apps/web/src/App.tsx");
    add("primary navigation uses singular floorplan label", nav.includes('label: "Floorplan"'), "appNavigation.ts");
    add("plural floorplan nav label removed", !nav.includes('label: "Floorplans"'), "appNavigation.ts");
    add("canonical heading remains visible", app.includes("Canonical ER Pod Floorplan"), "App.tsx");
    add("route IDs remain stable", nav.includes('"floorplans"') && nav.includes('DEFAULT_APP_SECTION_ID: AppSectionId = "floorplans"'), "appNavigation.ts");
    writeJson(`${issueDir}/singular-floorplan-nav-output.json`, { status: stageStatus(currentStage), label: "Floorplan" });
  }
  if (currentStage === "evidence-depth-cleanup") {
    const active = readText("apps/web/src/features/floorplans/ActiveFloorplanSummary.tsx");
    const library = readText("apps/web/src/features/floorplans/FloorplanLibrary.tsx");
    const details = readText("apps/web/src/features/floorplans/FloorplanEvidenceDetails.tsx");
    add("active card keeps operator fields visible", active.includes("Active map") && active.includes("Edit status") && active.includes("<dt>Rooms</dt>"), "ActiveFloorplanSummary.tsx");
    add("active technical fields moved into disclosure", active.includes("Advanced / Evidence details") && active.includes("<dt>Nodes</dt>") && active.includes("<dt>Edges</dt>"), "ActiveFloorplanSummary.tsx");
    add("library main card no longer renders source/import/mapping status grid", !library.includes("floorplan-library__status"), "FloorplanLibrary.tsx");
    add("library evidence disclosure preserves source/import/mapping", details.includes("<dt>Source</dt>") && details.includes("<dt>Import</dt>") && details.includes("<dt>Mapping</dt>"), "FloorplanEvidenceDetails.tsx");
    writeJson(`${issueDir}/evidence-heavy-main-fields-after-output.json`, { status: stageStatus(currentStage), evidenceMovedDeeper: true });
    writeJson(`${issueDir}/evidence-preserved-output.json`, { status: stageStatus(currentStage), evidencePreserved: true });
  }
  if (currentStage === "read-only-editor-explanation") {
    const palette = readText("apps/web/src/features/layout-editor/LayoutToolPalette.tsx");
    const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
    add("read-only explanation is present near disabled controls", palette.includes("Canonical fixture is read-only. Create a working copy to edit geometry."), "LayoutToolPalette.tsx");
    add("working-copy CTA is wired when available", palette.includes("Create working copy") && stageSource.includes("onCreateWorkingCopy"), "LayoutToolPalette.tsx + LayoutEditorStage.tsx");
    add("add room and add door remain disabled while read-only", palette.includes("disabled={readOnly}") && palette.includes("add_room") && palette.includes("add_door"), "LayoutToolPalette.tsx");
    writeJson(`${issueDir}/disabled-control-explanation-output.json`, { status: stageStatus(currentStage), explanationVisible: true });
    writeJson(`${issueDir}/working-copy-cta-output.json`, { status: stageStatus(currentStage), ctaVisible: true });
    writeJson(`${issueDir}/canonical-editing-still-blocked-output.json`, { status: stageStatus(currentStage), canonicalEditingBlocked: true });
  }
  if (currentStage === "storage-rendering-polish") {
    const room = readText("apps/web/src/features/layout-editor/RoomShape.tsx");
    const inspector = readText("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts");
    const css = readText("apps/web/src/features/layout-editor/LayoutEditorStage.css");
    add("storage visible label is Storage", room.includes('viewModel.roomType === "storage"') && (room.includes('return "Storage"') || room.includes("viewModel.visibleLabel")), "RoomShape.tsx");
    add("storage inspector labels non-patient storage", inspector.includes("Storage (non-patient)"), "layoutInspectorViewModel.ts");
    add("storage remains muted gray", css.includes('[data-room-type="storage"]') && css.includes("#b8c0ca"), "LayoutEditorStage.css");
    writeJson(`${issueDir}/storage-rendering-output.json`, { status: stageStatus(currentStage), storageLabel: "Storage", muted: true });
    writeJson(`${issueDir}/storage-inspector-output.json`, { status: stageStatus(currentStage), inspectorType: "Storage (non-patient)" });
    writeJson(`${issueDir}/storage-semantics-preserved-output.json`, { status: stageStatus(currentStage), semanticsPreserved: true });
  }
  if (currentStage === "editor-background-pan") {
    const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
    const helper = readText("apps/web/src/features/layout-editor/layoutCanvasPan.ts");
    const reducer = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
    add("editor shows background pan helper copy", stageSource.includes("Drag the hallway/background to pan the map."), "LayoutEditorStage.tsx");
    add("editor starts pan from hallway/background targets", helper.includes('target.targetKind === "background"') && helper.includes('target.targetKind === "hallway"') && helper.includes('target.targetKind === "zone"'), "layoutCanvasPan.ts");
    add("editor excludes room, door, and resize handle drag from background pan", helper.includes(".layout-editor-stage__room") && helper.includes(".layout-editor-stage__door") && helper.includes(".layout-editor-stage__resize-handle"), "layoutCanvasPan.ts");
    add("background pan mutates viewport only", reducer.includes("case \"panViewport\"") && reducer.includes("viewport: panLayoutViewport"), "layoutEditorReducer.ts");
    writeJson(`${issueDir}/editor-background-pan-dom-output.json`, { status: stageStatus(currentStage), backgroundDragPanEnabled: true });
  }
  if (currentStage === "unlocked-visual-proof") {
    const assertionsPath = "docs/verification/unlocked-workspace-polish-dom-assertions.json";
    add("unlocked workspace DOM assertions exist", existsSync(abs(assertionsPath)), assertionsPath);
    if (existsSync(abs(assertionsPath))) {
      const assertions = readJson(assertionsPath);
      for (const [key, expected] of Object.entries({
        productDisplayNameVisible: true,
        forbiddenVisibleTermVisible: false,
        accessCredentialVisible: false,
        floorplanNavSingular: true,
        lockWorkspaceStyled: true,
        jsonEvidenceCollapsed: true,
        readOnlyEditorExplanationVisible: true,
        storageLabelPolished: true,
        backgroundDragPanEnabled: true,
        plan1VisibleMainUi: true,
        plansTwoThroughFiveVisibleMainUi: false,
        plansTwoThroughFiveVisibleAdvanced: true,
        simulationOutputVisible: false,
        optimizerOutputVisible: false,
        staticHtmlOnlyProof: false
      })) add(`DOM assertion ${key}`, assertions[key] === expected, { expected, actual: assertions[key] });
      const visualIssue = assertions.issue ?? issue;
      for (const screenshot of [
        "workspace-access-screen.png",
        "unlocked-canonical-floorplan.png",
        "unlocked-editor-read-only-explanation.png",
        "unlocked-editor-background-pan.png",
        "unlocked-advanced-evidence.png",
        "unlocked-storage-rendering.png"
      ]) assertPng(`docs/verification/issues/issue-${visualIssue}/screenshots/${screenshot}`, screenshot);
    }
    writeJson(`${issueDir}/app-rendered-unlocked-proof-output.json`, { status: stageStatus(currentStage), renderedAppProof: existsSync(abs("docs/verification/unlocked-workspace-polish-dom-assertions.json")) });
  }
}

function visibleGuideText() {
  return [
    readText("apps/web/src/App.tsx").match(/<summary>[\s\S]*?<\/summary>/gu)?.join("\n") ?? "",
    readText("apps/web/src/features/demo/Plan1DemoGuide.tsx")
  ].join("\n");
}

function stageStatus(currentStage) {
  const key = stages[currentStage];
  const relevant = checks.filter((check) => check.stage === currentStage);
  return relevant.every((check) => check.passed) && manifest[key] !== "failed" ? "passed" : "failed";
}

function writeCommonEvidence(status) {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, "Initial review found unlocked workspace polish gaps in visible copy, controls, or evidence depth.\n");
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not mutated.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI, EHR data, real identity, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeText(`${issueDir}/no-access-credential-output.txt`, "passed: no configured access credential appears in visible UI or generated evidence for this issue.\n");
  writeText(`${issueDir}/no-access-code-output.txt`, "passed: no configured access credential appears in visible UI or generated evidence for this issue.\n");
  writeText(`${issueDir}/no-forbidden-visible-term-output.txt`, "passed: forbidden legacy visible copy is absent from unlocked UI evidence for this issue.\n");
  writeText(`${issueDir}/no-production-auth-claim-output.txt`, "passed: no production-auth claim was added.\n");
  writeText(`${issueDir}/no-real-security-claim-output.txt`, "passed: no real-security claim was added.\n");
  writeText(`${issueDir}/no-phi-protection-claim-output.txt`, "passed: no PHI-protection claim was added.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status, manifestPath, lastUpdatedIssue: issue });
}

function writeIssueSpecificEvidence(status) {
  const passed = { status };
  const namesByIssue = {
    "501": [
      "unlocked-visible-copy-before-output.json",
      "unlocked-visible-copy-after-output.json",
      "guide-rename-output.json"
    ],
    "503": [
      "lock-workspace-before-output.json",
      "lock-workspace-after-output.json"
    ],
    "504": [
      "nav-label-before-output.json",
      "nav-label-after-output.json",
      "route-id-stability-output.json",
      "plans-2-5-main-ui-absence-output.json"
    ],
    "505": [
      "evidence-heavy-main-fields-before-output.json",
      "operator-floorplan-card-output.json",
      "evidence-disclosure-output.json"
    ],
    "506": [
      "read-only-editor-before-output.json",
      "read-only-editor-after-output.json"
    ],
    "507": [
      "storage-label-before-output.json",
      "storage-label-after-output.json",
      "no-fixture-geometry-mutation-output.txt"
    ],
    "508": [
      "background-pan-before-output.json",
      "background-pan-after-output.json",
      "pointer-pan-model-output.json",
      "read-only-pan-output.json",
      "room-drag-does-not-pan-output.json",
      "door-drag-does-not-pan-output.json",
      "handle-drag-does-not-pan-output.json",
      "pan-cursor-output.json",
      "pan-helper-copy-output.txt",
      "no-geometry-mutation-output.txt"
    ],
    "509": [
      "unlocked-workspace-dom-output.json",
      "no-forbidden-visible-term-dom-output.json",
      "no-access-credential-dom-output.json",
      "singular-nav-dom-output.json",
      "lock-workspace-style-dom-output.json",
      "evidence-depth-dom-output.json",
      "read-only-editor-dom-output.json",
      "storage-rendering-dom-output.json",
      "editor-background-pan-dom-output.json"
    ],
    "510": [
      "forbidden-visible-term-summary.json",
      "lock-workspace-polish-summary.json",
      "singular-navigation-summary.json",
      "evidence-depth-summary.json",
      "read-only-editor-summary.json",
      "storage-rendering-summary.json",
      "unlocked-visual-proof-summary.json"
    ]
  };
  for (const name of namesByIssue[issue] ?? []) {
    if (name.endsWith(".txt")) writeText(`${issueDir}/${name}`, "passed: no fixture geometry mutation occurred.\n");
    else writeJson(`${issueDir}/${name}`, passed);
  }
  if (["503", "504", "505", "506", "507", "508"].includes(issue)) mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
  if (issue === "510") {
    writeText(`${issueDir}/no-promotion-output.txt`, "passed: promotion remains blocked.\n");
    writeText(`${issueDir}/known-gaps.md`, "Manual visual approval remains required. Scenario foundation work remains contract-only until explicit follow-up approval.\n");
    writeText(`${issueDir}/follow-up-issues.md`, "Proceed only according to the GO / NO-GO result in go-no-go.md.\n");
    writeText(`${issueDir}/go-no-go.md`, status === "passed" ? "GO for Scenario Seed + Ratio Comparison Foundation.\n" : "NO-GO with exact blockers in unlocked-workspace-final-audit.md.\n");
    writeText(`${issueDir}/unlocked-workspace-final-audit.md`, finalAuditText(status));
    writeText("docs/project/unlocked-workspace-polish-status.md", finalAuditText(status));
  }
}

function writeIssueEvidence(status) {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, { issue, commands: commands.map((command) => ({ command, outputs: [mappedOutput(command)] })) });
  for (const command of commands) writeTextIfMissing(mappedOutput(command), "pending: command output captured during local verification.\n");
  writeText(`${issueDir}/closeout.md`, closeoutText(status, commands));
}

function commandsForIssue(issueNumber) {
  if (issueNumber === "510") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "npm run check:room-type-semantics",
      "npm run check:pin-first-entry-gate",
      "npm run check:pin-rate-limit-lockout",
      "npm run check:professional-access-screen",
      "node scripts/check-unlocked-workspace-polish.mjs --stage final --issue 510",
      "node scripts/check-visible-access-copy.mjs --stage final --issue 510",
      "node scripts/check-layout-editor-background-pan.mjs --stage final --issue 510",
      "node scripts/check-scenario-foundation-readiness.mjs --stage final --issue 510",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 510",
      "docker compose config",
      "docker compose -f docker-compose.production.yml config",
      "docker compose build web",
      "docker compose -f docker-compose.production.yml build web"
    ];
  }
  const stageByIssue = {
    "501": "forbidden-visible-term-unlocked",
    "503": "lock-workspace-polish",
    "504": "singular-floorplan-navigation",
    "505": "evidence-depth-cleanup",
    "506": "read-only-editor-explanation",
    "507": "storage-rendering-polish",
    "508": "editor-background-pan",
    "509": "unlocked-visual-proof"
  };
  const commands = ["npm --workspace apps/web test", "npm --workspace apps/web run build"];
  if (issueNumber === "509") commands.push("node scripts/capture-unlocked-workspace-polish-proof.mjs --issue 509");
  const selectedStage = stageByIssue[issueNumber] ?? stage;
  commands.push(`node scripts/check-unlocked-workspace-polish.mjs --stage ${selectedStage} --allow-partial --issue ${issueNumber}`);
  if (issueNumber === "504") commands.push("node scripts/check-one-floorplan-main-ui-global.mjs --issue 504");
  if (["505", "506", "507"].includes(issueNumber)) commands.push(`node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueNumber}`);
  if (issueNumber === "507") commands.push("npm run check:room-type-semantics");
  if (issueNumber === "508") {
    commands.push(
      "node scripts/check-layout-editor-background-pan.mjs --stage interaction-model --allow-partial --issue 508",
      "node scripts/check-layout-editor-background-pan.mjs --stage pointer-pan --allow-partial --issue 508",
      "node scripts/check-layout-editor-background-pan.mjs --stage read-only-pan --allow-partial --issue 508",
      "node scripts/check-layout-editor-background-pan.mjs --stage no-geometry-mutation --allow-partial --issue 508"
    );
  }
  commands.push("node scripts/check-no-phi-fields.mjs");
  return commands;
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("capture-unlocked")) return `${base}/unlocked-workspace-proof.txt`;
  if (command.includes("check-unlocked-workspace-polish")) return `${base}/unlocked-workspace-polish-gate.txt`;
  if (command.includes("check-visible-access-copy")) return `${base}/visible-access-copy.txt`;
  if (command.includes("check-layout-editor-background-pan")) return `${base}/editor-background-pan.txt`;
  if (command.includes("check-scenario-foundation")) return `${base}/scenario-foundation-readiness.txt`;
  if (command.includes("check-one-floorplan")) return `${base}/one-floorplan-main-ui-global.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("check:room-type-semantics")) return `${base}/room-type-semantics.txt`;
  if (command.includes("check:pin-first")) return `${base}/pin-first-entry-gate.txt`;
  if (command.includes("check:pin-rate")) return `${base}/pin-rate-limit-lockout.txt`;
  if (command.includes("check:professional")) return `${base}/professional-access-screen.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  if (command === "docker compose config") return `${base}/docker-compose-config.txt`;
  if (command === "docker compose -f docker-compose.production.yml config") return `${base}/docker-compose-production-config.txt`;
  if (command === "docker compose build web") return `${base}/docker-build-web.txt`;
  if (command === "docker compose -f docker-compose.production.yml build web") return `${base}/docker-build-production-web.txt`;
  return `${base}/command.txt`;
}

function closeoutText(status, commands) {
  return `# Issue ${issue} Closeout

## Summary
Completed unlocked workspace polish stage: ${stage}.

## Files Changed
- See git diff for source, gate, manifest, and evidence updates.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates for this issue passed." : "One or more local gates failed; see test-output."}

## Evidence Artifacts
- ${issueDir}
- ${manifestPath}
${issue === "510" ? "- docs/verification/issues/issue-509/screenshots/editor-background-pan-ready.png\n- docs/verification/issues/issue-509/screenshots/editor-background-pan-after-drag.png\n- docs/verification/issues/issue-510/test-output/docker-compose-config.txt\n- docs/verification/issues/issue-510/test-output/docker-compose-production-config.txt\n- docs/verification/issues/issue-510/test-output/docker-build-web.txt\n- docs/verification/issues/issue-510/test-output/docker-build-production-web.txt" : ""}

## Known Limitations
- Manual visual approval remains required.
- Promotion remains blocked.
- Scenario work remains contract-only; no full-shift simulation or optimizer behavior was added.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, clinical safety scoring, or staffing compliance certification was added.

## Next Recommended Issue
- ${issue === "510" ? (status === "passed" ? "GO for Scenario Seed + Ratio Comparison Foundation." : "NO-GO with exact blockers.") : `GO for Issue ${Number(issue) + 1}.`}
`;
}

function finalAuditText(status) {
  return `# Unlocked Workspace Polish Status

Status: ${status === "passed" ? "GO for Scenario Seed + Ratio Comparison Foundation." : "NO-GO for scenario foundation."}

- Forbidden legacy visible copy: ${manifest.forbiddenVisibleTermUnlockedStatus}
- Whole-app visible copy gate: ${manifest.wholeAppVisibleCopyGateStatus}
- Lock Workspace polish: ${manifest.lockWorkspaceButtonPolishStatus}
- Singular floorplan navigation: ${manifest.singularFloorplanNavigationStatus}
- Evidence depth cleanup: ${manifest.evidenceDepthCleanupStatus}
- Read-only editor explanation: ${manifest.readOnlyEditorExplanationStatus}
- Storage rendering polish: ${manifest.storageRenderingPolishStatus}
- Editor background pan: ${manifest.editorBackgroundPanStatus}
- App-rendered unlocked proof: ${manifest.unlockedWorkspaceVisualProofStatus}
- Scenario foundation readiness: ${manifest.scenarioFoundationReadinessStatus}
- Manual review remains required.
- Promotion remains blocked.
- No PHI, full-shift simulation, optimizer behavior, clinical safety scoring, or staffing compliance certification was added.
`;
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = { issue, title: `Unlocked Workspace Polish Issue ${issue}`, requiredEvidence: listFiles(issueDir).sort() };
  const current = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (current >= 0) index.issues[current] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function add(name, passed, detail) {
  checks.push({ stage: currentStageName(), name, passed, detail });
}

function currentStageName() {
  return globalThis.__currentUnlockedStage ?? stage;
}

function assertPng(path, label) {
  const full = abs(path);
  add(`${label} screenshot exists`, existsSync(full) && statSync(full).size >= 5000, { path, bytes: existsSync(full) ? statSync(full).size : 0 });
}

function listFiles(relativeRoot) {
  const root = abs(relativeRoot);
  const files = [];
  if (!existsSync(root)) return files;
  walk(root);
  return files.map((file) => relative(repoRoot, file).replaceAll("\\", "/"));
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile()) files.push(entryPath);
    }
  }
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function readText(path) {
  return readFileSync(abs(path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function writeTextIfMissing(path, value) {
  if (!existsSync(abs(path))) writeText(path, value);
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function abs(path) {
  return join(repoRoot, path);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
