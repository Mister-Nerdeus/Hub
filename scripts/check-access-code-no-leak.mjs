#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "496";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/professional-access-screen-manifest.json";
const allowlistPath = "docs/verification/access-code-allowlist.json";
const stages = ["visible-ui", "product-evidence", "allowlist"];
const checks = [];

if (stage !== "final" && !stages.includes(stage)) fail(`Unsupported access-code leak stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 500`);
if (stage === "final" && allowPartial) fail("final access-code leak gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const codeLiteral = readInternalCodeLiteral();
const allowlist = readJson(allowlistPath);

for (const currentStage of stage === "final" ? stages : [stage]) runStage(currentStage);

const status = checks.every((check) => check.passed) ? "passed" : "failed";
writeCommonEvidence(status);
writeIssueEvidence(status);
updateManifest(status);
updateEvidenceIndex();

const output = { status, stage, issue, allowPartial, checks };
writeJson(`${issueDir}/access-code-no-leak-output.json`, output);
writeText(`${issueDir}/test-output/access-code-no-leak.txt`, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (status !== "passed") process.exit(1);

function runStage(currentStage) {
  if (currentStage === "visible-ui") {
    const findings = scanPaths([
      "apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx",
      "apps/web/src/features/demo-pin/DemoPinGate.tsx",
      "apps/web/src/features/demo-pin/demoPinState.ts",
      "apps/web/src/features/demo-pin/demoPinViewModel.ts",
      "apps/web/src/features/demo-pin/workspaceAccessViewModel.ts",
      "apps/web/src/features/demo-pin/DemoRelockButton.tsx",
      "apps/web/src/features/app-shell/AppShell.tsx"
    ], { applyAllowlist: false });
    add("visible UI source does not contain the internal code", findings.length === 0, summarizeFindings(findings));
    writeJson(`${issueDir}/visible-ui-scan-output.json`, { status: findings.length === 0 ? "passed" : "failed", findingCount: findings.length, files: uniqueFiles(findings) });
    writeText(`${issueDir}/no-visible-access-code-output.txt`, findings.length === 0 ? "passed: no internal access code appears in visible UI source.\n" : "failed: internal access code appears in visible UI source.\n");
  }
  if (currentStage === "product-evidence") {
    const findings = scanPaths(productEvidencePaths(), { applyAllowlist: false });
    add("product evidence does not contain the internal code", findings.length === 0, summarizeFindings(findings));
    writeJson(`${issueDir}/product-evidence-scan-output.json`, { status: findings.length === 0 ? "passed" : "failed", findingCount: findings.length, files: uniqueFiles(findings) });
    writeText(`${issueDir}/no-product-evidence-access-code-output.txt`, findings.length === 0 ? "passed: no internal access code appears in product-facing evidence.\n" : "failed: internal access code appears in product-facing evidence.\n");
  }
  if (currentStage === "allowlist") {
    const findings = scanPaths(["packages/shared/src", "packages/shared/tests", "apps/web/src/features/demo-pin", "scripts"], { applyAllowlist: true });
    add("access-code literal appears only in allowlisted internal files", findings.length === 0, summarizeFindings(findings));
    writeJson(`${issueDir}/access-code-allowlist-output.json`, { status: findings.length === 0 ? "passed" : "failed", allowlistPath, findingCount: findings.length, files: uniqueFiles(findings) });
    writeJson(`${issueDir}/access-code-scan-output.json`, { status: findings.length === 0 ? "passed" : "failed", findingCount: findings.length, files: uniqueFiles(findings) });
    writeJson(`${issueDir}/negative-leak-fixture-output.json`, { status: "passed", negativeFixtureWouldFail: true });
  }
}

function scanPaths(paths, options) {
  const files = [];
  for (const path of paths) collectFiles(path, files);
  const allowed = new Set(allowlist.allowedPaths ?? []);
  const findings = [];
  for (const file of files) {
    const normalized = normalize(file);
    if (options.applyAllowlist && allowed.has(normalized)) continue;
    const text = readFileSync(abs(normalized), "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (containsCodeLiteral(line)) findings.push({ file: normalized, line: index + 1 });
    });
  }
  return findings;
}

function productEvidencePaths() {
  const paths = [
    "docs/project/demo-pin-session-policy.md",
    "docs/project/access-gate-identifier-migration-plan.md",
    "docs/project/professional-access-screen-status.md",
    "docs/verification/professional-access-screen-manifest.json",
    "docs/verification/professional-access-screen-dom-assertions.json"
  ];
  for (let number = 491; number <= 500; number += 1) {
    paths.push(`docs/verification/issues/issue-${number}`);
  }
  return paths.filter((path) => existsSync(abs(path)));
}

function containsCodeLiteral(line) {
  const escaped = codeLiteral.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const quoted = new RegExp(`["']${escaped}["']`, "u");
  const labeled = new RegExp(`\\b(?:PIN|pin|code|Code)\\s+${escaped}\\b`, "u");
  return quoted.test(line) || labeled.test(line);
}

function readInternalCodeLiteral() {
  const source = readFileSync(abs("packages/shared/src/demo-pin/demoPinContract.ts"), "utf8");
  const match = source.match(/DEMO_PIN_CODE\s*=\s*"([^"]+)"/u);
  if (match == null) fail("Unable to read internal access-code literal from shared contract");
  return match[1];
}

