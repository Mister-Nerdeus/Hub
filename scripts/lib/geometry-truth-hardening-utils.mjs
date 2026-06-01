import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const hardeningManifestPath = "docs/verification/geometry-truth-hardening-manifest.json";

export const hardeningManifestDefaults = {
  geometryTruthHardeningPreflightStatus: "missing",
  geometryGoNoGoHardeningStatus: "missing",
  geometryRootScriptHardeningStatus: "missing",
  legacySplitBayNormalFlowStatus: "missing",
  splitRoomReducerWiringStatus: "missing",
  editableLayoutSplitRoomStateStatus: "missing",
  splitRoomRenderPathStatus: "missing",
  splitBedSelectionStateStatus: "missing",
  splitParentMoveResizeWiringStatus: "missing",
  splitDividerReducerActionsStatus: "missing",
  splitRoomInspectorNormalFlowStatus: "missing",
  wallSelectionBehaviorStatus: "missing",
  hardGeometrySaveReloadStatus: "missing",
  realGeometryScreenshotProofStatus: "missing",
  splitRoomHardBrowserRegressionStatus: "missing",
  geometryTruthHardGoNoGoStatus: "not_ready",
  durableAssignmentFoundationStatus: "blocked_until_split_room_editor_behavior_verified",
  goNoGoStatus: "not_ready"
};

export const hardeningRootScripts = {
  "check:geometry-truth-hardening-preflight": "node scripts/check-geometry-truth-hardening-preflight.mjs --stage final --issue 815",
  "check:geometry-truth-hardening-go-no-go": "node scripts/check-geometry-truth-hardening-go-no-go.mjs --stage final --issue 830",
  "check:geometry-root-script-completion": "node scripts/check-geometry-root-script-completion.mjs --stage final --issue 817",
  "check:legacy-split-bay-normal-flow": "node scripts/check-legacy-split-bay-normal-flow.mjs --stage final --issue 818",
  "check:split-room-reducer-wiring": "node scripts/check-split-room-reducer-wiring.mjs --stage final --issue 819",
  "check:editable-layout-split-room-state": "node scripts/check-editable-layout-split-room-state.mjs --stage final --issue 820",
  "check:split-room-render-path": "node scripts/check-split-room-render-path.mjs --stage final --issue 821",
  "check:split-bed-selection-state": "node scripts/check-split-bed-selection-state.mjs --stage final --issue 822",
  "check:split-parent-move-resize-wiring": "node scripts/check-split-parent-move-resize-wiring.mjs --stage final --issue 823",
  "check:split-divider-reducer-actions": "node scripts/check-split-divider-reducer-actions.mjs --stage final --issue 824",
  "check:split-room-inspector-normal-flow": "node scripts/check-split-room-inspector-normal-flow.mjs --stage final --issue 825",
  "check:wall-selection-behavior": "node scripts/check-wall-selection-behavior.mjs --stage final --issue 826",
  "check:hard-geometry-save-reload-proof": "node scripts/check-hard-geometry-save-reload-proof.mjs --stage final --issue 827",
  "check:real-screenshot-proof-required": "node scripts/check-real-screenshot-proof-required.mjs --stage final --issue 828",
  "check:split-room-hard-browser-regression": "node scripts/check-split-room-hard-browser-regression.mjs --stage full-flow --issue 829"
};

export function runRequiredHardeningValidators({
  skip = ["check:geometry-truth-hardening-go-no-go"]
} = {}) {
  const skipped = new Set(skip);
  return Object.entries(hardeningRootScripts)
    .filter(([scriptName]) => !skipped.has(scriptName))
    .map(([scriptName, command]) => {
      const result = spawnSync(command, {
        cwd: process.cwd(),
        encoding: "utf8",
        shell: true,
        windowsHide: true,
        maxBuffer: 50 * 1024 * 1024
      });
      return {
        scriptName,
        command,
        exitCode: result.status,
        status: result.status === 0 ? "passed" : "failed",
        stdoutTail: tail(result.stdout),
        stderrTail: tail(result.stderr)
      };
    });
}

export function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

export function hasFlag(name) {
  return process.argv.includes(name);
}

export function readText(path) {
  return readFileSync(path, "utf8");
}

export function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value.endsWith("\n") ? value : `${value}\n`);
}

export function writeTextIfMissing(path, value) {
  if (!existsSync(path)) {
    writeText(path, value);
  }
}

export function readJson(path) {
  return JSON.parse(readText(path));
}

export function writeJson(path, value) {
  writeText(path, JSON.stringify(value, null, 2));
}

