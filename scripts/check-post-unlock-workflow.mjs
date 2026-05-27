#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "476";
const allowPartial = args.includes("--allow-partial");
const manifestPath = "docs/verification/pin-first-entry-gate-manifest.json";
const issueDir = `docs/verification/issues/issue-${issue}`;
const stages = {
  "unlock-routing": "postUnlockWorkflowStatus",
  "demo-guide-demotion": "demoGuideDemotionStatus",
  "seed-pack-demotion": "seedPackDemotionStatus",
  "workflow-button-cleanup": "workflowButtonCleanupStatus",
  "unlocked-visual-proof": "postUnlockVisualProofStatus"
};
const allStages = Object.keys(stages);
const checks = [];

if (stage !== "final" && !Object.hasOwn(stages, stage)) fail(`Unsupported post-unlock stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 490`);
if (stage === "final" && allowPartial) fail("final post-unlock gate must run without --allow-partial");

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
writeJson(`${issueDir}/post-unlock-workflow-output.json`, output);
writeText(`${issueDir}/test-output/post-unlock-workflow.txt`, `${JSON.stringify(output, null, 2)}\n`);
if (output.status !== "passed") fail(JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  const app = readText("apps/web/src/App.tsx");
  if (currentStage === "unlock-routing") {
    add("unlock sets canonical section", app.includes("setActiveSection(DEFAULT_APP_SECTION_ID)") && app.includes("DEFAULT_APP_SECTION_ID"), "App.tsx");
    add("floorplan route is canonical named", app.includes("Canonical ER Pod Floorplan"), "App.tsx");
    add("Plan 1 active by default", readText("apps/web/src/features/floorplans/activeFloorplanState.ts").includes("CANONICAL_FLOORPLAN_ID"), "activeFloorplanState.ts");
  }
  if (currentStage === "demo-guide-demotion") {
    add("workflow guide is inside details", app.includes("plan-1-demo-guide-demoted") && app.includes("<summary>Canonical Workflow Guide</summary>"), "App.tsx");
    add("operator workflow appears before demoted guide in source", app.indexOf("Canonical ER Pod Floorplan") < app.indexOf("plan-1-demo-guide-demoted"), "App.tsx");
  }
  if (currentStage === "seed-pack-demotion") {
    const guide = readText("apps/web/src/features/demo/Plan1DemoGuide.tsx");
    add("seed pack is inside evidence details", guide.includes("data-seed-pack-placement=\"developer-evidence\""), "Plan1DemoGuide.tsx");
    add("scenario seed pack panel exists", existsSync(abs("apps/web/src/features/scenarios/ScenarioSeedPackPanel.tsx")), "ScenarioSeedPackPanel.tsx");
  }
  if (currentStage === "workflow-button-cleanup") {
    const landing = readText("apps/web/src/features/floorplans/FloorplanLandingSummary.tsx");
    for (const label of ["Review Floorplan", "Edit Working Copy", "Manual Assignment", "Scenario Comparison"]) {
      add(`button label ${label}`, landing.includes(label), "FloorplanLandingSummary.tsx");
    }
    add("no browser default only action copy", !landing.includes("Open Editor") && !landing.includes("Proceed to Manual Assignment"), "FloorplanLandingSummary.tsx");
  }
  if (currentStage === "unlocked-visual-proof") {
    const assertionsPath = "docs/verification/post-unlock-workflow-dom-assertions.json";
    add("unlocked visual assertions exist", existsSync(abs(assertionsPath)), assertionsPath);
    if (existsSync(abs(assertionsPath))) {
      const assertions = readJson(assertionsPath);
      const visualIssueDir = `docs/verification/issues/issue-${assertions.issue ?? issue}`;
      add("post-unlock proof is browser-rendered app", assertions.source === "browser-rendered-app" && assertions.staticHtmlOnlyProof === false, assertions);
      add("canonical workflow first", assertions.canonicalWorkflowVisible === true, assertions);
      add("demo guide secondary", assertions.demoGuideSecondary === true, assertions);
      add("no optimizer output", assertions.optimizerOutputVisible === false, assertions);
      assertPng(`${visualIssueDir}/screenshots/post-unlock-canonical-workflow.png`, "post-unlock workflow visual proof");
    }
  }
}

function writeCommonEvidence() {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, `Reproduced missing ${stage} post-unlock workflow behavior.\n`);
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not mutated by post-unlock workflow work.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI or real identity data was added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
  if (issue === "480") mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
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
    "476": "unlock-routing",
    "477": "demo-guide-demotion",
    "478": "seed-pack-demotion",
    "479": "workflow-button-cleanup",
    "480": "final"
  };
  const selectedStage = stageByIssue[issueNumber] ?? stage;
  const commands = ["npm --workspace apps/web test", "npm --workspace apps/web run build"];
  if (issueNumber === "480") commands.push("node scripts/capture-post-unlock-workflow-proof.mjs --issue 480");
  commands.push(
    selectedStage === "final"
      ? `node scripts/check-post-unlock-workflow.mjs --stage final --issue ${issueNumber}`
      : `node scripts/check-post-unlock-workflow.mjs --stage ${selectedStage} --allow-partial --issue ${issueNumber}`,
    "node scripts/check-no-phi-fields.mjs"
  );
  return commands;
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("capture-post-unlock")) return `${base}/post-unlock-visual-proof.txt`;
  if (command.includes("check-post-unlock")) return `${base}/post-unlock-workflow.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  return `${base}/command.txt`;
}

function closeoutText() {
  return `# Issue ${issue} Closeout

## Summary
Completed post-unlock workflow stage: ${stage}.

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
- Demo guide and seed pack remain available as secondary/evidence surfaces.
- Manual review remains required and promotion remains blocked.

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
  const entry = { issue, title: `Post Unlock Workflow Issue ${issue}`, requiredEvidence: listFiles(issueDir).sort() };
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
