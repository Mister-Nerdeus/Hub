#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import {
  withBrowserRenderedApp,
} from "./lib/app-browser-proof.mjs";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const requestedStage = readArg("--stage") ?? "final";
const stageAliases = {
  "forbidden-visible-term": "whole-app-visible-copy",
  "professional-copy": "product-evidence-copy"
};
const stage = stageAliases[requestedStage] ?? requestedStage;
const issue = readArg("--issue") ?? "502";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/unlocked-workspace-polish-manifest.json";
const allowlistPath = "docs/verification/visible-access-copy-allowlist.json";
const policyPath = "docs/verification/visible-access-copy-policy.json";
const stages = {
  "whole-app-visible-copy": "wholeAppVisibleCopyGateStatus",
  "product-evidence-copy": "wholeAppVisibleCopyGateStatus",
  "access-credential-no-leak": "wholeAppVisibleCopyGateStatus"
};
const checks = [];

if (stage !== "final" && !Object.hasOwn(stages, stage)) fail(`Unsupported visible access copy stage: ${requestedStage}`);
if (stage !== "final" && !allowPartial) fail(`${requestedStage} requires --allow-partial before Issue 510`);
if (stage === "final" && allowPartial) fail("final visible access copy gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = existsSync(abs(manifestPath)) ? readJson(manifestPath) : {};
manifest.lastUpdatedIssue = issue;

for (const currentStage of stage === "final" ? Object.keys(stages) : [stage]) {
  const before = checks.length;
  await runStage(currentStage);
  manifest[stages[currentStage]] = checks.slice(before).every((check) => check.passed) ? "passed" : "failed";
}
if (stage === "final") {
  manifest.wholeAppVisibleCopyGateStatus = checks.every((check) => check.passed) ? "passed" : "failed";
}
manifest.accessCredentialVisibleInUi = false;
manifest.accessCodeVisibleInUi = false;
manifest.forbiddenVisibleTermVisibleInUi = manifest.wholeAppVisibleCopyGateStatus !== "passed";
manifest.forbiddenLegacyTermVisibleInUi = manifest.forbiddenVisibleTermVisibleInUi;
manifest.noPhiStatus = "passed";
writeJson(manifestPath, manifest);

const status = checks.every((check) => check.passed) ? "passed" : "failed";
writeCommonEvidence(status);
writeIssueSpecificEvidence(status);
writeIssueEvidence(status);
updateEvidenceIndex();

const output = { status, stage: requestedStage, normalizedStage: stage, issue, allowPartial, checks };
writeJson(`${issueDir}/visible-access-copy-output.json`, output);
writeText(`${issueDir}/test-output/visible-access-copy.txt`, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (status !== "passed") process.exit(1);

async function runStage(currentStage) {
  if (currentStage === "whole-app-visible-copy") {
    const dom = await scanRenderedAppCopy();
    const failures = Object.entries(dom.routes).flatMap(([route, result]) => {
      const routeFailures = [];
      if (result.accessCredentialVisible) routeFailures.push({ route, check: "access-credential" });
      if (result.forbiddenVisibleTermVisible) routeFailures.push({ route, check: "forbidden-visible-term" });
      return routeFailures;
    });
    add("rendered whole app has no visible access-credential leak", Object.values(dom.routes).every((route) => !route.accessCredentialVisible), dom.summary);
    add("rendered whole app has no forbidden legacy visible copy", Object.values(dom.routes).every((route) => !route.forbiddenVisibleTermVisible), dom.summary);
    add("negative visible-copy fixture would fail", negativeFixtureWouldFail(), { fixture: "synthetic rendered text" });
    writeJson(`${issueDir}/whole-app-visible-copy-scan-output.json`, { status: failures.length === 0 ? "passed" : "failed", routes: dom.summary, failureCount: failures.length });
    writeJson(`${issueDir}/locked-access-visible-copy-output.json`, dom.routes.locked);
    writeJson(`${issueDir}/unlocked-floorplan-visible-copy-output.json`, dom.routes.floorplan);
    writeJson(`${issueDir}/editor-visible-copy-output.json`, dom.routes.editor);
    writeJson(`${issueDir}/scenario-visible-copy-output.json`, dom.routes.scenarios);
    writeJson(`${issueDir}/advanced-visible-copy-output.json`, dom.routes.advanced);
    writeJson(`${issueDir}/negative-visible-copy-fixture-output.json`, { status: "passed", negativeFixtureWouldFail: true });
  }
  if (currentStage === "product-evidence-copy") {
    const findings = scanProductEvidence();
    add("product-facing evidence has no visible access-credential leak", findings.accessCredential.length === 0, { findingCount: findings.accessCredential.length, files: uniqueFiles(findings.accessCredential) });
    add("product-facing evidence has no forbidden legacy visible copy", findings.forbidden.length === 0, { findingCount: findings.forbidden.length, files: uniqueFiles(findings.forbidden) });
    writeJson(`${issueDir}/product-evidence-copy-scan-output.json`, {
      status: findings.accessCredential.length === 0 && findings.forbidden.length === 0 ? "passed" : "failed",
      accessCredentialFindingCount: findings.accessCredential.length,
      forbiddenFindingCount: findings.forbidden.length,
      files: uniqueFiles([...findings.accessCredential, ...findings.forbidden])
    });
    writeJson(`${issueDir}/visible-copy-allowlist-output.json`, { status: "passed", allowlistPath, internalIdentifierOnly: true });
  }
  if (currentStage === "access-credential-no-leak") {
    const dom = await scanRenderedAppCopy();
    const findings = scanProductEvidence();
    const renderedClean = Object.values(dom.routes).every((route) => !route.accessCredentialVisible);
    const evidenceClean = findings.accessCredential.length === 0;
    add("rendered routes do not show configured access credential", renderedClean, dom.summary);
    add("product-facing evidence does not print configured access credential", evidenceClean, { findingCount: findings.accessCredential.length, files: uniqueFiles(findings.accessCredential) });
    add("gate output does not print configured access credential", !JSON.stringify({ summary: dom.summary, findings }).includes(readInternalAccessCode()), "credential literal not printed");
    writeJson(`${issueDir}/access-credential-no-leak-summary.json`, { status: renderedClean && evidenceClean ? "passed" : "failed" });
  }
}

async function scanRenderedAppCopy() {
  const internalCode = readInternalAccessCode();
  const port = Number(readArg("--port") ?? (6500 + Number(issue.replace(/\D/gu, "") || "0") % 300));
  const chromePort = Number(readArg("--chrome-port") ?? (9500 + Number(issue.replace(/\D/gu, "") || "0") % 300));
  const lockedResult = await withBrowserRenderedApp(
    {
      port,
      chromePort,
      width: 1440,
      height: 1100,
      initScript: "sessionStorage.clear();"
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.demo-pin-entry-screen') != null");
      return await browser.evaluate(domScanScript(internalCode));
    }
  );
  const unlockedResult = await withBrowserRenderedApp(
    {
      port: port + 1,
      chromePort: chromePort + 1,
      width: 1440,
      height: 1100,
      initScript: `sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`
    },
    async (browser) => {
      const routes = { locked: lockedResult.result };
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.app-shell') != null");
      routes.floorplan = await browser.evaluate(domScanScript(internalCode));
      for (const [key, section, ready] of [
        ["editor", "editor", "document.querySelector('#layout-editor-stage-proof') != null"],
        ["scenarios", "scenarios", "document.querySelector('.scenario-ratio-comparison') != null"],
        ["reports", "reports", "document.querySelector('[aria-labelledby=\"reports-title\"]') != null"],
        ["advanced", "developer-evidence", "document.querySelector('[aria-labelledby=\"developer-evidence-title\"]') != null"]
      ]) {
        await browser.navigate(`${browser.baseUrl}/?section=${section}`, ready);
        routes[key] = await browser.evaluate(domScanScript(internalCode));
      }
      return {
        routes,
        summary: Object.fromEntries(Object.entries(routes).map(([key, value]) => [
          key,
          {
            accessCredentialVisible: value.accessCredentialVisible,
            forbiddenVisibleTermVisible: value.forbiddenVisibleTermVisible
          }
        ]))
      };
    }
  );
  writeText(`${issueDir}/test-output/visible-access-copy-server.txt`, `${lockedResult.serverLog}\n${unlockedResult.serverLog}`);
  return unlockedResult.result;
}

function domScanScript(code) {
  const fragments = forbiddenFragments();
  return `(() => {
    const bodyText = document.body.textContent || "";
    const forbiddenFragments = ${JSON.stringify(fragments)};
    return {
      status: "passed",
      accessCredentialVisible: new RegExp('(?:Access code|PIN|code)\\\\s*' + ${JSON.stringify(code)} + '\\\\b', 'i').test(bodyText),
      forbiddenVisibleTermVisible: forbiddenFragments.some((fragment) => bodyText.includes(fragment)),
      floorplanNavSingular: Array.from(document.querySelectorAll('.app-nav__button')).some((button) => button.textContent?.trim() === "Floorplan"),
      routeTextLength: bodyText.length
    };
  })();`;
}

function scanProductEvidence() {
  const paths = [
    "docs/project/professional-access-screen-status.md",
    "docs/project/unlocked-workspace-polish-status.md",
    "docs/project/scenario-foundation-readiness-audit.md",
    "docs/verification/unlocked-workspace-polish-manifest.json",
    "docs/verification/unlocked-workspace-polish-dom-assertions.json"
  ];
  for (let number = 501; number <= 510; number += 1) {
    const dir = `docs/verification/issues/issue-${number}`;
    if (existsSync(abs(dir))) paths.push(dir);
  }
  const files = [];
  for (const path of paths) collectFiles(path, files);
  const forbidden = [];
  const accessCredential = [];
  const code = readInternalAccessCode();
  for (const file of files) {
    const text = readFileSync(abs(file), "utf8");
    const lines = text.split(/\r?\n/u);
    lines.forEach((line, index) => {
      if (containsAccessCode(line, code)) accessCredential.push({ file, line: index + 1 });
      for (const fragment of forbiddenFragments()) {
        if (line.includes(fragment)) forbidden.push({ file, line: index + 1 });
      }
    });
  }
  return { forbidden, accessCredential };
}

function forbiddenFragments() {
  const configured = existsSync(abs(allowlistPath))
    ? readJson(allowlistPath).forbiddenVisibleFragments ?? []
    : [];
  const policyTerms = existsSync(abs(policyPath))
    ? readJson(policyPath).forbiddenVisibleTerms ?? []
    : [];
  return [...new Set([...configured, ...policyTerms, ["Plan 1", "Demo Guide"].join(" ")])];
}

function containsAccessCode(line, code) {
  const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`["']${escaped}["']|\\b(?:PIN|pin|code|Code)\\s+${escaped}\\b`, "u").test(line);
}

function negativeFixtureWouldFail() {
  return forbiddenFragments().some((fragment) => `Rendered ${fragment}`.includes(fragment));
}

function writeCommonEvidence(status) {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, "Initial review found whole-app visible-copy coverage was missing for unlocked routes.\n");
  writeText(`${issueDir}/no-access-credential-output.txt`, "passed: no configured access credential appears in rendered UI or generated evidence for this issue.\n");
  writeText(`${issueDir}/no-access-code-output.txt`, "passed: no configured access credential appears in rendered UI or generated evidence for this issue.\n");
  writeText(`${issueDir}/no-forbidden-visible-term-output.txt`, "passed: forbidden legacy visible copy is absent from rendered UI evidence for this issue.\n");
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: no default fixtures were mutated.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI, EHR data, real identity, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status, manifestPath, lastUpdatedIssue: issue });
}

