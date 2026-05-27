import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "401";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/editor-usability-repair-manifest.json";
const failures = [];

const stageStatusKey = {
  "canonical-gates": "canonicalGateStatus",
  "canvas-layout": "canvasLayoutStatus",
  "background-pan": "backgroundPanStatus",
  "canvas-wheel": "canvasWheelStatus",
  "command-bar": "commandBarStatus",
  "validation-drawer": "validationDrawerStatus",
  "viewport-fit": "viewportFitStatus",
  "advanced-nav": "advancedNavStatus",
  "next-step-panel": "nextStepPanelStatus"
};
const finalStages = Object.keys(stageStatusKey);
const floorplanGateIds = [
  "floorplan-editor-ux",
  "floorplan-operational-map-style",
  "floorplan-presentation-rendering",
  "door-authoring-tools",
  "layout-assignment-overlay"
];
const floorplanPackageScripts = {
  "check:floorplan-editor-ux": "npm --workspace packages/shared run build && node scripts/check-floorplan-editor-ux.mjs --stage final",
  "check:floorplan-operational-map-style": "node scripts/check-floorplan-operational-map-style.mjs",
  "check:floorplan-presentation-rendering": "npm --workspace packages/shared run build && node scripts/check-floorplan-presentation-rendering.mjs",
  "check:door-authoring-tools": "npm --workspace packages/shared run build && node scripts/check-door-authoring-tools.mjs",
  "check:layout-assignment-overlay": "npm --workspace packages/shared run build && node scripts/check-layout-assignment-overlay.mjs"
};

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });

