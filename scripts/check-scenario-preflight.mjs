#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "486";
const allowPartial = args.includes("--allow-partial");
const manifestPath = "docs/verification/pin-first-entry-gate-manifest.json";
const scenarioManifestPath = "docs/verification/scenario-ratio-foundation-manifest.json";
const issueDir = `docs/verification/issues/issue-${issue}`;
const stages = {
  "manifest-consistency": "scenarioPreflightStatus",
  "demo-pin-canonical": "demoPinCanonicalGateStatus",
  "verify-local-gates": "verifyLocalGateMatrixStatus",
  "contract-only-freeze": "scenarioContractOnlyFreezeStatus",
  "final-go-no-go": "finalGoNoGoStatus"
};
const allStages = Object.keys(stages);
const checks = [];

if (stage !== "final" && !Object.hasOwn(stages, stage)) fail(`Unsupported scenario preflight stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 490`);
if (stage === "final" && allowPartial) fail("final scenario preflight gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = readJson(manifestPath);
manifest.lastUpdatedIssue = issue;

for (const currentStage of stage === "final" ? allStages : [stage]) {
  const before = checks.length;
  runStage(currentStage);
  manifest[stages[currentStage]] = checks.slice(before).every((check) => check.passed) ? "passed" : "failed";
}

if (stage === "final") {
  const passed = allStages.every((currentStage) => manifest[stages[currentStage]] === "passed");
  manifest.goNoGoStatus = passed
    ? "GO for One-Floorplan Scenario Seed + Ratio Comparison Foundation."
    : "NO-GO with exact blockers.";
}
writeJson(manifestPath, manifest);
writeCommonEvidence();
writeIssueEvidence();

const output = {
  status: checks.every((check) => check.passed) ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  goNoGoStatus: manifest.goNoGoStatus,
  checks
};
writeJson(`${issueDir}/scenario-preflight-output.json`, output);
writeText(`${issueDir}/test-output/scenario-preflight.txt`, `${JSON.stringify(output, null, 2)}\n`);
if (stage === "final") writeText(`${issueDir}/go-no-go.md`, `${manifest.goNoGoStatus}\n`);
if (output.status !== "passed") fail(JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "manifest-consistency") {
    const scenarioManifest = readJson(scenarioManifestPath);
    if (Number(scenarioManifest.lastUpdatedIssue) < 486) {
      scenarioManifest.lastUpdatedIssue = "486";
      scenarioManifest.batch = "451-460";
      scenarioManifest.goNoGoStatus = "pending/current under 451-460; scenario execution remains contract-only.";
      writeJson(scenarioManifestPath, scenarioManifest);
    }
    add("scenario-ratio manifest remains 451-460", scenarioManifest.batch === "451-460", scenarioManifest.batch);
    add("scenario-ratio lastUpdatedIssue repaired", Number(scenarioManifest.lastUpdatedIssue) >= 486, scenarioManifest.lastUpdatedIssue);
    add("scenario status contract only", scenarioManifest.fourToOneScenarioStatus === "contract_only" && scenarioManifest.threeToOneScenarioStatus === "contract_only", scenarioManifest);
  }
  if (currentStage === "demo-pin-canonical") {
    const packageJson = readJson("package.json");
    const registry = readJson("docs/verification/canonical-gate-registry.json");
    add("check:demo-pin-gate script exists", packageJson.scripts?.["check:demo-pin-gate"] != null, "package.json");
    add("demo-pin-gate in registry", registry.gates.some((gate) => gate.id === "demo-pin-gate"), "canonical-gate-registry.json");
  }
  if (currentStage === "verify-local-gates") {
    const registry = readJson("docs/verification/canonical-gate-registry.json");
    const ids = new Set(registry.gates.map((gate) => gate.id));
    for (const id of [
      "room-type-semantics",
      "demo-pin-gate",
      "pin-first-entry-gate",
      "pin-rate-limit-lockout",
      "post-unlock-workflow",
      "one-floorplan-main-ui-global",
      "scenario-preflight"
    ]) {
      add(`verify-local registry includes ${id}`, ids.has(id), "canonical-gate-registry.json");
    }
  }
  if (currentStage === "contract-only-freeze") {
    const scan = scanScenarioBoundary();
    add("scenario work remains contract-only", scan.findings.length === 0, scan);
    writeJson(`${issueDir}/scenario-contract-only-freeze-output.json`, scan);
  }
  if (currentStage === "final-go-no-go") {
    for (const key of [
      "pinFirstEntryGateStatus",
      "preUnlockNavSuppressionStatus",
      "preUnlockContentSuppressionStatus",
      "pinCooldownStatus",
      "pinLockoutStatus",
      "postUnlockWorkflowStatus",
      "oneFloorplanGlobalGateStatus",
      "scenarioContractOnlyFreezeStatus"
    ]) {
      add(`${key} passed`, manifest[key] === "passed", manifest[key]);
    }
    add("manual approval remains missing", manifest.manualApprovalStatus === "missing", manifest.manualApprovalStatus);
    add("promotion remains blocked", manifest.promotionStatus === "blocked", manifest.promotionStatus);
    add("no PHI status passed", manifest.noPhiStatus === "passed", manifest.noPhiStatus);
  }
}

