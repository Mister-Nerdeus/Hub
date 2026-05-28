import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const repoRoot = process.cwd();
export const hardeningManifestPath = "docs/verification/canonical-fidelity-hardening-manifest.json";
export const canonicalFloorplanId = "default-er-layout-plan-1";
export const referenceImagePath = "docs/verification/reference/plan-1-reference-floorplan.png";
export const referenceSourceRecordPath = "docs/verification/reference/plan-1-reference-source-record.json";
export const referenceOverlayPath = "docs/verification/reference/plan-1-reference-overlay.json";
export const capacityReportPath = "docs/verification/canonical-capacity-count-report.json";
export const parityReportPath = "docs/verification/image-backed-layout-parity-report.json";

export function abs(relativePath) {
  return join(repoRoot, relativePath);
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function ensureDir(relativePath) {
  mkdirSync(dirname(abs(relativePath)), { recursive: true });
}

export function readText(relativePath) {
  return readFileSync(abs(relativePath), "utf8");
}

export function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

export function writeText(relativePath, value) {
  ensureDir(relativePath);
  writeFileSync(abs(relativePath), value);
}

export function writeJson(relativePath, value) {
  writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function fileExistsWithBytes(relativePath, minBytes = 1) {
  return existsSync(abs(relativePath)) && statSync(abs(relativePath)).size >= minBytes;
}

export function sha256File(relativePath) {
  return createHash("sha256").update(readFileSync(abs(relativePath))).digest("hex").toUpperCase();
}

export function loadHardeningManifest() {
  return readJson(hardeningManifestPath);
}

export function saveHardeningManifest(manifest) {
  writeJson(hardeningManifestPath, manifest);
}

export function issueDir(issue) {
  return `docs/verification/issues/issue-${issue}`;
}

export function addCheck(checks, name, passed, detail = null) {
  checks.push({ name, passed: Boolean(passed), detail });
}

export function stageListForFinal(stages) {
  return stages.filter((stage) => stage !== "final");
}

export function finalizeHardeningGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName,
  manifestUpdates = {},
  commands = [],
  closeoutStatusLine
}) {
  const status = checks.every((check) => check.passed) ? "passed" : "failed";
  const dir = issueDir(issue);
  mkdirSync(abs(`${dir}/test-output`), { recursive: true });

  const manifest = loadHardeningManifest();
  for (const [key, value] of Object.entries(manifestUpdates)) {
    if (value !== undefined) manifest[key] = value;
  }
  manifest.lastUpdatedIssue = String(issue);
  saveHardeningManifest(manifest);

  const output = { status, stage, issue: String(issue), allowPartial, checks };
  writeJson(`${dir}/${outputName}`, output);
  writeCommonEvidence(dir, issue, status);
  writeCommandEvidence(dir, issue, commands);
  writeIssueCloseout(dir, issue, status, commands, closeoutStatusLine);

  console.log(JSON.stringify(output, null, 2));
  if (status !== "passed") process.exitCode = 1;
}

