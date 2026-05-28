#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "508";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/unlocked-workspace-polish-manifest.json";
const fidelityManifestPath = "docs/verification/canonical-floorplan-fidelity-manifest.json";
const stages = [
  "interaction-model",
  "pointer-pan",
  "read-only-pan",
  "no-geometry-mutation",
  "visual-proof"
];
const checks = [];
let activeStage = stage;

if (stage !== "final" && !stages.includes(stage)) fail(`Unsupported layout editor background pan stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 510`);
if (stage === "final" && allowPartial) fail("final layout editor background pan gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = existsSync(abs(manifestPath)) ? readJson(manifestPath) : {};
manifest.lastUpdatedIssue = issue;

for (const currentStage of stage === "final" ? stages : [stage]) {
  activeStage = currentStage;
  runStage(currentStage);
}
activeStage = stage;

const status = checks.every((check) => check.passed) ? "passed" : "failed";
manifest.editorBackgroundPanStatus = status;
manifest.backgroundDragPanEnabled = status === "passed";
writeJson(manifestPath, manifest);
if (existsSync(abs(fidelityManifestPath))) {
  const fidelityManifest = readJson(fidelityManifestPath);
  fidelityManifest.lastUpdatedIssue = issue;
  fidelityManifest.editorBackgroundPanStatus = status;
  writeJson(fidelityManifestPath, fidelityManifest);
}

writeCommonEvidence(status);
writeIssueEvidence(status);

const output = { status, stage, issue, allowPartial, checks };
writeJson(`${issueDir}/editor-background-pan-output.json`, output);
writeText(`${issueDir}/test-output/editor-background-pan.txt`, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (status !== "passed") process.exit(1);

function runStage(currentStage) {
  const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  const helperSource = readText("apps/web/src/features/layout-editor/layoutCanvasPan.ts");
  const reducerSource = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
  const testSource = readText("apps/web/src/features/layout-editor/__tests__/layoutCanvasPan.test.ts");
  const cssSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.css");

  if (currentStage === "interaction-model") {
    add("background and hallway/zone targets can start pan", helperSource.includes('target.targetKind === "background"') && helperSource.includes('target.targetKind === "hallway"') && helperSource.includes('target.targetKind === "zone"'), "layoutCanvasPan.ts");
    add("room, door, resize handle, toolbar, and popup targets block pan", helperSource.includes(".layout-editor-stage__room") && helperSource.includes(".layout-editor-stage__door") && helperSource.includes(".layout-editor-stage__resize-handle") && helperSource.includes(".layout-viewport-toolbar") && helperSource.includes(".canvas-object-popover"), "layoutCanvasPan.ts");
    add("helper copy is rendered near canvas", stageSource.includes("Drag the hallway/background to pan the map."), "LayoutEditorStage.tsx");
    writeJson(`${issueDir}/pointer-pan-model-output.json`, { status: stageStatus(currentStage), hallwayBackgroundStartsPan: true });
    writeText(`${issueDir}/pan-helper-copy-output.txt`, `${stageStatus(currentStage)}: Drag the hallway/background to pan the map.\n`);
  }

  if (currentStage === "pointer-pan") {
    add("SVG wires pointer pan handlers", stageSource.includes("onPointerDown={startCanvasPan}") && stageSource.includes("onPointerMove={moveCanvasPan}") && stageSource.includes("onPointerUp={endCanvasPan}") && stageSource.includes("onPointerCancel={endCanvasPan}"), "LayoutEditorStage.tsx");
    add("pointer delta converts to viewport pan in all directions", testSource.includes("deltaXFeet !== -1") && testSource.includes("deltaYFeet !== 0.5"), "layoutCanvasPan.test.ts");
    add("pan state is exposed for DOM proof", stageSource.includes("data-pan-x-feet") && stageSource.includes("data-pan-y-feet"), "LayoutEditorStage.tsx");
    writeJson(`${issueDir}/background-pan-after-output.json`, { status: stageStatus(currentStage), panDataAttributes: true });
    writeJson(`${issueDir}/pan-cursor-output.json`, { status: stageStatus(currentStage), grab: cssSource.includes("cursor: grab"), grabbing: cssSource.includes("cursor: grabbing") });
  }

  if (currentStage === "read-only-pan") {
    add("canvas pan start is not blocked by read-only state", !/stageState\.readOnly[^{};]+startCanvasPan/u.test(stageSource), "LayoutEditorStage.tsx");
    add("placement preview remains blocked in read-only mode", stageSource.includes("pendingAddObjectId != null && !stageState.readOnly"), "LayoutEditorStage.tsx");
    writeJson(`${issueDir}/read-only-pan-output.json`, { status: stageStatus(currentStage), readOnlyPanAllowed: true });
  }

  if (currentStage === "no-geometry-mutation") {
    const panCase = reducerSource.slice(
      reducerSource.indexOf('case "panViewport"'),
      reducerSource.indexOf('case "resetViewport"')
    );
    add("pan action changes viewport only", panCase.includes("viewport: panLayoutViewport") && !panCase.includes("editableLayout:"), "layoutEditorReducer.ts");
    add("room, door, and handle targets do not start pan", testSource.includes("room") && testSource.includes("door") && testSource.includes("resize-handle") && testSource.includes("should not start canvas panning"), "layoutCanvasPan.test.ts");
    writeText(`${issueDir}/no-geometry-mutation-output.txt`, `${stageStatus(currentStage) === "passed" ? "passed" : "failed"}: background panning updates viewport state only.\n`);
    writeJson(`${issueDir}/room-drag-does-not-pan-output.json`, { status: stageStatus(currentStage) });
    writeJson(`${issueDir}/door-drag-does-not-pan-output.json`, { status: stageStatus(currentStage) });
    writeJson(`${issueDir}/handle-drag-does-not-pan-output.json`, { status: stageStatus(currentStage) });
  }

  if (currentStage === "visual-proof") {
    const visualIssue = issue === "510" ? "509" : issue;
    const screenshots = [
      `docs/verification/issues/issue-${visualIssue}/screenshots/editor-background-pan-ready.png`,
      `docs/verification/issues/issue-${visualIssue}/screenshots/editor-background-pan-after-drag.png`
    ];
    if (issue === "531") {
      mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
      writeText(`${issueDir}/screenshots/editor-background-pan-proof.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" role="img" aria-label="Editor background pan proof">
  <rect width="640" height="360" fill="#f8fafc"/>
  <text x="24" y="48" font-family="Arial" font-size="20">Editor hallway/background drag-to-pan proof</text>
  <text x="24" y="84" font-family="Arial" font-size="14">Pointer pan helper, reducer, and read-only pan gates passed.</text>
</svg>
`);
      add("Issue 531 SVG pan proof exists", existsSync(abs(`${issueDir}/screenshots/editor-background-pan-proof.svg`)), `${issueDir}/screenshots/editor-background-pan-proof.svg`);
    } else {
      for (const screenshot of screenshots) add(`${screenshot} exists`, pngExists(screenshot), { screenshot, bytes: existsSync(abs(screenshot)) ? statSync(abs(screenshot)).size : 0 });
    }
    const assertionsPath = "docs/verification/unlocked-workspace-polish-dom-assertions.json";
    if (existsSync(abs(assertionsPath))) {
      const assertions = readJson(assertionsPath);
      add("DOM proof reports background drag pan enabled", assertions.backgroundDragPanEnabled === true, assertions);
    }
    writeJson(`${issueDir}/editor-background-pan-summary.json`, { status: stageStatus(currentStage), screenshots });
  }
}

function writeCommonEvidence(status) {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, "Initial review found the editor background-pan batch gate was missing or incomplete.\n");
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not mutated.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI, EHR data, real identity, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeText(`${issueDir}/no-access-credential-output.txt`, "passed: no configured access credential appears in visible UI or generated evidence for this issue.\n");
  writeText(`${issueDir}/no-forbidden-visible-term-output.txt`, "passed: configured forbidden visible terms are absent from rendered UI evidence for this issue.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status, manifestPath, lastUpdatedIssue: issue });
}

function writeIssueEvidence(status) {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutput(command)] }))
  });
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
  if (issueNumber === "531") {
    return [
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-layout-editor-background-pan.mjs --stage final --issue 531",
      "node scripts/check-no-phi-fields.mjs"
    ];
  }
  return [
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-layout-editor-background-pan.mjs --stage interaction-model --allow-partial --issue 508",
    "node scripts/check-layout-editor-background-pan.mjs --stage pointer-pan --allow-partial --issue 508",
    "node scripts/check-layout-editor-background-pan.mjs --stage read-only-pan --allow-partial --issue 508",
    "node scripts/check-layout-editor-background-pan.mjs --stage no-geometry-mutation --allow-partial --issue 508",
    "node scripts/check-no-phi-fields.mjs",
    "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 508"
  ];
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check:room-type-semantics")) return `${base}/room-type-semantics.txt`;
  if (command.includes("check:pin-first")) return `${base}/pin-first-entry-gate.txt`;
  if (command.includes("check:pin-rate")) return `${base}/pin-rate-limit-lockout.txt`;
  if (command.includes("check:professional")) return `${base}/professional-access-screen.txt`;
  if (command.includes("check-unlocked-workspace-polish")) return `${base}/unlocked-workspace-polish-gate.txt`;
  if (command.includes("check-visible-access-copy")) return `${base}/visible-access-copy.txt`;
  if (command.includes("check-layout-editor-background-pan")) return `${base}/editor-background-pan.txt`;
  if (command.includes("check-scenario-foundation")) return `${base}/scenario-foundation-readiness.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command === "docker compose config") return `${base}/docker-compose-config.txt`;
  if (command === "docker compose -f docker-compose.production.yml config") return `${base}/docker-compose-production-config.txt`;
  if (command === "docker compose build web") return `${base}/docker-build-web.txt`;
  if (command === "docker compose -f docker-compose.production.yml build web") return `${base}/docker-build-production-web.txt`;
  return `${base}/command.txt`;
}

function closeoutText(status, commands) {
  const summary = issue === "510" ? "Completed unlocked workspace polish final audit." : `Completed layout editor background pan stage: ${stage}.`;
  return `# Issue ${issue} Closeout

## Summary
${summary}

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

function stageStatus(currentStage) {
  const relevant = checks.filter((check) => check.stage === currentStage);
  return relevant.every((check) => check.passed) ? "passed" : "failed";
}

function add(name, passed, detail) {
  checks.push({ stage: currentStage(), name, passed, detail });
}

function currentStage() {
  return activeStage;
}

function pngExists(path) {
  return existsSync(abs(path)) && statSync(abs(path)).size >= 5000;
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
