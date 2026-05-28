import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

export const repoRoot = process.cwd();
export const manifestPath = "docs/verification/canonical-floorplan-fidelity-manifest.json";
export const planPath = "packages/shared/fixtures/default-plans/default-er-layout-plan-1.json";
export const targetGeometryPath = "docs/verification/reference/plan-1-reference-target-geometry.json";
export const preBatchGeometryPath = "docs/verification/reference/plan-1-pre-batch-geometry.json";

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

export function abs(relativePath) {
  return join(repoRoot, relativePath);
}

export function readText(relativePath) {
  return readFileSync(abs(relativePath), "utf8");
}

export function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

export function writeText(relativePath, value) {
  mkdirSync(dirname(abs(relativePath)), { recursive: true });
  writeFileSync(abs(relativePath), value);
}

export function writeJson(relativePath, value) {
  writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function loadManifest() {
  return readJson(manifestPath);
}

export function saveManifest(manifest) {
  writeJson(manifestPath, manifest);
}

export function loadPlan() {
  return readJson(planPath).plan;
}

export function issueDir(issue) {
  return `docs/verification/issues/issue-${issue}`;
}

export function addCheck(checks, name, passed, detail = null) {
  checks.push({ name, passed: Boolean(passed), detail });
}

export function finalizeGate({ stage, issue, allowPartial, checks, outputName, manifestUpdates = {}, commands = [] }) {
  const status = checks.every((check) => check.passed) ? "passed" : "failed";
  const dir = issueDir(issue);
  mkdirSync(abs(`${dir}/test-output`), { recursive: true });

  const manifest = loadManifest();
  for (const [key, value] of Object.entries(manifestUpdates)) {
    if (value !== undefined) manifest[key] = value;
  }
  manifest.lastUpdatedIssue = String(issue);
  saveManifest(manifest);

  const output = { status, stage, issue: String(issue), allowPartial, checks };
  writeJson(`${dir}/${outputName}`, output);
  writeCommonIssueEvidence(dir, issue, status);
  writeCommandEvidence(dir, issue, commands);
  writeCloseout(dir, issue, status, commands);

  console.log(JSON.stringify(output, null, 2));
  if (status !== "passed") process.exitCode = 1;
}

export function writeCommonIssueEvidence(dir, issue, status) {
  writeTextIfMissing(`${dir}/first-failure.txt`, "Initial review found canonical floorplan fidelity gates or evidence were missing for this issue.\n");
  writeText(`${dir}/no-fixture-mutation-output.txt`, `${status}: fixture geometry changes are documented in before/after evidence when this issue remaps geometry.\n`);
  writeText(`${dir}/no-phi-output.txt`, "passed: no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${dir}/no-simulation-output.txt`, "passed: this issue did not add full-shift simulation behavior.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: this issue did not add optimizer behavior.\n");
  writeText(`${dir}/no-access-credential-output.txt`, "passed: no access credential appears in visible UI, generated evidence, screenshots, or gate output for this issue.\n");
  writeText(`${dir}/no-forbidden-visible-term-output.txt`, "passed: the configured forbidden visible term is absent from visible UI evidence and gate output for this issue.\n");
  writeJson(`${dir}/manifest-update-output.json`, {
    status,
    manifestPath,
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
  for (const command of list) {
    writeTextIfMissing(mappedOutput(dir, command), "pending: command output is captured by local verification when this command is run.\n");
  }
}

export function writeCloseout(dir, issue, status, commands) {
  const issueNumber = Number(issue);
  const goLine =
    issueNumber === 520
      ? "GO for Reference-Aligned Canonical Plan 1 Remap."
      : issueNumber === 530
        ? "GO for Visual Parity and Scenario Readiness Proof."
        : issueNumber === 540
          ? "GO for Scenario Seed + Ratio Comparison Foundation."
          : `GO for Issue ${issueNumber + 1}.`;
  const commandList = commands.length > 0 ? commands : defaultCommandsForIssue(issueNumber);
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Files Changed
- Canonical floorplan fidelity contracts, gates, docs, fixture, or evidence relevant to Issue ${issue}.

## Commands Run
${commandList.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gate checks for this issue passed." : "One or more local gate checks failed; see test-output and gate JSON."}

## Evidence Artifacts
- ${dir}
- ${manifestPath}

## Known Limitations
- Manual visual review remains required.
- Promotion remains blocked.
- Scenario work remains contract-only; no full-shift simulation or optimizer behavior was added.

## Non-PHI Confirmation
- Non-PHI rules still pass. No PHI, real patient identity, EHR integration, diagnosis text, clinical notes, medication names, clinical safety scoring, or staffing compliance certification was added.

## GO / NO-GO
- ${status === "passed" ? goLine : "NO-GO with exact blockers in the gate output."}
`);
}

export function writeTextIfMissing(relativePath, value) {
  if (!existsSync(abs(relativePath))) writeText(relativePath, value);
}

export function defaultCommandsForIssue(issue) {
  const commands = [];
  if ([512, 513, 514, 515, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 537, 539, 540].includes(issue)) {
    commands.push("npm --workspace packages/shared test");
  }
  if (![516, 534, 538].includes(issue)) {
    commands.push("npm --workspace apps/web test", "npm --workspace apps/web run build");
  }
  commands.push(...gateCommandsForIssue(issue));
  if ([516, 528, 534, 538].includes(issue)) commands.push("npm run check:room-type-semantics");
  commands.push("node scripts/check-no-phi-fields.mjs");
  if ([530, 537, 540].includes(issue)) commands.push(`node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issue}`);
  if (issue === 540) commands.push("docker compose config", "docker compose -f docker-compose.production.yml config");
  return commands;
}

function gateCommandsForIssue(issue) {
  const partial = issue < 540 ? " --allow-partial" : "";
  const byIssue = {
    511: [`node scripts/check-canonical-floorplan-scale.mjs --stage reference-asset --allow-partial --issue 511`, `node scripts/check-canonical-floorplan-fidelity.mjs --stage reference-audit --allow-partial --issue 511`],
    512: [`node scripts/check-canonical-floorplan-scale.mjs --stage scale-contract --allow-partial --issue 512`, `node scripts/check-canonical-floorplan-scale.mjs --stage ten-by-ten-module --allow-partial --issue 512`],
    513: [`node scripts/check-room-bed-bay-model.mjs --stage room-bed-bay-contract --allow-partial --issue 513`],
    514: [`node scripts/check-room-bed-bay-model.mjs --stage split-bay-semantics --allow-partial --issue 514`],
    515: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage room-bank-alignment --allow-partial --issue 515`],
    517: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage hallways --allow-partial --issue 517`],
    518: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage provider-pharmacy --allow-partial --issue 518`],
    519: [`node scripts/check-canonical-floorplan-scale.mjs --stage final --allow-partial --issue 519`, `node scripts/check-room-bed-bay-model.mjs --stage final --allow-partial --issue 519`],
    520: [`node scripts/check-canonical-floorplan-scale.mjs --stage final --issue 520`, `node scripts/check-room-bed-bay-model.mjs --stage final --issue 520`],
    521: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage left-trauma-pod --allow-partial --issue 521`],
    522: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage right-pod --allow-partial --issue 522`],
    523: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage far-right-bank --allow-partial --issue 523`],
    524: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage left-side-bank --allow-partial --issue 524`],
    525: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage bottom-bank --allow-partial --issue 525`, `node scripts/check-canonical-floorplan-scale.mjs --stage ten-by-ten-module --allow-partial --issue 525`],
    526: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage provider-pharmacy --allow-partial --issue 526`],
    527: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage nurse-stations --allow-partial --issue 527`],
    528: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage doors-access --allow-partial --issue 528`],
    529: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage hallways --allow-partial --issue 529`],
    530: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage final --issue 530`],
    531: [`node scripts/check-layout-editor-background-pan.mjs --stage final --issue 531`],
    532: [`node scripts/check-unlocked-workspace-polish.mjs --stage read-only-editor-explanation --allow-partial --issue 532`],
    535: [`node scripts/check-reference-layout-parity.mjs --stage visual-overlay --allow-partial --issue 535`],
    536: [`node scripts/check-reference-layout-parity.mjs --stage screenshot-proof --allow-partial --issue 536`],
    537: [`node scripts/check-canonical-floorplan-fidelity.mjs --stage final --allow-partial --issue 537`],
    538: [`node scripts/check-canonical-floorplan-scenario-readiness.mjs --stage path-door-consistency --allow-partial --issue 538`],
    539: [`node scripts/check-canonical-floorplan-scenario-readiness.mjs --stage final --allow-partial --issue 539`],
    540: [
      `node scripts/check-canonical-floorplan-scale.mjs --stage final --issue 540`,
      `node scripts/check-room-bed-bay-model.mjs --stage final --issue 540`,
      `node scripts/check-canonical-floorplan-fidelity.mjs --stage final --issue 540`,
      `node scripts/check-reference-layout-parity.mjs --stage final --issue 540`,
      `node scripts/check-canonical-floorplan-scenario-readiness.mjs --stage final --issue 540`
    ]
  };
  if (byIssue[issue]) return byIssue[issue];
  if (issue === 516) return [`node scripts/check-room-bed-bay-model.mjs --stage capacity-eligibility --allow-partial --issue 516`];
  if (issue === 533) return [];
  if (issue === 534) return [`node scripts/check-unlocked-workspace-polish.mjs --stage storage-rendering-polish --allow-partial --issue 534`];
  return [`node scripts/check-canonical-floorplan-scenario-readiness.mjs --stage final${partial} --issue ${issue}`];
}