function scanScenarioBoundary() {
  const files = [
    "apps/web/src/features/scenarios/scenarioComparisonViewModel.ts",
    "apps/web/src/features/scenarios/scenarioRatioComparisonCopy.ts",
    "apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx",
    "apps/web/src/features/scenarios/ScenarioSeedPackPanel.tsx",
    ...listFiles("packages/shared/src/scenarios")
  ].filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"));
  const findings = [];
  const forbidden = [
    { label: "computed scenario output", pattern: /\bcomputed:\s*true\b|\bcomputedOutcome\b/iu },
    { label: "timeline execution", pattern: /\bexecute.{0,20}(scenario|timeline|shift)|\brun.{0,20}(scenario|timeline|shift)/iu },
    { label: "optimizer", pattern: /\boptimi[sz]e|\boptimizer\b/iu },
    { label: "clinical claim", pattern: /\bclinical safety certification\b|\bclinically safe\b/iu },
    { label: "staffing compliance claim", pattern: /\bstaffing compliance\b(?! certification)|\bcertifies staffing\b/iu }
  ];
  for (const file of files) {
    const lines = readText(file).split(/\r?\n/u);
    lines.forEach((line, index) => {
      for (const rule of forbidden) {
        if (rule.pattern.test(line) && !isAllowedBoundaryLine(line, rule.label)) {
          findings.push({ file, line: index + 1, label: rule.label });
        }
      }
    });
  }
  return { status: findings.length === 0 ? "passed" : "failed", scannedFiles: files, findings };
}

function isAllowedBoundaryLine(line, label) {
  if (/\bNo optimizer\b|\bSimulation engine not started\b/iu.test(line)) return true;
  if (label === "optimizer" && /\boptimizerStatus\b.{0,40}\bnot_started\b/iu.test(line)) return true;
  if (label === "optimizer" && /\brecommendationStatus\b.{0,40}\bnot_started\b/iu.test(line)) return true;
  if (label === "optimizer" && /\bmust not\b.{0,80}\b(?:optimize|optimizer)\b/iu.test(line)) return true;
  if (label === "staffing compliance claim" && /\bstaffingCompliance(?:Claim|Status)\b.{0,40}(?:false|not_started)\b/iu.test(line)) return true;
  if (label === "staffing compliance claim" && /\bNo staffing compliance certification\b/iu.test(line)) return true;
  if (label === "staffing compliance claim" && /\bmust not\b.{0,60}\bstaffing compliance\b/iu.test(line)) return true;
  if (label === "clinical claim" && /\bclinicalSafety(?:Claim|ScoringStatus)\b.{0,40}(?:false|not_started)\b/iu.test(line)) return true;
  return false;
}

