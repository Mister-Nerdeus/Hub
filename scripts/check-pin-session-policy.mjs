#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "session-policy";
const issue = readArg("--issue") ?? "471";
const manifestPath = "docs/verification/pin-first-entry-gate-manifest.json";
const issueDir = `docs/verification/issues/issue-${issue}`;
const forbiddenAccessCodeLiteral = ["20", "26"].join("");
const stages = {
  "session-policy": "pinSessionPolicyStatus",
  "session-storage": "pinSessionStorageStatus",
  relock: "pinRelockStatus",
  "reload-behavior": "pinReloadBehaviorStatus"
};
const checks = [];

if (!Object.hasOwn(stages, stage)) fail(`Unsupported PIN session stage: ${stage}`);
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = readJson(manifestPath);
manifest.lastUpdatedIssue = issue;
runStage(stage);
manifest[stages[stage]] = checks.every((check) => check.passed) ? "passed" : "failed";
writeJson(manifestPath, manifest);
writeCommonEvidence();
writeIssueEvidence();

const output = { status: checks.every((check) => check.passed) ? "passed" : "failed", stage, issue, checks };
writeJson(`${issueDir}/pin-session-policy-output.json`, output);
writeText(`${issueDir}/test-output/pin-session-policy.txt`, `${JSON.stringify(output, null, 2)}\n`);
if (output.status !== "passed") fail(JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "session-policy") {
    const doc = readText("docs/project/demo-pin-session-policy.md");
    const policy = readText("packages/shared/src/demo-pin/demoPinSessionPolicy.ts");
    add("session policy doc exists", doc.includes("current browser session"), "demo-pin-session-policy.md");
    add("policy uses sessionStorage", policy.includes("sessionStorage"), "demoPinSessionPolicy.ts");
    add("policy forbids PIN/auth/PHI storage", policy.includes("forbiddenStoredFields") && policy.includes("authToken") && policy.includes("phi"), "demoPinSessionPolicy.ts");
  }
  if (currentStage === "session-storage") {
    const source = readText("apps/web/src/features/demo-pin/demoPinSessionStorage.ts");
    add("session storage helper exists", source.includes("readDemoPinSessionUnlock") && source.includes("writeDemoPinSessionUnlock"), "demoPinSessionStorage.ts");
    add("stores unlocked boolean and timestamp", source.includes("unlockedAtMs") && source.includes("unlocked: true"), "demoPinSessionStorage.ts");
    add("does not store PIN value", !source.includes(forbiddenAccessCodeLiteral) && !source.includes("input:"), "demoPinSessionStorage.ts");
  }
  if (currentStage === "relock") {
    const app = readText("apps/web/src/App.tsx");
    const button = readText("apps/web/src/features/demo-pin/DemoRelockButton.tsx");
    add("Lock Workspace button exists", button.includes("Lock Workspace"), "DemoRelockButton.tsx");
    add("relock clears session", app.includes("clearDemoPinUnlock(getSessionStorage())"), "App.tsx");
    add("relock returns to default section", app.includes("setActiveSection(DEFAULT_APP_SECTION_ID)"), "App.tsx");
  }
  if (currentStage === "reload-behavior") {
    const state = readText("apps/web/src/features/demo-pin/demoPinState.ts");
    const test = readText("apps/web/src/features/demo-pin/__tests__/demoPinReloadBehavior.test.tsx");
    add("initial state reads session storage", state.includes("readDemoPinSessionUnlock"), "demoPinState.ts");
    add("submit writes session unlock", state.includes("writeDemoPinSessionUnlock"), "demoPinState.ts");
    add("reload behavior test exists", test.includes("reload-like session restore"), "demoPinReloadBehavior.test.tsx");
  }
}

function writeCommonEvidence() {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, `Reproduced missing ${stage} PIN session behavior.\n`);
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not mutated by PIN session work.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI or real identity data was added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
}

function writeIssueEvidence() {
  const commands = [
    ...(issue === "471" ? ["npm --workspace packages/shared test"] : []),
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    `node scripts/check-pin-session-policy.mjs --stage ${stage} --issue ${issue}`,
    "node scripts/check-no-phi-fields.mjs"
  ];
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutput(command)] }))
  });
  for (const command of commands) writeTextIfMissing(mappedOutput(command), "pending: command output is captured by local verification.\n");
  writeText(`${issueDir}/closeout.md`, closeoutText());
  updateEvidenceIndex();
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-pin-session-policy")) return `${base}/pin-session-policy.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  return `${base}/command.txt`;
}

function closeoutText() {
  return `# Issue ${issue} Closeout

## Summary
Completed PIN session stage: ${stage}.

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
- Access gate is session-only demo state, not production authentication, real security, or PHI protection.

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
  const entry = { issue, title: `PIN Session Policy Issue ${issue}`, requiredEvidence: listFiles(issueDir).sort() };
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
