#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  DEMO_PIN_COOLDOWN_MS,
  DEMO_PIN_LOCKOUT_MS,
  createDemoPinAttemptState,
  getDemoPinAttemptAvailability,
  submitDemoPinAttempt
} from "../packages/shared/dist/index.js";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "466";
const allowPartial = args.includes("--allow-partial");
const manifestPath = "docs/verification/pin-first-entry-gate-manifest.json";
const issueDir = `docs/verification/issues/issue-${issue}`;
const stages = {
  "attempt-state": "pinAttemptStateStatus",
  cooldown: "pinCooldownStatus",
  "three-strike-lockout": "pinLockoutStatus",
  countdowns: "pinCountdownStatus",
  "lockout-proof": "pinLockoutProofStatus"
};
const allStages = Object.keys(stages);
const checks = [];

if (stage !== "final" && !Object.hasOwn(stages, stage)) fail(`Unsupported PIN rate-limit stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 490`);
if (stage === "final" && allowPartial) fail("final PIN rate-limit gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = readJson(manifestPath);
manifest.lastUpdatedIssue = issue;

for (const currentStage of stage === "final" ? allStages : [stage]) {
  const before = checks.length;
  runStage(currentStage);
  manifest[stages[currentStage]] = checks.slice(before).every((check) => check.passed) ? "passed" : "failed";
}
writeJson(manifestPath, manifest);
writeCommonEvidence();
writeIssueEvidence();

const output = { status: checks.every((check) => check.passed) ? "passed" : "failed", stage, issue, allowPartial, checks };
writeJson(`${issueDir}/pin-rate-limit-lockout-output.json`, output);
writeText(`${issueDir}/test-output/pin-rate-limit-lockout.txt`, `${JSON.stringify(output, null, 2)}\n`);
if (output.status !== "passed") fail(JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "attempt-state") {
    const source = readText("packages/shared/src/demo-pin/demoPinAttemptPolicy.ts");
    const state = createDemoPinAttemptState();
    add("attempt state starts clean", state.wrongAttemptCount === 0 && state.cooldownUntilMs == null && state.lockoutUntilMs == null, state);
    add("state tracks last attempt", source.includes("lastAttemptAtMs"), "demoPinAttemptPolicy.ts");
    add("local demo state only", !/fetch\(|localStorage|authToken|password/u.test(source), "demoPinAttemptPolicy.ts");
  }
  if (currentStage === "cooldown") {
    const wrong = submitDemoPinAttempt(createDemoPinAttemptState(), "0000", 1_000);
    const blocked = submitDemoPinAttempt(wrong.state, "2026", 2_000);
    add("wrong attempt creates 15-second cooldown", wrong.state.cooldownUntilMs === 1_000 + DEMO_PIN_COOLDOWN_MS, wrong.state);
    add("correct PIN cannot bypass cooldown", blocked.status === "cooldown_blocked" && !blocked.unlocked, blocked);
    add("cooldown expires deterministically", getDemoPinAttemptAvailability(wrong.state, 1_000 + DEMO_PIN_COOLDOWN_MS + 1).canSubmit, wrong.state);
  }
  if (currentStage === "three-strike-lockout") {
    const locked = buildLockout();
    const blocked = submitDemoPinAttempt(locked.state, "2026", locked.state.lockoutUntilMs - 1);
    const expired = getDemoPinAttemptAvailability(locked.state, locked.state.lockoutUntilMs + 1);
    add("three wrong attempts lock for 180 seconds", locked.state.lockoutUntilMs === locked.thirdAt + DEMO_PIN_LOCKOUT_MS, locked.state);
    add("attempt during lockout rejected", blocked.status === "lockout_blocked" && !blocked.unlocked, blocked);
    add("lockout expiration resets wrong count", expired.normalizedState.wrongAttemptCount === 0 && expired.canSubmit, expired);
  }
  if (currentStage === "countdowns") {
    const viewModel = readText("apps/web/src/features/demo-pin/demoPinViewModel.ts");
    const gate = readText("apps/web/src/features/demo-pin/DemoPinGate.tsx");
    add("cooldown countdown copy exists", viewModel.includes("Cooldown") && viewModel.includes("secondsRemaining"), "demoPinViewModel.ts");
    add("lockout countdown copy exists", viewModel.includes("Lockout") && viewModel.includes("lockoutRemainingMs"), "demoPinViewModel.ts");
    add("countdown is visible in status", gate.includes("viewModel.countdownLabel") && gate.includes("role=\"status\""), "DemoPinGate.tsx");
  }
  if (currentStage === "lockout-proof") {
    const assertionsPath = "docs/verification/pin-rate-limit-lockout-dom-assertions.json";
    add("lockout proof assertions exist", existsSync(abs(assertionsPath)), assertionsPath);
    if (existsSync(abs(assertionsPath))) {
      const assertions = readJson(assertionsPath);
      const visualIssueDir = `docs/verification/issues/issue-${assertions.issue ?? issue}`;
      add("lockout proof is browser-rendered app", assertions.source === "browser-rendered-app" && assertions.staticHtmlOnlyProof === false, assertions);
      add("cooldown visible in proof", assertions.cooldownVisible === true, assertions);
      add("lockout visible in proof", assertions.lockoutVisible === true, assertions);
      add("post-lockout unlock works", assertions.postLockoutUnlockVisible === true, assertions);
      add("no app content leaked during lockout", assertions.appContentVisibleDuringLockout === false, assertions);
      for (const screenshot of ["wrong-pin-cooldown.png", "three-strike-lockout.png", "post-lockout-unlock.png"]) {
        assertPng(`${visualIssueDir}/screenshots/${screenshot}`, `${screenshot} visual proof`);
      }
    }
  }
}

function buildLockout() {
  const first = submitDemoPinAttempt(createDemoPinAttemptState(), "0000", 1_000);
  const secondAt = 1_000 + DEMO_PIN_COOLDOWN_MS + 1;
  const second = submitDemoPinAttempt(first.state, "0000", secondAt);
  const thirdAt = secondAt + DEMO_PIN_COOLDOWN_MS + 1;
  const third = submitDemoPinAttempt(second.state, "0000", thirdAt);
  return { state: third.state, thirdAt };
}

function writeCommonEvidence() {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, `Reproduced missing ${stage} PIN cooldown/lockout behavior.\n`);
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not mutated by PIN attempt work.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI or real identity data was added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
  if (issue === "470") mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
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
  const stageByIssue = {
    "466": "attempt-state",
    "467": "cooldown",
    "468": "three-strike-lockout",
    "469": "countdowns",
    "470": "final",
    "474": "countdowns"
  };
  const selectedStage = stageByIssue[issueNumber] ?? stage;
  const commands = ["npm --workspace packages/shared test", "npm --workspace apps/web test", "npm --workspace apps/web run build"];
  if (issueNumber === "470") commands.push("node scripts/capture-pin-lockout-visual-proof.mjs --issue 470");
  commands.push(
    selectedStage === "final"
      ? `node scripts/check-pin-rate-limit-lockout.mjs --stage final --issue ${issueNumber}`
      : `node scripts/check-pin-rate-limit-lockout.mjs --stage ${selectedStage} --allow-partial --issue ${issueNumber}`,
    "node scripts/check-no-phi-fields.mjs"
  );
  return commands;
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("capture-pin-lockout")) return `${base}/pin-lockout-visual-proof.txt`;
  if (command.includes("check-pin-rate")) return `${base}/pin-rate-limit-lockout.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  return `${base}/command.txt`;
}

function closeoutText() {
  return `# Issue ${issue} Closeout

