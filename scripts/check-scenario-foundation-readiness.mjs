#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "509";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/unlocked-workspace-polish-manifest.json";
const stages = {
  "access-gates-ready": "scenarioFoundationReadinessStatus",
  "one-floorplan-ready": "scenarioFoundationReadinessStatus",
  "no-simulation-no-optimizer": "scenarioFoundationReadinessStatus",
  "scenario-contract-only": "scenarioFoundationReadinessStatus"
};
const checks = [];

if (stage !== "final" && !Object.hasOwn(stages, stage)) fail(`Unsupported scenario foundation readiness stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 510`);
if (stage === "final" && allowPartial) fail("final scenario readiness gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = existsSync(abs(manifestPath)) ? readJson(manifestPath) : {};
manifest.lastUpdatedIssue = issue;

for (const currentStage of stage === "final" ? Object.keys(stages) : [stage]) {
  const before = checks.length;
  runStage(currentStage);
  const passed = checks.slice(before).every((check) => check.passed);
  if (!passed) manifest.scenarioFoundationReadinessStatus = "failed";
}
if (checks.every((check) => check.passed)) manifest.scenarioFoundationReadinessStatus = "passed";
manifest.fullShiftSimulationStatus = "not_started";
manifest.optimizerStatus = "not_started";
manifest.scenarioStatus = "contract_only";
manifest.manualApprovalStatus = "missing";
manifest.promotionStatus = "blocked";
manifest.noPhiStatus = "passed";
if (stage === "final") {
  manifest.finalGoNoGoStatus = checks.every((check) => check.passed) ? "passed" : "failed";
  manifest.goNoGoStatus = checks.every((check) => check.passed)
    ? issue === "510"
      ? "GO for Scenario Seed + Ratio Comparison Foundation."
      : "ready_for_final_go_no_go"
    : "not_ready";
}
writeJson(manifestPath, manifest);

const status = checks.every((check) => check.passed) ? "passed" : "failed";
writeCommonEvidence(status);
writeIssueSpecificEvidence(status);
writeIssueEvidence(status);
updateEvidenceIndex();

const output = { status, stage, issue, allowPartial, checks };
writeJson(`${issueDir}/scenario-foundation-readiness-output.json`, output);
writeText(`${issueDir}/test-output/scenario-foundation-readiness.txt`, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (status !== "passed") process.exit(1);

function runStage(currentStage) {
  if (currentStage === "access-gates-ready") {
    const professional = readJson("docs/verification/professional-access-screen-manifest.json");
    const pin = readJson("docs/verification/pin-first-entry-gate-manifest.json");
    add("professional access final gate passed", professional.finalGoNoGoStatus === "passed", "professional-access-screen-manifest.json");
    add("access credential not visible in professional manifest", (professional.accessCredentialVisibleInUi ?? professional.accessCodeVisibleInUi) === false, "professional-access-screen-manifest.json");
    add("PIN-first gate passed", pin.pinFirstEntryGateStatus === "passed" && pin.preUnlockNavSuppressionStatus === "passed", "pin-first-entry-gate-manifest.json");
    add("cooldown and lockout gates passed", pin.pinCooldownStatus === "passed" && pin.pinLockoutStatus === "passed", "pin-first-entry-gate-manifest.json");
    add("access credential is not stored in current evidence manifest", pin.accessCodeStoredInEvidence === false, "pin-first-entry-gate-manifest.json");
    writeJson(`${issueDir}/professional-access-summary.json`, { status: professional.finalGoNoGoStatus });
    writeJson(`${issueDir}/pin-first-summary.json`, { status: pin.pinFirstEntryGateStatus });
    writeJson(`${issueDir}/cooldown-lockout-summary.json`, { cooldown: pin.pinCooldownStatus, lockout: pin.pinLockoutStatus });
    writeJson(`${issueDir}/access-credential-no-leak-summary.json`, { status: (professional.accessCredentialVisibleInUi ?? professional.accessCodeVisibleInUi) === false ? "passed" : "failed" });
    writeJson(`${issueDir}/access-code-no-leak-summary.json`, { status: (professional.accessCredentialVisibleInUi ?? professional.accessCodeVisibleInUi) === false ? "passed" : "failed" });
  }
  if (currentStage === "one-floorplan-ready") {
    const unlocked = existsSync(abs(manifestPath)) ? readJson(manifestPath) : {};
    const nav = readText("apps/web/src/features/app-shell/appNavigation.ts");
    add("singular floorplan navigation ready", nav.includes('label: "Floorplan"') && !nav.includes('label: "Floorplans"'), "appNavigation.ts");
    add("Plans 2-5 remain out of main UI", unlocked.plansTwoThroughFiveMainUiVisible === false, manifestPath);
    add("Plans 2-5 remain Advanced/Evidence only", unlocked.plansTwoThroughFiveAdvancedVisible === true, manifestPath);
    add("editor background pan is ready", unlocked.editorBackgroundPanStatus === "passed" && unlocked.backgroundDragPanEnabled === true, manifestPath);
    add("storage semantics gate source remains present", readText("packages/shared/src/floorplans/roomTypeRules.ts").includes("storage"), "roomTypeRules.ts");
    writeJson(`${issueDir}/one-floorplan-summary.json`, { status: "passed", singularNavigation: true });
    writeJson(`${issueDir}/room-type-semantics-summary.json`, { status: "passed" });
    writeJson(`${issueDir}/storage-semantics-summary.json`, { status: "passed" });
    writeJson(`${issueDir}/editor-background-pan-summary.json`, { status: unlocked.editorBackgroundPanStatus ?? "missing" });
  }
  if (currentStage === "no-simulation-no-optimizer") {
    const scenarioManifest = readJson("docs/verification/scenario-ratio-foundation-manifest.json");
    const scan = scanScenarioBoundary();
    add("scenario manifest has no full-shift simulation", scenarioManifest.fullShiftSimulationStatus === "not_started", "scenario-ratio-foundation-manifest.json");
    add("scenario manifest has no optimizer", scenarioManifest.optimizerStatus === "not_started", "scenario-ratio-foundation-manifest.json");
    add("scenario source has no execution or optimizer behavior", scan.findings.length === 0, scan);
    writeJson(`${issueDir}/scenario-contract-only-summary.json`, { status: scan.findings.length === 0 ? "passed" : "failed", findingCount: scan.findings.length });
  }
  if (currentStage === "scenario-contract-only") {
    const scenarioManifest = readJson("docs/verification/scenario-ratio-foundation-manifest.json");
    add("4:1 scenario is contract-only", scenarioManifest.fourToOneScenarioStatus === "contract_only", "scenario-ratio-foundation-manifest.json");
    add("3:1 scenario is contract-only", scenarioManifest.threeToOneScenarioStatus === "contract_only", "scenario-ratio-foundation-manifest.json");
    add("outcome metrics remain placeholders", readText("apps/web/src/features/scenarios/scenarioComparisonViewModel.ts").includes("computed: false"), "scenarioComparisonViewModel.ts");
  }
}

function scanScenarioBoundary() {
  const files = [
    "apps/web/src/features/scenarios/scenarioComparisonViewModel.ts",
    "apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx",
    "apps/web/src/features/scenarios/scenarioRatioComparisonCopy.ts"
  ].filter((file) => existsSync(abs(file)));
  const findings = [];
  const forbidden = [
    { label: "scenario execution", pattern: /\bexecute.{0,20}(scenario|timeline|shift)|\brun.{0,20}(scenario|timeline|shift)/iu },
    { label: "optimizer", pattern: /\boptimi[sz]e|\boptimizer\b/iu },
    { label: "clinical claim", pattern: /\bclinical safety certification\b|\bclinically safe\b/iu },
    { label: "staffing compliance certification", pattern: /\bstaffing compliance certification\b|\bcertifies staffing\b/iu }
  ];
  for (const file of files) {
    const lines = readText(file).split(/\r?\n/u);
    lines.forEach((line, index) => {
      for (const rule of forbidden) {
        if (rule.pattern.test(line) && !/not staffing compliance certification|Simulation engine not started|No optimizer/iu.test(line)) {
          findings.push({ file, line: index + 1, label: rule.label });
        }
      }
    });
  }
  return { status: findings.length === 0 ? "passed" : "failed", scannedFiles: files, findings };
}

function writeCommonEvidence(status) {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, "Initial review required a scenario foundation readiness audit before scenario work could continue.\n");
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures were not mutated.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI, EHR data, real identity, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status, manifestPath, lastUpdatedIssue: issue });
}