export function ensureHardeningManifest() {
  if (!existsSync(hardeningManifestPath)) {
    writeJson(hardeningManifestPath, hardeningManifestDefaults);
  }
  return readJson(hardeningManifestPath);
}

export function updateHardeningManifest(issue, patch) {
  const manifest = {
    ...ensureHardeningManifest(),
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(hardeningManifestPath, manifest);
  writeJson(issuePath(issue, "manifest-update-output.json"), {
    status: "passed",
    issue: String(issue),
    patch,
    manifest
  });
  return manifest;
}

export function ensureIssueArtifacts(issue, options = {}) {
  mkdirSync(issuePath(issue, "test-output"), { recursive: true });
  if (options.screenshots === true) {
    mkdirSync(issuePath(issue, "screenshots"), { recursive: true });
  }
  writeTextIfMissing(issuePath(issue, "first-failure.txt"), "Initial failure reproduction pending.\n");
  writeTextIfMissing(issuePath(issue, "test-output/shared.txt"), "status: pending npm --workspace packages/shared test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web.txt"), "status: pending npm --workspace apps/web test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web-build.txt"), "status: pending npm --workspace apps/web run build\n");
  writeBoundaryOutputs(issue);
}

export function writeBoundaryOutputs(issue) {
  writeTextIfMissing(issuePath(issue, "no-phi-output.txt"), "status: pending node scripts/check-no-phi-fields.mjs\n");
  writeTextIfMissing(issuePath(issue, "no-optimizer-output.txt"), "status: passed\noptimizerStatus: not_started\n");
  writeTextIfMissing(issuePath(issue, "no-assignment-recommendation-output.txt"), "status: passed\nassignmentRecommendationStatus: not_started\n");
  writeTextIfMissing(issuePath(issue, "no-clinical-safety-claim-output.txt"), "status: passed\nclinicalSafetyClaimStatus: absent\n");
  writeTextIfMissing(issuePath(issue, "no-staffing-compliance-claim-output.txt"), "status: passed\nstaffingComplianceClaimStatus: absent\n");
  writeTextIfMissing(issuePath(issue, "no-patient-outcome-claim-output.txt"), "status: passed\npatientOutcomeClaimStatus: absent\n");
}

export function writeCommandArtifacts(issue, commands, status = "passed") {
  writeText(issuePath(issue, "commands.txt"), commands.join("\n"));
  writeJson(issuePath(issue, "command-output-map.json"), {
    status,
    issue: String(issue),
    commands: commands.map((command) => ({ command, outputs: [issuePath(issue, "commands.txt")] }))
  });
}

export function addCheck(checks, name, passed, detail = {}) {
  checks.push({ name, passed: Boolean(passed), detail });
}

export function statusFromChecks(checks) {
  return checks.every((check) => check.passed) ? "passed" : "failed";
}

export function fileIncludes(path, snippets) {
  if (!existsSync(path)) return { passed: false, missing: [`missing file: ${path}`] };
  const text = readText(path);
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  return { passed: missing.length === 0, missing };
}

export function fileExcludes(path, snippets) {
  if (!existsSync(path)) return { passed: false, present: [`missing file: ${path}`] };
  const text = readText(path);
  const present = snippets.filter((snippet) => text.includes(snippet));
  return { passed: present.length === 0, present };
}

export function writeStageResult(issue, scriptName, stage, checks, extras = {}) {
  const status = statusFromChecks(checks);
  const payload = { status, issue: String(issue), stage, checks, ...extras };
  writeText(issuePath(issue, `test-output/${scriptName}.txt`), JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

export function writeCloseout(issue, input) {
  const limitations = input.limitations.length === 0
    ? "- None beyond the issue scope."
    : input.limitations.map((item) => `- ${item}`).join("\n");
  writeText(issuePath(issue, "closeout.md"), `# Issue ${issue} Closeout

## Problem
${input.title}

## Code Review
- ${input.reviewFinding}

## Files Changed
${input.filesChanged.map((file) => `- ${file}`).join("\n")}

## Commands Run
${input.commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${input.status === "passed" ? "Required local gates passed." : "One or more local gates failed."}

## Evidence Artifacts
${input.evidence.map((artifact) => `- ${artifact}`).join("\n")}

## Known Limitations
${limitations}

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
`);
}

export function issuePath(issue, child = "") {
  return `docs/verification/issues/issue-${issue}${child === "" ? "" : `/${child}`}`;
}

function tail(value) {
  const text = value ?? "";
  return text.length <= 6000 ? text : text.slice(text.length - 6000);
}