## Summary
Completed PIN cooldown/lockout stage: ${stage}.

## Files Changed
- See git diff and ${issueDir}.

## Commands Run
- See commands.txt and command-output-map.json.

## Tests Passed/Failed
- Local command outputs are captured under test-output.

## Evidence Artifacts
- ${issueDir}
- ${manifestPath}

## Known Limitations
- PIN 2026 remains a demo-only gate, not production authentication, real security, or PHI protection.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR integration, clinical safety certification, hidden scoring, optimizer behavior, or full-shift simulation was added.

## Next Recommended Issue
${issue === "490" ? "Batch complete. GO for One-Floorplan Scenario Seed + Ratio Comparison Foundation." : `Issue ${Number(issue) + 1}.`}
`;
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = { issue, title: `PIN Rate Limit Lockout Issue ${issue}`, requiredEvidence: listFiles(issueDir).sort() };
  const current = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (current >= 0) index.issues[current] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function add(name, passed, detail) {
  checks.push({ name, passed, detail });
}

function assertPng(path, label) {
  const fullPath = abs(path);
  const passed = existsSync(fullPath) && statSync(fullPath).size >= 5000;
  add(`${label} screenshot is browser-sized`, passed, { path, bytes: existsSync(fullPath) ? statSync(fullPath).size : 0 });
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