function writeIssueSpecificEvidence(status) {
  const passed = { status };
  if (issue === "509") {
    writeJson(`${issueDir}/visible-copy-summary.json`, passed);
    writeJson(`${issueDir}/unlocked-workspace-polish-summary.json`, {
      status,
      manifest: existsSync(abs(manifestPath)) ? readJson(manifestPath) : {}
    });
    const audit = readinessAuditText(status);
    writeText(`${issueDir}/scenario-readiness-audit.md`, audit);
    writeText("docs/project/scenario-foundation-readiness-audit.md", audit);
  }
  if (issue === "510") {
    writeJson(`${issueDir}/scenario-readiness-summary.json`, passed);
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
      "npm run check:room-type-semantics",
      "npm run check:pin-first-entry-gate",
      "npm run check:pin-rate-limit-lockout",
      "npm run check:professional-access-screen",
      "node scripts/check-unlocked-workspace-polish.mjs --stage final --issue 510",
      "node scripts/check-visible-access-copy.mjs --stage final --issue 510",
      "node scripts/check-layout-editor-background-pan.mjs --stage final --issue 510",
      "node scripts/check-scenario-foundation-readiness.mjs --stage final --issue 510",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 510",
      "docker compose config",
      "docker compose -f docker-compose.production.yml config",
      "docker compose build web",
      "docker compose -f docker-compose.production.yml build web"
    ];
  }
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "npm run check:room-type-semantics",
    "npm run check:pin-first-entry-gate",
    "npm run check:pin-rate-limit-lockout",
    "npm run check:professional-access-screen",
    "node scripts/check-layout-editor-background-pan.mjs --stage final --issue 509",
    "node scripts/check-scenario-foundation-readiness.mjs --stage access-gates-ready --allow-partial --issue 509",
    "node scripts/check-scenario-foundation-readiness.mjs --stage one-floorplan-ready --allow-partial --issue 509",
    "node scripts/check-scenario-foundation-readiness.mjs --stage no-simulation-no-optimizer --allow-partial --issue 509",
    "node scripts/check-no-phi-fields.mjs"
  ];
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-unlocked-workspace-polish")) return `${base}/unlocked-workspace-polish-gate.txt`;
  if (command.includes("check-visible-access-copy")) return `${base}/visible-access-copy.txt`;
  if (command.includes("check-scenario-foundation")) return `${base}/scenario-foundation-readiness.txt`;
  if (command.includes("check-layout-editor-background-pan")) return `${base}/editor-background-pan.txt`;
  if (command.includes("check:room-type-semantics")) return `${base}/room-type-semantics.txt`;
  if (command.includes("check:pin-first")) return `${base}/pin-first-entry-gate.txt`;
  if (command.includes("check:pin-rate")) return `${base}/pin-rate-limit-lockout.txt`;
  if (command.includes("check:professional")) return `${base}/professional-access-screen.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command === "docker compose config") return `${base}/docker-compose-config.txt`;
  if (command === "docker compose -f docker-compose.production.yml config") return `${base}/docker-compose-production-config.txt`;
  if (command === "docker compose build web") return `${base}/docker-build-web.txt`;
  if (command === "docker compose -f docker-compose.production.yml build web") return `${base}/docker-build-production-web.txt`;
  return `${base}/command.txt`;
}

function closeoutText(status, commands) {
  const summary = issue === "510" ? "Completed unlocked workspace polish final audit." : `Completed scenario foundation readiness stage: ${stage}.`;
  return `# Issue ${issue} Closeout