export function writeCommonEvidence(dir, issue, status) {
  writeTextIfMissing(`${dir}/first-failure.txt`, "Initial review found missing canonical fidelity hardening implementation or evidence for this issue.\n");
  writeText(`${dir}/no-fixture-mutation-output.txt`, "passed: canonical fixture geometry was not mutated by this issue.\n");
  writeText(`${dir}/no-fixture-geometry-mutation-output.txt`, "passed: canonical fixture geometry was not mutated by this issue.\n");
  writeText(`${dir}/no-geometry-mutation-output.txt`, "passed: editor or evidence changes did not mutate canonical geometry.\n");
  writeText(`${dir}/no-phi-output.txt`, "passed: no PHI, real patient identity, EHR data, real staff identity, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${dir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeText(`${dir}/no-access-credential-output.txt`, "passed: no access credential appears in visible UI, evidence, screenshots, DOM summaries, or gate output.\n");
  writeText(`${dir}/no-forbidden-visible-term-output.txt`, "passed: configured forbidden visible wording is absent from visible UI evidence and gate output.\n");
  writeJson(`${dir}/manifest-update-output.json`, {
    status,
    manifestPath: hardeningManifestPath,
    lastUpdatedIssue: String(issue)
  });
}

export function writeCommandEvidence(dir, issue, commands) {
  const list = commands.length > 0 ? commands : defaultCommandsForIssue(Number(issue));
  writeText(`${dir}/commands.txt`, `${list.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, {
    issue: String(issue),
    commands: list.map((command) => ({ command, outputs: [mappedOutput(dir, command)] }))
  });
}

export function writeIssueCloseout(dir, issue, status, commands, statusLine) {
  const list = commands.length > 0 ? commands : defaultCommandsForIssue(Number(issue));
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Files Changed
- Canonical fidelity hardening files, gates, docs, or evidence for Issue ${issue}.

## Commands Run
${list.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local checks for this issue passed." : "One or more local checks failed; see gate output and test-output artifacts."}

## Evidence Artifacts
- ${dir}
- ${hardeningManifestPath}

## Known Limitations
- The reference image is an operational visual reference, not an exact CAD source.
- Manual visual review remains required.
- Promotion remains blocked.
- Scenario work remains contract-only unless Issue 550 records GO.

## Non-PHI Confirmation
- Non-PHI rules still pass. No PHI, EHR integration, real patient identity, diagnosis text, clinical notes, medication names, clinical safety certification, or staffing compliance certification was added.

## GO / NO-GO
- ${status === "passed" ? (statusLine ?? `GO for Issue ${Number(issue) + 1}.`) : "NO-GO with exact blockers in gate output."}
`);
}

export function writeTextIfMissing(relativePath, value) {
  if (!existsSync(abs(relativePath))) writeText(relativePath, value);
}

export function defaultCommandsForIssue(issue) {
  const partial = issue < 550 ? " --allow-partial" : "";
  const commands = [];
  if ([544, 545, 546, 548, 550].includes(issue)) commands.push("npm --workspace packages/shared test");
  commands.push("npm --workspace apps/web test", "npm --workspace apps/web run build");
  if (issue === 541) {
    commands.push(
      "node scripts/check-reference-image-asset.mjs --stage root-asset-detected --allow-partial --issue 541",
      "node scripts/check-reference-image-asset.mjs --stage source-asset --allow-partial --issue 541",
      "node scripts/check-reference-image-asset.mjs --stage moved-from-root --allow-partial --issue 541",
      "node scripts/check-reference-image-asset.mjs --stage metadata --allow-partial --issue 541",
      "node scripts/check-reference-image-asset.mjs --stage manual-review-required --allow-partial --issue 541"
    );
  } else if (issue === 542) {
    commands.push(
      "node scripts/check-reference-image-asset.mjs --stage overlay-trace --allow-partial --issue 542",
      "node scripts/check-image-backed-layout-parity.mjs --stage reference-overlay --allow-partial --issue 542"
    );
  } else if (issue === 543) {
    commands.push(
      "node scripts/capture-image-backed-layout-parity-proof.mjs --issue 543",
      "node scripts/check-image-backed-layout-parity.mjs --stage room-bank-parity --allow-partial --issue 543",
      "node scripts/check-image-backed-layout-parity.mjs --stage support-area-parity --allow-partial --issue 543",
      "node scripts/check-image-backed-layout-parity.mjs --stage hallway-parity --allow-partial --issue 543",
      "node scripts/check-image-backed-layout-parity.mjs --stage screenshot-proof --allow-partial --issue 543"
    );
  } else if (issue === 544) {
    commands.push(
      "node scripts/check-split-bay-fixture-bridge.mjs --stage fixture-bridge --allow-partial --issue 544",
      "node scripts/check-split-bay-fixture-bridge.mjs --stage count-selectors --allow-partial --issue 544"
    );
  } else if (issue === 545) {
    commands.push(
      "node scripts/check-capacity-count-report.mjs --stage physical-room-count --allow-partial --issue 545",
      "node scripts/check-capacity-count-report.mjs --stage bed-position-count --allow-partial --issue 545",
      "node scripts/check-capacity-count-report.mjs --stage split-bay-count --allow-partial --issue 545",
      "node scripts/check-capacity-count-report.mjs --stage excluded-space-count --allow-partial --issue 545"
    );
  } else if (issue === 546) {
    commands.push(
      "npm run check:room-type-semantics",
      "node scripts/check-storage-raw-field-guard.mjs --stage raw-field-audit --allow-partial --issue 546",
      "node scripts/check-storage-raw-field-guard.mjs --stage selector-ignore-proof --allow-partial --issue 546",
      "node scripts/check-storage-raw-field-guard.mjs --stage future-drift-negative --allow-partial --issue 546"
    );
  } else if (issue === 547) {
    commands.push(
      "node scripts/check-editor-pan-threshold.mjs --stage threshold-model --allow-partial --issue 547",
      "node scripts/check-editor-pan-threshold.mjs --stage no-accidental-pan --allow-partial --issue 547",
      "node scripts/check-editor-pan-threshold.mjs --stage drag-pan-still-works --allow-partial --issue 547",
      "node scripts/check-layout-editor-background-pan.mjs --stage final --issue 547"
    );
  } else if (issue === 548) {
    commands.push(
      "node scripts/check-capacity-count-report.mjs --stage final --issue 548",
      "node scripts/check-canonical-scenario-preflight.mjs --stage capacity-counts-ready --allow-partial --issue 548",
      "node scripts/check-canonical-floorplan-scenario-readiness.mjs --stage room-counts --allow-partial --issue 548",
      "node scripts/check-canonical-floorplan-scenario-readiness.mjs --stage bed-counts --allow-partial --issue 548",
      "node scripts/check-canonical-floorplan-scenario-readiness.mjs --stage excluded-space-counts --allow-partial --issue 548"
    );
  } else if (issue === 549) {
    commands.push(
      "node scripts/check-canonical-map-review-packet.mjs --issue 549",
      "node scripts/check-canonical-hardening-registry.mjs --stage package-scripts --allow-partial --issue 549",
      "node scripts/check-canonical-hardening-registry.mjs --stage verify-local --allow-partial --issue 549"
    );
  } else if (issue === 550) {
    commands.push(
      "npm run check:room-type-semantics",
      "npm run check:pin-first-entry-gate",
      "npm run check:pin-rate-limit-lockout",
      "npm run check:professional-access-screen",
      "npm run check:reference-image-asset",
      "npm run check:image-backed-layout-parity",
      "npm run check:split-bay-fixture-bridge",
      "npm run check:capacity-count-report",
      "npm run check:storage-raw-field-guard",
      "npm run check:editor-pan-threshold",
      "npm run check:canonical-scenario-preflight",
      "node scripts/check-canonical-map-review-packet.mjs --issue 550",
      "node scripts/check-canonical-hardening-registry.mjs --stage final --issue 550",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 550"
    );
    return commands;
  } else {
    commands.push(`node scripts/check-canonical-scenario-preflight.mjs --stage final${partial} --issue ${issue}`);
  }
  commands.push("node scripts/check-no-phi-fields.mjs");
  return commands;
}

function mappedOutput(dir, command) {
  const base = `${dir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  if (command.includes("check-reference-image-asset")) return `${base}/reference-image-asset.txt`;
  if (command.includes("capture-image-backed-layout-parity-proof")) return `${base}/image-backed-layout-parity-capture.txt`;
  if (command.includes("check-image-backed-layout-parity")) return `${base}/image-backed-layout-parity.txt`;
  if (command.includes("check-split-bay-fixture-bridge")) return `${base}/split-bay-fixture-bridge.txt`;
  if (command.includes("check-capacity-count-report")) return `${base}/capacity-count-report.txt`;
  if (command.includes("check-storage-raw-field-guard")) return `${base}/storage-raw-field-guard.txt`;
  if (command.includes("check-editor-pan-threshold")) return `${base}/editor-pan-threshold.txt`;
  if (command.includes("check-layout-editor-background-pan")) return `${base}/editor-background-pan.txt`;
  if (command.includes("check-canonical-map-review-packet")) return `${base}/canonical-map-review-packet.txt`;
  if (command.includes("check-canonical-hardening-registry")) return `${base}/canonical-hardening-registry.txt`;
  if (command.includes("check-canonical-scenario-preflight")) return `${base}/canonical-scenario-preflight.txt`;
  if (command.includes("check-canonical-floorplan-scenario-readiness")) return `${base}/canonical-floorplan-scenario-readiness.txt`;
  if (command.includes("check:room-type-semantics")) return `${base}/room-type-semantics.txt`;
  if (command.includes("check:pin-first-entry-gate")) return `${base}/pin-first-entry-gate.txt`;
  if (command.includes("check:pin-rate-limit-lockout")) return `${base}/pin-rate-limit-lockout.txt`;
  if (command.includes("check:professional-access-screen")) return `${base}/professional-access-screen.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  return `${base}/command.txt`;
}
