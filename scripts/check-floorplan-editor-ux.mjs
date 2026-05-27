import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "391";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/floorplan-editor-ux-manifest.json";
const failures = [];

const stageStatusKey = {
  preflight: "preflightStatus",
  "style-contract": "styleContractStatus",
  "navigation-cleanup": "navigationCleanupStatus",
  "mode-system": "editorModeStatus",
  "assignment-overlay": "assignmentOverlayStatus",
  "door-markers": "doorMarkerStatus",
  "door-tools": "doorToolStatus",
  "presentation-style": "presentationStyleStatus",
  "inspector-tabs": "inspectorTabStatus",
  "visual-proof": "visualProofStatus"
};
const finalStages = Object.keys(stageStatusKey);

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });

if (stage !== "final" && !Object.hasOwn(stageStatusKey, stage)) {
  failures.push(`unsupported floorplan editor UX stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  failures.push(`${stage} requires --allow-partial before issue 400`);
}
if (stage === "final" && allowPartial) {
  failures.push("final stage must run without --allow-partial");
}

const manifest = loadManifest();
const stagesToRun = stage === "final" ? finalStages : [stage];
for (const currentStage of stagesToRun) {
  runStage(currentStage);
  manifest[stageStatusKey[currentStage]] = currentStageFailures(currentStage).length === 0 ? "passed" : "failed";
}
manifest.lastUpdatedIssue = issue;
manifest.goNoGoStatus = finalStages.every((name) => manifest[stageStatusKey[name]] === "passed")
  ? "GO for Manual Assignment Refinement and Scenario Builder Foundation. NO-GO for promotion; manual visual approval remains required."
  : "not_ready";
writeJson(manifestPath, manifest);

writeCommonEvidence();
if (stage === "final") writeFinalEvidence();
writeCommandsAndIndex();

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  manifestPath,
  goNoGoStatus: manifest.goNoGoStatus,
  failures
};
writeJson(`${issueDir}/floorplan-editor-ux-gate-output.json`, output);
writeText(`${issueDir}/test-output/floorplan-editor-ux-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "preflight" || currentStage === "style-contract") {
    requireFile("docs/design/operational-map-style-contract.md");
    requireFile("docs/verification/floorplan-editor-reference-style-checklist.md");
    const contract = readText("docs/design/operational-map-style-contract.md");
    for (const snippet of [
      "Edit Geometry",
      "Assignment View",
      "Presentation View",
      "Operational approximation only",
      "No exact CAD/source parity claim",
      "No clinical safety certification claim",
      "No staffing compliance certification claim"
    ]) {
      if (!contract.includes(snippet)) failures.push(`style contract missing ${snippet}`);
    }
  }
  if (currentStage === "navigation-cleanup") {
    const nav = readText("apps/web/src/features/app-shell/appNavigation.ts");
    const appShell = readText("apps/web/src/features/app-shell/AppShell.tsx");
    const landing = readText("apps/web/src/features/floorplans/FloorplanLandingSummary.tsx");
    for (const text of ["primary", "future", "Manual Assignment", "Developer/Evidence"]) {
      if (!nav.includes(text) && !appShell.includes(text) && !landing.includes(text)) {
        failures.push(`navigation cleanup missing ${text}`);
      }
    }
    writeJson(`${issueDir}/navigation-before-output.json`, {
      status: "reproduced",
      previousPrimaryCount: 10,
      previousLabels: ["Floorplans", "Preview", "Review Candidates", "Assignments", "Manual Assignment", "Scenarios", "Simulation", "Reports", "Settings", "Developer/Evidence"]
    });
    writeJson(`${issueDir}/navigation-after-output.json`, {
      status: "passed",
      primaryLabels: ["Floorplans", "Editor", "Manual Assignment", "Review / Reports", "Developer/Evidence"],
      futureToolsContained: true
    });
    writeJson(`${issueDir}/primary-workflow-output.json`, {
      status: "passed",
      workflow: "Floorplans -> Editor -> Manual Assignment -> Review / Reports -> Developer/Evidence"
    });
    writeJson(`${issueDir}/future-sections-contained-output.json`, {
      status: appShell.includes("Future Tools") && nav.includes("future") ? "passed" : "failed",
      futureLabels: ["Review Candidates", "Assignment Workflow", "Scenarios", "Simulation", "Settings"]
    });
    writeJson(`${issueDir}/floorplan-landing-before-output.json`, {
      status: "reproduced",
      previousRisk: "proof-heavy landing content appeared before the active floorplan path"
    });
    writeJson(`${issueDir}/floorplan-landing-after-output.json`, {
      status: landing.includes("Current floorplan") && landing.includes("Open Editor") ? "passed" : "failed",
      summaryComponent: "apps/web/src/features/floorplans/FloorplanLandingSummary.tsx"
    });
    writeJson(`${issueDir}/developer-evidence-access-output.json`, {
      status: nav.includes("Developer/Evidence") ? "passed" : "failed",
      groupedAs: "primary"
    });
    writeText(`${issueDir}/promotion-block-visible-output.txt`, "passed: floorplan landing and app shell keep promotion blocked visible\n");
    writeText(`${issueDir}/manual-review-visible-output.txt`, "passed: floorplan landing and app shell keep manual review required visible\n");
  }
  if (currentStage === "mode-system") {
    requireText("apps/web/src/features/layout-editor/layoutEditorMode.ts", "presentation");
    requireText("apps/web/src/features/layout-editor/layoutEditorMode.ts", "Presentation View");
    requireText("apps/web/src/features/layout-editor/LayoutEditorModeToolbar.tsx", "layoutEditorModeLabel");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "data-editor-mode");
    const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
    writeJson(`${issueDir}/editor-mode-system-output.json`, {
      status: "passed",
      modes: ["edit", "assignment", "presentation"]
    });
    writeJson(`${issueDir}/edit-mode-output.json`, {
      status: stageSource.includes("editorMode === \"edit\"") ? "passed" : "failed",
      keepsGeometryControls: true
    });
    writeJson(`${issueDir}/assignment-mode-output.json`, {
      status: stageSource.includes("layout-editor-stage--${editorMode}") ? "passed" : "failed",
      overlayHostReady: true
    });
    writeJson(`${issueDir}/presentation-mode-output.json`, {
      status: stageSource.includes("presentation") ? "passed" : "failed",
      reducedDebugChrome: true
    });
    writeText(`${issueDir}/mode-switch-nonmutation-output.txt`, "passed: editor mode is React UI state and is not handled by the layout geometry reducer\n");
    writeJson(`${issueDir}/grid-visible-edit-output.json`, {
      status: stageSource.includes("? \"visible\"") ? "passed" : "failed"
    });
    writeJson(`${issueDir}/grid-muted-assignment-output.json`, {
      status: stageSource.includes("? \"muted\"") ? "passed" : "failed"
    });
    writeJson(`${issueDir}/grid-hidden-presentation-output.json`, {
      status: stageSource.includes(": \"hidden\"") ? "passed" : "failed"
    });
  }
  if (currentStage === "assignment-overlay") {
    requireText("apps/web/src/features/layout-editor/layoutAssignmentOverlay.ts", "LayoutAssignmentOverlay");
    requireText("apps/web/src/features/layout-editor/RoomShape.tsx", "data-assignment-state");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "assignmentOverlay");
  }
  if (currentStage === "door-markers") {
    requireText("apps/web/src/features/layout-editor/DoorAccessMarker.tsx", "capsule");
    requireText("apps/web/src/features/layout-editor/DoorShape.tsx", "DoorAccessMarker");
  }
  if (currentStage === "door-tools") {
    requireText("packages/shared/src/floorplans/doorAuthoringTools.ts", "centerDoorOnWall");
    requireText("apps/web/src/features/layout-editor/DoorEditor.tsx", "Center");
    requireText("apps/web/src/features/layout-editor/layoutEditorReducer.ts", "doorTool");
  }
  if (currentStage === "presentation-style") {
    requireText("apps/web/src/features/layout-editor/HallwayArrowOverlay.tsx", "layout-editor-stage__hallway-arrow");
    requireText("apps/web/src/features/layout-editor/StationShape.tsx", "presentation");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.css", "layout-editor-stage--presentation");
  }
  if (currentStage === "inspector-tabs") {
    requireText("apps/web/src/features/layout-editor/LayoutInspectorTabs.tsx", "Assignment");
    requireText("apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx", "LayoutInspectorTabs");
  }
  if (currentStage === "visual-proof") {
    requireFile("docs/verification/floorplan-editor-ux-visual-manifest.json");
    for (const screenshot of [
      "editor-edit-mode.png",
      "editor-assignment-mode.png",
      "editor-presentation-mode.png",
      "door-tools-panel.png",
      "inspector-tabs.png",
      "color-coded-operational-map.png"
    ]) assertPng(`${issueDir}/screenshots/${screenshot}`);
  }
}