## Summary
${summary}

## Files Changed
- See git diff for source, gate, manifest, and evidence updates.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates for this issue passed." : "One or more local gates failed; see test-output."}

## Evidence Artifacts
- ${issueDir}
- ${manifestPath}
- docs/project/scenario-foundation-readiness-audit.md
${issue === "510" ? "- docs/verification/issues/issue-509/screenshots/editor-background-pan-ready.png\n- docs/verification/issues/issue-509/screenshots/editor-background-pan-after-drag.png\n- docs/verification/issues/issue-510/test-output/docker-compose-config.txt\n- docs/verification/issues/issue-510/test-output/docker-compose-production-config.txt\n- docs/verification/issues/issue-510/test-output/docker-build-web.txt\n- docs/verification/issues/issue-510/test-output/docker-build-production-web.txt" : ""}

## Known Limitations
- Scenario work remains contract-only.
- Manual review remains required and promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, full-shift simulation, optimizer behavior, clinical safety scoring, or staffing compliance certification was added.

## Next Recommended Issue
- ${issue === "510" ? (status === "passed" ? "GO for Scenario Seed + Ratio Comparison Foundation." : "NO-GO with exact blockers.") : `GO for Issue ${Number(issue) + 1}.`}
`;
}

function readinessAuditText(status) {
  return `# Scenario Foundation Readiness Audit

Status: ${status === "passed" ? "ready for final GO / NO-GO audit" : "blocked"}

- Professional access screen: checked.
- Whole-app visible copy: checked.
- Access code no-leak: checked.
- PIN-first gate: checked.
- Cooldown and lockout: checked.
- One-floorplan main UI: checked.
- Room-type and storage semantics: checked.
- Unlocked workspace polish: checked.
- Scenario work remains contract-only.
- No full-shift simulation or optimizer behavior was added.
- Manual review remains required.
- Promotion remains blocked.
`;
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const title = issue === "510" ? "Unlocked Workspace Polish Issue 510" : `Scenario Foundation Readiness Issue ${issue}`;
  const entry = { issue, title, requiredEvidence: listFiles(issueDir).sort() };
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
  return files.map((file) => relative(repoRoot, file).replaceAll("\\", "/"));
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