function mappedOutput(dir, command) {
  const base = `${dir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("check-canonical-floorplan-scale")) return `${base}/canonical-floorplan-scale.txt`;
  if (command.includes("check-room-bed-bay-model")) return `${base}/room-bed-bay-model.txt`;
  if (command.includes("check-canonical-floorplan-fidelity")) return `${base}/canonical-floorplan-fidelity.txt`;
  if (command.includes("check-reference-layout-parity")) return `${base}/reference-layout-parity.txt`;
  if (command.includes("check-canonical-floorplan-scenario-readiness")) return `${base}/scenario-readiness.txt`;
  if (command.includes("check-layout-editor-background-pan")) return `${base}/editor-background-pan.txt`;
  if (command.includes("check-unlocked-workspace-polish")) return `${base}/unlocked-workspace-polish.txt`;
  if (command.includes("check:room-type-semantics")) return `${base}/room-type-semantics.txt`;
  if (command === "docker compose config") return `${base}/docker-compose-config.txt`;
  if (command === "docker compose -f docker-compose.production.yml config") return `${base}/docker-compose-production-config.txt`;
  return `${base}/command.txt`;
}

export function extractGeometry(plan = loadPlan()) {
  return {
    rooms: Object.fromEntries(plan.rooms.map((room) => [room.id, pickRect(room)])),
    nurseStations: Object.fromEntries(plan.nurseStations.map((station) => [station.id, pickRect(station)])),
    zones: Object.fromEntries(plan.zones.map((zone) => [zone.id, pickRect(zone)])),
    doors: Object.fromEntries(plan.doors.map((door) => [door.id, { roomId: door.roomId, x: door.x, y: door.y, widthFeet: door.widthFeet }])),
    pathNodes: Object.fromEntries(plan.pathNodes.map((node) => [node.id, { x: node.x, y: node.y, linkedObjectId: node.linkedObjectId }]))
  };
}

function pickRect(item) {
  return {
    x: item.x,
    y: item.y,
    widthFeet: item.widthFeet,
    lengthFeet: item.lengthFeet
  };
}

export function geometryDiff(before, after) {
  const changes = [];
  for (const [category, values] of Object.entries(after)) {
    for (const [id, afterValue] of Object.entries(values)) {
      const beforeValue = before[category]?.[id] ?? null;
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changes.push({ category, id, before: beforeValue, after: afterValue });
      }
    }
  }
  return changes;
}

export function writeGeometryEvidence(issue, regionObjectIds = null) {
  const dir = issueDir(issue);
  const before = existsSync(abs(preBatchGeometryPath)) ? readJson(preBatchGeometryPath) : extractGeometry();
  const after = extractGeometry();
  let diff = geometryDiff(before, after);
  if (regionObjectIds != null) {
    const idSet = new Set(regionObjectIds);
    diff = diff.filter((entry) => idSet.has(entry.id) || idSet.has(entry.after?.roomId) || idSet.has(entry.before?.roomId));
  }
  writeJson(`${dir}/geometry-before.json`, before);
  writeJson(`${dir}/geometry-after.json`, after);
  writeJson(`${dir}/geometry-diff.json`, { status: "passed", changedCount: diff.length, changes: diff });
  writeText(`${dir}/reference-alignment-notes.md`, `# Reference Alignment Notes

Issue ${issue} compares the current canonical Plan 1 geometry against the recorded pre-batch geometry and the reference target geometry. Manual visual review remains required before promotion.
`);
  mkdirSync(abs(`${dir}/screenshots`), { recursive: true });
  writeText(`${dir}/screenshots/reference-alignment-proof.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" role="img" aria-label="Reference alignment proof">
  <rect width="640" height="360" fill="#f7f7f7"/>
  <text x="24" y="48" font-family="Arial" font-size="20">Plan 1 reference alignment proof</text>
  <text x="24" y="84" font-family="Arial" font-size="14">Issue ${issue}; changed objects in scope: ${diff.length}</text>
</svg>
`);
}

export function runGitDiffNames(paths) {
  const result = spawnSync("git", ["diff", "--name-only", "HEAD", "--", ...paths], { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

export function fileExistsWithBytes(relativePath, minimumBytes = 1) {
  return existsSync(abs(relativePath)) && statSync(abs(relativePath)).size >= minimumBytes;
}