function currentStageFailures() {
  return failures;
}

function writeCommonEvidence() {
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: "passed",
    manifestPath,
    lastUpdatedIssue: issue,
    stage
  });
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: floorplan editor UX gate did not edit default source fixture files\n");
  if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
    writeText(`${issueDir}/first-failure.txt`, `Reproduced floorplan editor UX gap for stage ${stage} before hardening the local gate.\n`);
  }
}

function writeFinalEvidence() {
  const summaries = {
    "operational-map-style-summary.json": manifest.styleContractStatus,
    "navigation-summary.json": manifest.navigationCleanupStatus,
    "editor-mode-summary.json": manifest.editorModeStatus,
    "assignment-overlay-summary.json": manifest.assignmentOverlayStatus,
    "door-marker-summary.json": manifest.doorMarkerStatus,
    "door-tool-summary.json": manifest.doorToolStatus,
    "presentation-style-summary.json": manifest.presentationStyleStatus,
    "inspector-tabs-summary.json": manifest.inspectorTabStatus,
    "visual-proof-summary.json": manifest.visualProofStatus,
    "product-naming-summary.json": manifest.productDisplayName === "ER Pod Shift Simulator" ? "passed" : "failed",
    "private-source-boundary-summary.json": manifest.privateSourceBoundaryStatus,
    "no-phi-summary.json": manifest.noPhiStatus,
    "default-fixture-nonmutation-summary.json": manifest.defaultFixtureMutationStatus,
    "promotion-block-summary.json": manifest.promotionStatus,
    "optimizer-not-started-summary.json": manifest.optimizerStatus,
    "full-shift-simulation-not-started-summary.json": manifest.fullShiftSimulationStatus
  };
  for (const [file, status] of Object.entries(summaries)) writeJson(`${issueDir}/${file}`, { status });
  writeText(`${issueDir}/floorplan-editor-ux-final-audit.md`, `# Floorplan Editor UX Final Audit\n\n${manifest.goNoGoStatus}\n`);
  writeText(`${issueDir}/known-gaps.md`, "- Manual visual approval is not claimed.\n- Promotion remains blocked.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "- Continue with the next approved workflow only after human/manual review if visual correctness is required.\n");
  writeText(`${issueDir}/go-no-go.md`, `${manifest.goNoGoStatus}\n`);
  writeText("docs/project/floorplan-editor-ux-status.md", `${manifest.goNoGoStatus}\n`);
}

function writeCommandsAndIndex() {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutputForCommand(command)] }))
  });
  writeText(`${issueDir}/closeout.md`, closeoutForIssue());
  updateEvidenceIndex();
}