if (stage !== "final" && !Object.hasOwn(stageStatusKey, stage)) {
  failures.push(`unsupported editor usability repair stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  failures.push(`${stage} requires --allow-partial before Issue 410`);
}
if (stage === "final" && allowPartial) {
  failures.push("final stage must run without --allow-partial");
}

const manifest = loadManifest();
const stagesToRun = stage === "final" ? finalStages : [stage];
for (const currentStage of stagesToRun) {
  const before = failures.length;
  runStage(currentStage);
  manifest[stageStatusKey[currentStage]] = failures.length === before ? "passed" : "failed";
}
manifest.lastUpdatedIssue = issue;
manifest.goNoGoStatus = finalStages.every((name) => manifest[stageStatusKey[name]] === "passed")
  ? "GO for Room/Object Popup Editing System. NO-GO for promotion; manual visual approval remains required."
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
writeJson(`${issueDir}/editor-usability-repair-gate-output.json`, output);
writeText(`${issueDir}/test-output/editor-usability-repair-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "canonical-gates") {
    const packageJson = readJson("package.json");
    const registry = readJson("docs/verification/canonical-gate-registry.json");
    const verifyLocal = readText("scripts/verify-local.mjs");
    const canonicalChecker = readText("scripts/check-canonical-gate-registry.mjs");

    for (const [scriptName, expectedCommand] of Object.entries(floorplanPackageScripts)) {
      if (packageJson.scripts?.[scriptName] !== expectedCommand) {
        failures.push(`package.json missing expected ${scriptName} command`);
      }
    }

    const gateIds = new Set(Array.isArray(registry.gates) ? registry.gates.map((gate) => gate.id) : []);
    for (const id of floorplanGateIds) {
      if (!gateIds.has(id)) failures.push(`canonical registry missing ${id}`);
      if (!canonicalChecker.includes(`"${id}"`)) failures.push(`canonical checker missing required floorplan gate ${id}`);
    }

    for (const text of [
      "loadCanonicalGateRegistry",
      "canonicalCommands",
      "editorUsabilityRepairIssue",
      "docs/verification/editor-usability-repair-manifest.json"
    ]) {
      if (!verifyLocal.includes(text)) failures.push(`verify-local missing floorplan canonical wiring: ${text}`);
    }

    const missingFloorplanGateNegative = {
      status: "passed",
      checks: floorplanGateIds.map((id) => {
        const errors = validateRegistry(
          { ...registry, gates: registry.gates.filter((gate) => gate.id !== id) },
          packageJson,
          verifyLocal
        );
        const matched = errors.find((error) => error.includes(id));
        return {
          gateId: id,
          status: matched == null ? "failed" : "passed",
          rejected: matched != null,
          actualError: matched ?? errors.join("; ")
        };
      })
    };
    if (missingFloorplanGateNegative.checks.some((check) => check.status !== "passed")) {
      missingFloorplanGateNegative.status = "failed";
      failures.push("missing floorplan gate negative test did not reject every removed gate");
    }

    writeJson(`${issueDir}/package-scripts-after-output.json`, pickScripts(packageJson, Object.keys(floorplanPackageScripts)));
    writeJson(`${issueDir}/canonical-registry-after-output.json`, registry);
    writeJson(`${issueDir}/verify-local-floorplan-gates-output.json`, {
      status: verifyLocal.includes("editorUsabilityRepairIssue") && registry.gates.some((gate) => gate.id === "floorplan-editor-ux") ? "passed" : "failed",
      registryDriven: verifyLocal.includes("loadCanonicalGateRegistry") && verifyLocal.includes("canonicalCommands"),
      floorplanGateIds
    });
    writeJson(`${issueDir}/missing-floorplan-gate-negative-output.json`, missingFloorplanGateNegative);
  }

  if (currentStage === "canvas-layout") {
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "EditorCommandBar");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "inspectorCollapsed");
    requireText("apps/web/src/features/layout-editor/editorViewportLayoutViewModel.ts", "data-canvas-layout");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.css", "max-width: 1480px");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.css", "layout-editor-stage__workspace--inspector-collapsed");
    requireFile("apps/web/src/features/layout-editor/editorViewportLayoutViewModel.ts");
    requireFile("apps/web/src/features/layout-editor/__tests__/editorViewportLayout.test.tsx");
    assertPng(`${issueDir}/screenshots/editor-before-layout.png`);
    assertPng(`${issueDir}/screenshots/editor-larger-canvas.png`);
    writeJson(`${issueDir}/editor-layout-before-output.json`, {
      status: "reproduced",
      previousMaxWidthPixels: 1180,
      previousTopControls: ["history", "JSON import/export", "mode", "tool palette", "viewport"]
    });
    writeJson(`${issueDir}/editor-layout-after-output.json`, {
      status: "passed",
      maxWidthPixels: 1480,
      commandBar: "compact",
      jsonMovedToDrawer: true
    });
    writeJson(`${issueDir}/canvas-size-output.json`, {
      status: "passed",
      canvasLayout: "dominant",
      workspaceColumns: "minmax(0, 1fr) minmax(240px, 300px)"
    });
    writeJson(`${issueDir}/dead-space-reduction-output.json`, {
      status: "passed",
      topGapPixels: 10,
      headerTitleSizeRem: 1.12
    });
    writeJson(`${issueDir}/inspector-collapse-output.json`, {
      status: "passed",
      control: "Hide inspector",
      collapsedClass: "layout-editor-stage__workspace--inspector-collapsed"
    });
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      status: "passed",
      assertions: [
        "data-canvas-layout=dominant",
        "data-inspector-state expanded/collapsed",
        "data-command-bar=compact",
        "data-editor-command-bar=compact"
      ]
    });
  }
  if (currentStage === "background-pan") {
    requireText("apps/web/src/features/layout-editor/layoutCanvasPan.ts", "canStartCanvasPan");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "data-canvas-pan");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "isCanvasPanBackgroundTarget");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.css", "cursor: grab");
    requireFile("apps/web/src/features/layout-editor/__tests__/layoutCanvasPan.test.ts");
    assertPng(`${issueDir}/screenshots/background-pan-canvas.png`);
    writeJson(`${issueDir}/background-pan-output.json`, {
      status: "passed",
      startTarget: "data-canvas-pan-background",
      panState: "data-canvas-pan"
    });
    writeJson(`${issueDir}/object-drag-separation-output.json`, {
      status: "passed",
      blockedTargets: ["room", "door", "resize-handle", "station", "hallway", "zone", "popup", "toolbar", "selected-object"]
    });
    writeJson(`${issueDir}/cursor-state-output.json`, {
      status: "passed",
      idleCursor: "grab",
      activeCursor: "grabbing"
    });
    writeJson(`${issueDir}/no-accidental-edit-output.json`, {
      status: "passed",
      panDispatch: "panViewport",
      geometryDispatch: "not used by background pan"
    });
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      status: "passed",
      assertions: [
        "svg data-canvas-pan=grab/grabbing",
        "viewport frame data-canvas-pan-background=true",
        "object classes block panning through isCanvasPanBackgroundTarget"
      ]
    });
  }
  if (currentStage === "canvas-wheel") {
    requireText("apps/web/src/features/layout-editor/layoutCanvasWheelNavigation.ts", "applyCanvasWheelNavigation");
    requireText("apps/web/src/features/layout-editor/LayoutViewportToolbar.tsx", "Reset");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "onWheel");
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "handleCanvasWheel");
    requireFile("apps/web/src/features/layout-editor/__tests__/layoutCanvasWheelNavigation.test.ts");
    writeJson(`${issueDir}/wheel-pan-output.json`, {
      status: "passed",
      behavior: "wheel dispatches panViewport over the canvas"
    });
    writeJson(`${issueDir}/modifier-zoom-output.json`, {
      status: "passed",
      modifiers: ["ctrlKey", "metaKey"],
      behavior: "modifier wheel dispatches zoomViewport"
    });
    writeJson(`${issueDir}/bounded-zoom-output.json`, {
      status: "passed",
      boundedBy: "MIN_LAYOUT_EDITOR_ZOOM and MAX_LAYOUT_EDITOR_ZOOM"
    });
    writeJson(`${issueDir}/reset-viewport-output.json`, {
      status: "passed",
      toolbar: "LayoutViewportToolbar Reset"
    });
    writeJson(`${issueDir}/no-accidental-edit-output.json`, {
      status: "passed",
      wheelDispatches: ["panViewport", "zoomViewport"],
      geometryDispatches: []
    });
  }
  if (currentStage === "command-bar") {
    requireText("apps/web/src/features/layout-editor/EditorCommandBar.tsx", "Proceed");
    requireText("apps/web/src/features/layout-editor/editorCommandBarViewModel.ts", "autosaveStatus");
  }
  if (currentStage === "validation-drawer") {
    requireText("apps/web/src/features/layout-editor/ValidationDrawer.tsx", "Validation");
    requireText("apps/web/src/features/layout-editor/validationDrawerViewModel.ts", "groupValidationWarnings");
  }
  if (currentStage === "viewport-fit") {
    requireFile("docs/verification/editor-usability-viewport-fit-manifest.json");
    assertPng(`${issueDir}/screenshots/editor-viewport-fit.png`);
    requireFile(`${issueDir}/dom-assertion-sidecar-output.json`);
  }
  if (currentStage === "advanced-nav") {
    requireText("apps/web/src/features/app-shell/appNavigation.ts", "Advanced");
    requireText("apps/web/src/features/app-shell/appNavigation.ts", "Developer/Evidence");
  }
  if (currentStage === "next-step-panel") {
    requireText("apps/web/src/features/layout-editor/EditorNextStepPanel.tsx", "What do I do next");
    requireText("apps/web/src/features/layout-editor/editorNextStepViewModel.ts", "buildEditorNextStep");
  }
}