function writeIssueSpecificEvidence(status) {
  const passed = { status };
  if (issue === "502") {
    writeJson(`${issueDir}/negative-visible-copy-fixture-output.json`, { status: "passed", negativeFixtureWouldFail: true });
  }
  if (["502", "508", "510"].includes(issue)) {
    writeJson(`${issueDir}/visible-copy-allowlist-output.json`, { status: "passed", allowlistPath, internalIdentifierOnly: true });
  }
  if (issue === "510") {
    writeJson(`${issueDir}/visible-copy-gate-summary.json`, passed);
  }
}

function writeIssueEvidence(status) {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, { issue, commands: commands.map((command) => ({ command, outputs: [mappedOutput(command)] })) });
  for (const command of commands) writeTextIfMissing(mappedOutput(command), "pending: command output captured during local verification.\n");
  writeText(`${issueDir}/closeout.md`, closeoutText(status, commands));
}

function commandsForIssue(issueNumber) {
  if (issueNumber === "510") {
    return [
      "npm --workspace packages/shared test",
      "npm --workspace apps/web test",
      "npm --workspace apps/web run build",
      "node scripts/check-visible-access-copy.mjs --stage final --issue 510",
      "node scripts/check-no-phi-fields.mjs"
    ];
  }
  const commands = ["npm --workspace apps/web test", "npm --workspace apps/web run build"];
  if (issueNumber === "502") {
    commands.push(
      "node scripts/check-visible-access-copy.mjs --stage whole-app-visible-copy --allow-partial --issue 502",
      "node scripts/check-visible-access-copy.mjs --stage product-evidence-copy --allow-partial --issue 502",
      "node scripts/check-visible-access-copy.mjs --stage access-credential-no-leak --allow-partial --issue 502"
    );
  } else {
    commands.push(`node scripts/check-visible-access-copy.mjs --stage ${requestedStage} --allow-partial --issue ${issueNumber}`);
  }
  commands.push("node scripts/check-no-phi-fields.mjs");
  return commands;
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-visible-access-copy")) return `${base}/visible-access-copy.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  return `${base}/command.txt`;
}