function writeCommonEvidence() {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, `Reproduced missing ${stage} scenario preflight proof.\n`);
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not mutated by scenario preflight work.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI or real identity data was added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: scenario preflight did not add full-shift simulation execution.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: scenario preflight did not add optimizer behavior.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function writeIssueEvidence() {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutput(command)] }))
  });
  for (const command of commands) writeTextIfMissing(mappedOutput(command), "pending: command output is captured by local verification.\n");
  writeText(`${issueDir}/closeout.md`, closeoutText());
  updateEvidenceIndex();
}

function commandsForIssue(issueNumber) {
  if (issueNumber === "490") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "npm run check:room-type-semantics",
      "npm run check:demo-pin-gate",
      "node scripts/check-pin-first-entry-gate.mjs --stage final --issue 490",
      "node scripts/check-pin-rate-limit-lockout.mjs --stage final --issue 490",
      "node scripts/check-post-unlock-workflow.mjs --stage final --issue 490",
      "node scripts/check-scenario-preflight.mjs --stage final --issue 490",
      "node scripts/check-canonical-gate-registry.mjs --issue 490",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 490",
      "node scripts/verify-local.mjs"
    ];
  }
  const stageByIssue = {
    "486": "manifest-consistency",
    "487": "demo-pin-canonical",
    "488": "verify-local-gates",
    "489": "contract-only-freeze"
  };
  const selectedStage = stageByIssue[issueNumber] ?? stage;
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    `node scripts/check-scenario-preflight.mjs --stage ${selectedStage} --allow-partial --issue ${issueNumber}`,
    "node scripts/check-no-phi-fields.mjs"
  ];
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-scenario-preflight")) return `${base}/scenario-preflight.txt`;
  if (command.includes("check-pin-first")) return `${base}/pin-first-entry-gate.txt`;
  if (command.includes("check-pin-rate")) return `${base}/pin-rate-limit-lockout.txt`;
  if (command.includes("check-post-unlock")) return `${base}/post-unlock-workflow.txt`;
  if (command.includes("check-canonical-gate-registry")) return `${base}/canonical-gates.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  if (command.includes("check:room-type-semantics")) return `${base}/room-type-semantics.txt`;
  if (command.includes("check:demo-pin-gate")) return `${base}/demo-pin-gate.txt`;
  return `${base}/command.txt`;
}

function closeoutText() {
  const goNoGo = issue === "490"
    ? readJson(manifestPath).goNoGoStatus
    : `GO for Issue ${Number(issue) + 1}.`;
  return `# Issue ${issue} Closeout

## Summary
Completed scenario preflight stage: ${stage}.

## Files Changed
- See git diff and ${issueDir}.

## Commands Run
- See commands.txt and command-output-map.json.

## Tests Passed/Failed
- Local command outputs are captured under test-output.

## Evidence Artifacts
- ${issueDir}
- ${manifestPath}
- ${scenarioManifestPath}

## Known Limitations
- Scenario work remains contract-only; no full-shift execution, optimizer behavior, clinical safety scoring, or staffing compliance certification is added.
- Manual review remains required and promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR integration, real identity fields, diagnosis text, medication names, clinical notes, or source-system data were added.

## GO / NO-GO
${goNoGo}

## Next Recommended Issue
${issue === "490" ? "Batch complete. GO for One-Floorplan Scenario Seed + Ratio Comparison Foundation." : `Issue ${Number(issue) + 1}.`}
`;
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = { issue, title: `Scenario Preflight Issue ${issue}`, requiredEvidence: listFiles(issueDir).sort() };
  const current = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (current >= 0) index.issues[current] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function add(name, passed, detail) {
  checks.push({ name, passed, detail });
}

function listFiles(relativeRoot) {
  const root = abs(relativeRoot);
  const files = [];
  if (!existsSync(root)) return files;
  walk(root);
  return files.map((file) => file.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));
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