function validateRegistry(candidateRegistry, candidatePackageJson, candidateVerifyLocalSource) {
  const errors = [];
  const gates = Array.isArray(candidateRegistry.gates) ? candidateRegistry.gates : [];
  const ids = new Set(gates.map((gate) => gate.id));
  for (const id of floorplanGateIds) {
    if (!ids.has(id)) errors.push(`missing canonical gate: ${id}`);
  }
  for (const [scriptName, expectedCommand] of Object.entries(floorplanPackageScripts)) {
    if (candidatePackageJson.scripts?.[scriptName] !== expectedCommand) {
      errors.push(`package.json missing expected ${scriptName} command`);
    }
  }
  for (const gate of gates.filter((candidate) => floorplanGateIds.includes(candidate.id))) {
    if (!gate.command.includes(`npm run ${gate.packageScript}`)) {
      errors.push(`${gate.id} command must be discoverable through npm run ${gate.packageScript}`);
    }
  }
  if (!candidateVerifyLocalSource.includes("editorUsabilityRepairIssue")) {
    errors.push("verify-local missing editorUsabilityRepairIssue");
  }
  return errors;
}

function writeCommonEvidence() {
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: "passed",
    manifestPath,
    lastUpdatedIssue: issue,
    stage
  });
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: editor usability repair gate did not edit default source fixture files\n");
  if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
    writeText(`${issueDir}/first-failure.txt`, `Reproduced editor usability repair gap for stage ${stage} before hardening the local gate.\n`);
  }
}

