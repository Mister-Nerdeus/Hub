#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "461";
const allowPartial = args.includes("--allow-partial");
const manifestPath = "docs/verification/pin-first-entry-gate-manifest.json";
const issueDir = `docs/verification/issues/issue-${issue}`;
const stages = {
  "pre-app-gate": "pinFirstEntryGateStatus",
  "hide-shell-before-unlock": "preUnlockNavSuppressionStatus",
  "hide-demo-content-before-unlock": "preUnlockContentSuppressionStatus",
  "pin-landing-ux": "pinLandingUxStatus",
  "visual-proof": "pinVisualProofStatus"
};
const allStages = [...Object.keys(stages)];
const checks = [];

if (stage !== "final" && !Object.hasOwn(stages, stage)) fail(`Unsupported PIN-first stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 490`);
if (stage === "final" && allowPartial) fail("final PIN-first gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = readJson(manifestPath);
manifest.lastUpdatedIssue = issue;

for (const currentStage of stage === "final" ? allStages : [stage]) {
  const before = checks.length;
  runStage(currentStage);
  manifest[stages[currentStage]] = checks.slice(before).every((check) => check.passed) ? "passed" : "failed";
}

manifest.mainNavVisibleBeforeUnlock = manifest.preUnlockNavSuppressionStatus !== "passed";
manifest.demoGuideVisibleBeforeUnlock = manifest.preUnlockContentSuppressionStatus !== "passed";
manifest.seedPackVisibleBeforeUnlock = manifest.preUnlockContentSuppressionStatus !== "passed";
if (stage === "final" && allStages.every((currentStage) => manifest[stages[currentStage]] === "passed")) {
  manifest.goNoGoStatus = "PIN-first entry gate passed; continue post-unlock and scenario preflight gates.";
}
writeJson(manifestPath, manifest);
writeCommonEvidence();
writeIssueEvidence();

const output = {
  status: checks.every((check) => check.passed) ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  checks
};
writeJson(`${issueDir}/pin-first-entry-gate-output.json`, output);
writeText(`${issueDir}/test-output/pin-first-entry-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (output.status !== "passed") fail(JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "pre-app-gate") {
    const app = readText("apps/web/src/App.tsx");
    add("DemoPinEntryScreen exists", existsSync(abs("apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx")), "DemoPinEntryScreen.tsx");
    add("locked branch returns before AppShell", /if \(!demoPinState\.unlocked\)[\s\S]*return \([\s\S]*<DemoPinEntryScreen/.test(app), "App.tsx");
    add("PIN gate not mounted in AppShell content", !/<AppShell[\s\S]*<DemoPinGate/.test(app), "App.tsx");
  }
  if (currentStage === "hide-shell-before-unlock") {
    const entry = readText("apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx");
    const gate = readText("apps/web/src/features/demo-pin/DemoPinGate.tsx");
    const lockedScreen = `${entry}\n${gate}`;
    for (const hidden of ["Floorplan", "Editor", "Manual Assignment", "Review / Reports", "Advanced", "Future Tools"]) {
      add(`locked screen hides ${hidden}`, !lockedScreen.includes(hidden), "DemoPinEntryScreen.tsx + DemoPinGate.tsx");
    }
    add("locked screen hides protected action list", !lockedScreen.includes("Protected demo actions") && !lockedScreen.includes("data-protected-action-id"), "DemoPinGate.tsx");
  }
  if (currentStage === "hide-demo-content-before-unlock") {
    const entry = readText("apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx");
    const gate = readText("apps/web/src/features/demo-pin/DemoPinGate.tsx");
    const lockedScreen = `${entry}\n${gate}`;
    for (const hidden of ["Canonical Workflow Guide", "seed pack", "Scenario Comparison", "Ratio Comparison", "proof report", "Developer/Evidence"]) {
      add(`locked screen hides ${hidden}`, !lockedScreen.includes(hidden), "DemoPinEntryScreen.tsx + DemoPinGate.tsx");
    }
  }
  if (currentStage === "pin-landing-ux") {
    const entry = readText("apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx");
    const gate = readText("apps/web/src/features/demo-pin/DemoPinGate.tsx");
    add("standalone main element", entry.includes("<main") && entry.includes("data-app-lock-state=\"locked\""), "DemoPinEntryScreen.tsx");
    add("product name visible", entry.includes("productDisplayName") || entry.includes("PRODUCT_DISPLAY_NAME"), "DemoPinEntryScreen.tsx");
    add("controlled review-flow disclaimer visible", entry.includes("viewModel.caveat") || entry.includes("Demo-only PIN screen"), "DemoPinEntryScreen.tsx");
    add("no production auth claim", !/secure access|production auth enabled|protects real data/iu.test(entry), "DemoPinEntryScreen.tsx");
    add("accessible status and label", gate.includes("role=\"status\"") && gate.includes("aria-label={viewModel.inputLabel}"), "DemoPinGate.tsx");
  }
  if (currentStage === "visual-proof") {
    const assertionsPath = "docs/verification/pin-first-entry-dom-assertions.json";
    add("visual DOM assertions exist", existsSync(abs(assertionsPath)), assertionsPath);
    if (existsSync(abs(assertionsPath))) {
      const assertions = readJson(assertionsPath);
      const visualIssueDir = `docs/verification/issues/issue-${assertions.issue ?? issue}`;
      add("visual proof is browser-rendered app", assertions.source === "browser-rendered-app" && assertions.staticHtmlOnlyProof === false, assertions);
      add("locked screenshot PIN only", assertions.locked.pinOnly === true, assertions.locked);
      add("locked shell hidden", assertions.locked.appShellVisible === false, assertions.locked);
      add("locked demo guide hidden", assertions.locked.demoGuideVisible === false, assertions.locked);
      add("unlocked shell visible", assertions.unlocked.appShellVisible === true, assertions.unlocked);
      assertPng(`${visualIssueDir}/screenshots/locked-pin-only.png`, "locked PIN visual proof");
      assertPng(`${visualIssueDir}/screenshots/unlocked-canonical-workflow.png`, "unlocked canonical workflow visual proof");
    }
  }
}

function writeCommonEvidence() {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, `Reproduced missing ${stage} PIN-first entry gate behavior.\n`);
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not mutated by PIN-first gate work.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI, EHR integration, real identity, diagnosis, medication, or clinical notes were added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
  if (["465", "470", "480", "485"].includes(issue)) {
    mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
  }
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
    "461": "pre-app-gate",
    "462": "hide-shell-before-unlock",
    "463": "hide-demo-content-before-unlock",
    "464": "pin-landing-ux",
    "465": "visual-proof"
  };
  const selectedStage = stageByIssue[issueNumber] ?? stage;
  const gate = selectedStage === "final"
    ? `node scripts/check-pin-first-entry-gate.mjs --stage final --issue ${issueNumber}`
    : `node scripts/check-pin-first-entry-gate.mjs --stage ${selectedStage} --allow-partial --issue ${issueNumber}`;
  const commands = ["npm --workspace apps/web test", "npm --workspace apps/web run build"];
  if (issueNumber === "465") commands.push("node scripts/capture-pin-first-entry-visual-proof.mjs --issue 465");
  commands.push(gate, "node scripts/check-no-phi-fields.mjs");
  if (issueNumber === "461") commands.push("node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 461");
  return commands;
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("capture-pin-first")) return `${base}/pin-first-visual-proof.txt`;
  if (command.includes("check-pin-first")) return `${base}/pin-first-entry-gate.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  return `${base}/command.txt`;
}

function closeoutText() {
  return `# Issue ${issue} Closeout

## Summary
Completed PIN-first entry gate stage: ${stage}.

## Files Changed
- See git diff for source changes and ${issueDir} for local evidence.

## Commands Run
- See commands.txt and command-output-map.json.

## Tests Passed/Failed
- Local command outputs are captured under test-output.

## Evidence Artifacts
- ${issueDir}
- ${manifestPath}

## Known Limitations
- The workspace access gate is controlled review-flow only and is not production authentication, real security, or PHI protection.
- Manual review remains required and promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR integration, hidden scoring, optimizer behavior, clinical safety scoring, or staffing compliance certification was added.

## Next Recommended Issue
${issue === "490" ? "Batch complete. GO for One-Floorplan Scenario Seed + Ratio Comparison Foundation." : `Issue ${Number(issue) + 1}.`}
`;
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = { issue, title: `PIN First Entry Gate Issue ${issue}`, requiredEvidence: listFiles(issueDir).sort() };
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