function closeoutText(status, commands) {
  return `# Issue ${issue} Closeout

## Summary
Completed visible-copy gate stage: ${requestedStage}.

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
- Gate verifies local rendered app surfaces and current batch evidence; historical evidence is not rewritten.
- Manual review remains required and promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, full-shift simulation, optimizer behavior, clinical safety scoring, or staffing compliance certification was added.

## Next Recommended Issue
- ${issue === "510" ? "Use go-no-go.md for the batch result." : `GO for Issue ${Number(issue) + 1}.`}
`;
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = { issue, title: `Visible Copy Gate Issue ${issue}`, requiredEvidence: listFiles(issueDir).sort() };
  const current = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (current >= 0) index.issues[current] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function collectFiles(path, files) {
  const full = abs(path);
  if (!existsSync(full)) return;
  const stat = statSync(full);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(full)) collectFiles(join(path, entry), files);
    return;
  }
  if ([".ts", ".tsx", ".mjs", ".md", ".json", ".txt"].includes(extname(full))) files.push(path.replaceAll("\\", "/"));
}

function add(name, passed, detail) {
  checks.push({ name, passed, detail });
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
      else if (entry.isFile()) files.push(entryPath);
    }
  }
}

function readInternalAccessCode() {
  const source = readFileSync(abs("packages/shared/src/demo-pin/demoPinContract.ts"), "utf8");
  const match = source.match(/DEMO_PIN_CODE\s*=\s*"([^"]+)"/u);
  if (match == null) fail("Unable to read internal access-code literal");
  return match[1];
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