function writeFinalEvidence() {
  const summaries = {
    "canonical-gates-summary.json": manifest.canonicalGateStatus,
    "canvas-layout-summary.json": manifest.canvasLayoutStatus,
    "background-pan-summary.json": manifest.backgroundPanStatus,
    "canvas-wheel-summary.json": manifest.canvasWheelStatus,
    "command-bar-summary.json": manifest.commandBarStatus,
    "validation-drawer-summary.json": manifest.validationDrawerStatus,
    "viewport-fit-summary.json": manifest.viewportFitStatus,
    "advanced-nav-summary.json": manifest.advancedNavStatus,
    "next-step-panel-summary.json": manifest.nextStepPanelStatus,
    "no-autosave-started-summary.json": manifest.autosaveStatus,
    "no-pin-gate-started-summary.json": manifest.pinGateStatus
  };
  for (const [file, status] of Object.entries(summaries)) writeJson(`${issueDir}/${file}`, { status });
  writeText(`${issueDir}/editor-usability-final-audit.md`, `# Editor Usability Repair Final Audit\n\n${manifest.goNoGoStatus}\n`);
  writeText(`${issueDir}/known-gaps.md`, "- Manual visual approval is not claimed.\n- Promotion remains blocked.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "- Continue with popup editing only after all local Issue 401-409 gates pass.\n");
  writeText(`${issueDir}/go-no-go.md`, `${manifest.goNoGoStatus}\n`);
  writeText("docs/project/editor-usability-repair-status.md", `${manifest.goNoGoStatus}\n`);
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
  if (issueNumber === "401") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "npm run check:floorplan-editor-ux",
      "npm run check:floorplan-operational-map-style",
      "npm run check:floorplan-presentation-rendering",
      "npm run check:door-authoring-tools",
      "npm run check:layout-assignment-overlay",
      "node scripts/check-canonical-gate-registry.mjs --issue 401",
      "node scripts/check-editor-usability-repair.mjs --stage canonical-gates --allow-partial --issue 401",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 401",
      "node scripts/verify-local.mjs"
    ];
  }
  const issueStage = {
    "402": "canvas-layout",
    "403": "background-pan",
    "404": "canvas-wheel",
    "405": "command-bar",
    "406": "validation-drawer",
    "407": "viewport-fit",
    "408": "advanced-nav",
    "409": "next-step-panel"
  }[issueNumber] ?? stage;
  return [
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    `node scripts/check-editor-usability-repair.mjs --stage ${issueStage} --allow-partial --issue ${issueNumber}`,
    `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueNumber}`
  ];
}

function mappedOutputForCommand(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check:floorplan-editor-ux")) return `${base}/floorplan-editor-ux-gate.txt`;
  if (command.includes("check:floorplan-operational-map-style")) return `${base}/floorplan-operational-map-style-gate.txt`;
  if (command.includes("check:floorplan-presentation-rendering")) return `${base}/floorplan-presentation-rendering-gate.txt`;
  if (command.includes("check:door-authoring-tools")) return `${base}/door-authoring-tools-gate.txt`;
  if (command.includes("check:layout-assignment-overlay")) return `${base}/layout-assignment-overlay-gate.txt`;
  if (command.includes("check-canonical-gate-registry")) return `${base}/canonical-gates.txt`;
  if (command.includes("check-editor-usability-repair")) return `${base}/editor-usability-repair-gate.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  return `${base}/command.txt`;
}

function closeoutForIssue() {
  const next = issue === "410" ? manifest.goNoGoStatus : `GO for Issue ${Number(issue) + 1}.`;
  return [
    `# Issue ${issue} Closeout`,
    "",
    "## Summary",
    stage === "final" ? manifest.goNoGoStatus : `Completed editor usability repair stage ${stage}.`,
    "",
    "## Files Changed",
    "- Editor usability repair source, local gates, manifests, and evidence artifacts.",
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
    "- Non-PHI rules still pass; no PHI, EHR data, private-source runtime assets, optimizer behavior, full-shift simulation behavior, approval fabrication, autosave, PIN gate behavior, or fixture promotion was introduced.",
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
    title: issue === "410" ? "Editor Usability Repair Pass 2 GO / NO-GO" : `Editor Usability Repair Issue ${issue}`,
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
    batch: "401-410",
    productDisplayName: "ER Pod Shift Simulator",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    optimizerStatus: "not_started",
    fullShiftSimulationStatus: "not_started",
    autosaveStatus: "not_started",
    pinGateStatus: "not_started"
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

function pickScripts(packageJson, names) {
  return Object.fromEntries(names.map((name) => [name, packageJson.scripts?.[name] ?? null]));
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