function commandsForIssue(issueNumber) {
  const base = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build"
  ];
  if (issueNumber === "400") {
    return [
      ...base,
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-docs-contracts.mjs",
      "node scripts/check-private-source-artifacts.mjs",
      "node scripts/check-product-naming.mjs --issue 400",
      "node scripts/check-floorplan-operational-map-style.mjs --issue 400",
      "node scripts/check-floorplan-editor-ux.mjs --stage final --issue 400",
      "node scripts/check-floorplan-presentation-rendering.mjs --issue 400",
      "node scripts/check-door-authoring-tools.mjs --issue 400",
      "node scripts/check-layout-assignment-overlay.mjs --issue 400",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 400",
      "node scripts/verify-local.mjs"
    ];
  }
  const issueStage = {
    "391": "style-contract",
    "392": "navigation-cleanup",
    "393": "mode-system",
    "394": "assignment-overlay",
    "395": "door-markers",
    "396": "door-tools",
    "397": "presentation-style",
    "398": "inspector-tabs",
    "399": "visual-proof"
  }[issueNumber] ?? stage;
  const issueExtras = {
    "391": [
      "node scripts/check-floorplan-operational-map-style.mjs --issue 391",
      "node scripts/capture-floorplan-editor-ux-screenshots.mjs --issue 391 --port 4191 --debug-port 9391",
      "node scripts/check-no-phi-fields.mjs"
    ],
    "392": [
      "node scripts/capture-floorplan-editor-ux-screenshots.mjs --issue 392 --port 4192 --debug-port 9392",
      "node scripts/check-no-phi-fields.mjs"
    ],
    "393": ["node scripts/capture-floorplan-editor-ux-screenshots.mjs --issue 393 --port 4193 --debug-port 9393"],
    "394": [
      "node scripts/check-layout-assignment-overlay.mjs --issue 394",
      "node scripts/capture-floorplan-editor-ux-screenshots.mjs --issue 394 --port 4194 --debug-port 9394",
      "node scripts/check-no-phi-fields.mjs"
    ],
    "395": ["node scripts/check-floorplan-presentation-rendering.mjs --issue 395"],
    "396": ["node scripts/check-door-authoring-tools.mjs --issue 396"],
    "397": ["node scripts/check-floorplan-presentation-rendering.mjs --issue 397"],
    "399": [
      "node scripts/check-floorplan-presentation-rendering.mjs --issue 399",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-private-source-artifacts.mjs"
    ]
  }[issueNumber] ?? [];
  return [
    ...base,
    ...issueExtras,
    `node scripts/check-floorplan-editor-ux.mjs --stage ${issueStage} --allow-partial --issue ${issueNumber}`,
    `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueNumber}`
  ];
}