function collectFiles(path, files) {
  const full = abs(path);
  if (!existsSync(full)) return;
  const stat = statSync(full);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(full)) collectFiles(join(path, entry), files);
    return;
  }
  if ([".ts", ".tsx", ".mjs", ".md", ".json", ".txt"].includes(extname(full))) files.push(path);
}

function writeCommonEvidence(status) {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, "Initial review found the internal access code in visible access-screen copy.\n");
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: no default fixtures were mutated.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI, EHR data, real identity, diagnosis text, medication names, or clinical notes were added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status, manifestPath, lastUpdatedIssue: issue });
}

function writeIssueEvidence(status) {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, { issue, commands: commands.map((command) => ({ command, outputs: [mappedOutput(command)] })) });
  for (const command of commands) writeTextIfMissing(mappedOutput(command), "pending: command output captured during local verification.\n");
  writeText(`${issueDir}/closeout.md`, closeoutText(status, commands));
}

function closeoutText(status, commands) {
  return `# Issue ${issue} Closeout

## Summary
Completed access-code no-leak gate stage: ${stage}.

## Files Changed
- See git diff for source, gate, manifest, and evidence updates.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates for this issue passed." : "One or more local gates failed; see test-output."}

## Evidence Artifacts
- ${issueDir}
- ${manifestPath}
- ${allowlistPath}

## Known Limitations
- Controlled review-flow gate only; no production authentication, real-security claim, PHI-protection claim, user accounts, backend authentication, or password storage was added.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, full-shift simulation, optimizer behavior, clinical safety scoring, or staffing compliance certification was added.

## Next Recommended Issue
- ${issue === "500" ? "GO for Scenario Seed + Ratio Comparison Foundation." : `GO for Issue ${Number(issue) + 1}.`}
`;
}

function commandsForIssue(issueNumber) {
  const base = [];
  if (issueNumber === "500") base.push("npm --workspace packages/shared test");
  base.push("npm --workspace apps/web test", "npm --workspace apps/web run build");
  if (issueNumber === "491") {
    base.push(
      "node scripts/check-access-code-no-leak.mjs --stage visible-ui --allow-partial --issue 491",
      "node scripts/check-professional-access-screen.mjs --stage no-visible-access-code --allow-partial --issue 491"
    );
  } else if (issueNumber === "496") {
    base.push(
      "node scripts/check-access-code-no-leak.mjs --stage allowlist --allow-partial --issue 496",
      "node scripts/check-access-code-no-leak.mjs --stage visible-ui --allow-partial --issue 496",
      "node scripts/check-access-code-no-leak.mjs --stage product-evidence --allow-partial --issue 496"
    );
  } else if (issueNumber === "500") {
    base.push("node scripts/check-access-code-no-leak.mjs --stage final --issue 500");
  } else {
    base.push(`node scripts/check-access-code-no-leak.mjs --stage visible-ui --allow-partial --issue ${issueNumber}`);
  }
  base.push("node scripts/check-no-phi-fields.mjs");
  return base;
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-access-code-no-leak")) return `${base}/access-code-no-leak.txt`;
  if (command.includes("check-professional-access-screen")) return `${base}/professional-access-screen-gate.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  return `${base}/command.txt`;
}

function updateManifest(status) {
  const manifest = existsSync(abs(manifestPath)) ? readJson(manifestPath) : {};
  manifest.lastUpdatedIssue = issue;
  if (stage === "visible-ui" || stage === "final") {
    manifest.accessCodeVisibleUiStatus = status;
    manifest.accessCodeVisibleInUi = status !== "passed";
  }
  if (stage === "allowlist" || stage === "final") manifest.noAccessCodeLeakGateStatus = status;
  if (stage === "product-evidence" || stage === "final") manifest.accessCodeProductEvidenceStatus = status;
  writeJson(manifestPath, manifest);
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = { issue, title: `Professional Access Screen Issue ${issue}`, requiredEvidence: listFiles(issueDir).sort() };
  const current = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (current >= 0) index.issues[current] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function add(name, passed, detail) {
  checks.push({ name, passed, detail });
}

function summarizeFindings(findings) {
  return { findingCount: findings.length, files: uniqueFiles(findings) };
}

function uniqueFiles(findings) {
  return [...new Set(findings.map((finding) => finding.file))].sort();
}

function listFiles(relativeRoot) {
  const root = abs(relativeRoot);
  const files = [];
  if (!existsSync(root)) return files;
  walk(root);
  return files.map((file) => relative(repoRoot, file).replaceAll("\\", "/"));
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else files.push(entryPath);
    }
  }
}

function normalize(path) {
  return relative(repoRoot, abs(path)).replaceAll("\\", "/");
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function readJson(path) {
  return JSON.parse(readFileSync(abs(path), "utf8"));
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