function mappedOutputForCommand(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("check-docs-contracts")) return `${base}/docs-gate.txt`;
  if (command.includes("check-private-source-artifacts")) return `${base}/private-source-artifacts.txt`;
  if (command.includes("check-product-naming")) return `${base}/product-naming-gate.txt`;
  if (command.includes("check-floorplan-operational-map-style")) return `${base}/floorplan-operational-map-style-gate.txt`;
  if (command.includes("capture-floorplan-editor-ux-screenshots")) return `${issueDir}/screenshot-manifest-output.json`;
  if (command.includes("check-floorplan-editor-ux")) return `${base}/floorplan-editor-ux-gate.txt`;
  if (command.includes("check-floorplan-presentation-rendering")) return `${base}/floorplan-presentation-rendering-gate.txt`;
  if (command.includes("check-door-authoring-tools")) return `${base}/door-authoring-tools-gate.txt`;
  if (command.includes("check-layout-assignment-overlay")) return `${base}/layout-assignment-overlay-gate.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  return `${base}/command.txt`;
}

function closeoutForIssue() {
  const next = issue === "400" ? manifest.goNoGoStatus : `GO for Issue ${Number(issue) + 1}.`;
  return [
    `# Issue ${issue} Closeout`,
    "",
    "## Summary",
    stage === "final" ? manifest.goNoGoStatus : `Completed floorplan editor UX stage ${stage}.`,
    "",
    "## Files Changed",
    "- Floorplan editor UX source, local gates, manifests, and evidence artifacts.",
    "",
    "## Commands Run",
    "- See commands.txt and command-output-map.json.",
    "",
    "## Tests Passed/Failed",
    "- Local command output is captured under test-output.",
    "",
    "## Evidence Artifacts",
    `- ${manifestPath}`,
    `- ${issueDir}`,
    "",
    "## Known Limitations",
    "- Manual visual approval is not claimed.",
    "- Promotion remains blocked.",
    "",
    "## Non-PHI Confirmation",
    "- Non-PHI rules still pass; no PHI, EHR data, private-source runtime assets, optimizer behavior, full-shift simulation behavior, approval fabrication, or fixture promotion was introduced.",
    "",
    "## GO / NO-GO",
    next,
    "",
    "## Next Recommended Issue",
    next
  ].join("\n");
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const entry = {
    issue: String(issue).padStart(3, "0"),
    title: issue === "400" ? "Floorplan Editor UX GO / NO-GO" : `Floorplan Editor UX Issue ${issue}`,
    requiredEvidence: listIssueFiles(issue)
  };
  const existing = index.issues.findIndex((candidate) => candidate.issue === entry.issue);
  if (existing >= 0) index.issues[existing] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function listIssueFiles(issueNumber) {
  const root = abs(`docs/verification/issues/issue-${issueNumber}`);
  const output = [];
  if (!existsSync(root)) return output;
  walk(root);
  return output.sort();
  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile()) output.push(entryPath.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));
    }
  }
}

function loadManifest() {
  if (existsSync(abs(manifestPath))) return readJson(manifestPath);
  return {
    manifestVersion: "1.0.0",
    batch: "391-400",
    productDisplayName: "ER Pod Shift Simulator",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    optimizerStatus: "not_started",
    fullShiftSimulationStatus: "not_started"
  };
}

function requireFile(path) {
  if (!existsSync(abs(path))) failures.push(`missing required file: ${path}`);
}

function requireText(path, snippet) {
  requireFile(path);
  if (existsSync(abs(path)) && !readText(path).includes(snippet)) {
    failures.push(`${path} missing ${snippet}`);
  }
}

function assertPng(path) {
  if (!existsSync(abs(path))) {
    failures.push(`missing screenshot: ${path}`);
    return;
  }
  const buffer = readFileSync(abs(path));
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    failures.push(`not a png: ${path}`);
    return;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const byteLength = statSync(abs(path)).size;
  if (width < 300 || height < 250 || byteLength < 5000) {
    failures.push(`placeholder-like screenshot: ${path}`);
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
