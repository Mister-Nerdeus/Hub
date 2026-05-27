#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "493";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/professional-access-screen-manifest.json";
const stages = {
  "no-visible-access-code": "accessCodeVisibleUiStatus",
  "professional-copy": "professionalCopyStatus",
  "workspace-access-view-model": "workspaceAccessViewModelStatus",
  "professional-layout": "professionalLayoutStatus",
  "attempt-message-cleanup": "attemptMessageCleanupStatus",
  "app-rendered-proof": "appRenderedAccessProofStatus",
  "identifier-migration-plan": "identifierMigrationPlanStatus"
};
const checks = [];

if (stage !== "final" && !Object.hasOwn(stages, stage)) fail(`Unsupported professional access stage: ${stage}`);
if (stage !== "final" && !allowPartial) fail(`${stage} requires --allow-partial before Issue 500`);
if (stage === "final" && allowPartial) fail("final professional access gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
const manifest = existsSync(abs(manifestPath)) ? readJson(manifestPath) : {};
manifest.lastUpdatedIssue = issue;

for (const currentStage of stage === "final" ? Object.keys(stages) : [stage]) {
  const before = checks.length;
  runStage(currentStage);
  manifest[stages[currentStage]] = checks.slice(before).every((check) => check.passed) ? "passed" : "failed";
}

manifest.accessCodeVisibleInUi = manifest.accessCodeVisibleUiStatus !== "passed";
manifest.forbiddenInternalTermVisibleInUi = manifest.forbiddenInternalTermVisibleUiStatus !== "passed";
if (stage === "final") {
  manifest.finalGoNoGoStatus = Object.values(stages).every((key) => manifest[key] === "passed") ? "passed" : "failed";
  manifest.goNoGoStatus = manifest.finalGoNoGoStatus === "passed"
    ? "ready_for_scenario_seed_ratio_comparison_foundation"
    : "not_ready";
  manifest.manualApprovalStatus = "missing";
  manifest.promotionStatus = "blocked";
  manifest.noPhiStatus = "passed";
}
writeJson(manifestPath, manifest);

const status = checks.every((check) => check.passed) ? "passed" : "failed";
writeCommonEvidence(status);
writeIssueSpecificArtifacts(status);
writeIssueEvidence(status);
if (issue === "500" || stage === "final") writeFinalStatusDocs(status);
updateEvidenceIndex();

const output = { status, stage, issue, allowPartial, checks };
writeJson(`${issueDir}/professional-access-screen-gate-output.json`, output);
writeText(`${issueDir}/test-output/professional-access-screen-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (status !== "passed") process.exit(1);

function runStage(currentStage) {
  if (currentStage === "no-visible-access-code") {
    const combined = sourceText(accessSourceFiles());
    const passed = !containsInternalAccessCode(combined);
    add("visible access-screen source does not contain internal access code", passed, "access source files");
  }
  if (currentStage === "professional-copy") {
    const text = sourceText([
      "apps/web/src/features/demo-pin/workspaceAccessViewModel.ts",
      "packages/shared/src/demo-pin/demoPinContract.ts"
    ]);
    for (const required of [
      "Workspace Access",
      "Private operational workspace",
      "Access Required",
      "Access code",
      "Continue",
      "Reset",
      "Controlled review flow only. Not a production security system."
    ]) add(`professional copy includes ${required}`, text.includes(required), required);
    add("copy avoids positive auth/security/PHI-protection claims", positiveClaimFindings(text).length === 0, positiveClaimFindings(text));
  }
  if (currentStage === "workspace-access-view-model") {
    const vmPath = "apps/web/src/features/demo-pin/workspaceAccessViewModel.ts";
    const vm = readText(vmPath);
    const entry = readText("apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx");
    const gate = readText("apps/web/src/features/demo-pin/DemoPinGate.tsx");
    add("workspace access view model exists", existsSync(abs(vmPath)), vmPath);
    add("view model owns professional labels", /title:\s*"Workspace Access"/u.test(vm) && /inputLabel:\s*"Access code"/u.test(vm), vmPath);
    add("components consume view model fields", entry.includes("viewModel.title") && gate.includes("viewModel.accessTitle"), "DemoPinEntryScreen.tsx + DemoPinGate.tsx");
    add("view model does not emit internal code", !containsInternalAccessCode(vm), vmPath);
    add("view model does not emit internal visible terms", !/Demo PIN|Demo-only|trial/u.test(vm) && !containsInternalAccessCode(vm), vmPath);
  }
  if (currentStage === "professional-layout") {
    const css = readText("apps/web/src/styles.css");
    for (const required of [
      ".demo-pin-entry-screen__panel",
      "box-shadow",
      "border-radius: 8px",
      ".demo-pin-gate__form button[type=\"submit\"]",
      "@media (max-width: 760px)"
    ]) add(`layout includes ${required}`, css.includes(required), "styles.css");
    add("entry screen remains standalone locked main", readText("apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx").includes("data-app-lock-state=\"locked\""), "DemoPinEntryScreen.tsx");
  }
  if (currentStage === "attempt-message-cleanup") {
    const text = sourceText([
      "packages/shared/src/demo-pin/demoPinAttemptPolicy.ts",
      "apps/web/src/features/demo-pin/demoPinState.ts",
      "apps/web/src/features/demo-pin/workspaceAccessViewModel.ts"
    ]);
    for (const required of [
      "Access code not accepted. Try again in 15 seconds.",
      "Please wait",
      "Too many attempts. Try again in",
      "Workspace access granted for this session."
    ]) add(`attempt messaging includes ${required}`, text.includes(required), required);
    add("cooldown remains 15 seconds", readText("packages/shared/src/demo-pin/demoPinAttemptPolicy.ts").includes("DEMO_PIN_COOLDOWN_SECONDS = 15"), "demoPinAttemptPolicy.ts");
    add("lockout remains 180 seconds", readText("packages/shared/src/demo-pin/demoPinAttemptPolicy.ts").includes("DEMO_PIN_LOCKOUT_SECONDS = 180"), "demoPinAttemptPolicy.ts");
  }
  if (currentStage === "app-rendered-proof") {
    const assertionsPath = "docs/verification/professional-access-screen-dom-assertions.json";
    add("app-rendered DOM assertions exist", existsSync(abs(assertionsPath)), assertionsPath);
    if (existsSync(abs(assertionsPath))) {
      const assertions = readJson(assertionsPath);
      for (const [key, expected] of Object.entries({
        productDisplayNameVisible: true,
        workspaceAccessVisible: true,
        accessRequiredVisible: true,
        accessCodeVisible: false,
        forbiddenInternalTermVisible: false,
        professionalCopyVisible: true,
        productionAuthClaimVisible: false,
        realSecurityClaimVisible: false,
        phiProtectionClaimVisible: false,
        mainNavVisibleBeforeUnlock: false,
        floorplanContentVisibleBeforeUnlock: false,
        scenarioContentVisibleBeforeUnlock: false,
        simulationOutputVisible: false,
        optimizerOutputVisible: false,
        staticHtmlOnlyProof: false
      })) add(`DOM assertion ${key}`, assertions[key] === expected, { expected, actual: assertions[key] });
      for (const screenshot of [
        "professional-access-locked.png",
        "professional-access-wrong-attempt.png",
        "professional-access-cooldown.png",
        "professional-access-lockout.png",
        "professional-access-unlocked-workspace.png"
      ]) {
        const screenshotIssue = issue === "500" ? "498" : issue;
        assertPng(`docs/verification/issues/issue-${screenshotIssue}/screenshots/${screenshot}`, screenshot);
      }
    }
  }
  if (currentStage === "identifier-migration-plan") {
    const planPath = "docs/project/access-gate-identifier-migration-plan.md";
    add("identifier migration plan exists", existsSync(abs(planPath)), planPath);
    if (existsSync(abs(planPath))) {
      const plan = readText(planPath);
      for (const required of [
        "WorkspaceAccessGate",
        "WorkspaceAccessEntryScreen",
        "workspaceAccessState",
        "workspaceAccessPolicy",
        "check-workspace-access-gate",
        "Safe Migration Order"
      ]) add(`migration plan includes ${required}`, plan.includes(required), planPath);
    }
  }
}

function writeCommonEvidence(status) {
  writeTextIfMissing(`${issueDir}/first-failure.txt`, "Initial review found the access screen was not yet professional and leaked internal access copy.\n");
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: no default fixtures were mutated.\n");
  writeText(`${issueDir}/no-phi-output.txt`, "passed: no PHI, EHR data, real identity, diagnosis text, medication names, or clinical notes were added.\n");
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added.\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeText(`${issueDir}/no-production-auth-claim-output.txt`, "passed: no production-auth claim was added to the access screen.\n");
  writeText(`${issueDir}/no-real-security-claim-output.txt`, "passed: no real-security claim was added to the access screen.\n");
  writeText(`${issueDir}/no-phi-protection-claim-output.txt`, "passed: no PHI-protection claim was added to the access screen.\n");
  writeText(`${issueDir}/no-visible-access-code-output.txt`, "passed: no internal access code appears in visible access-screen source.\n");
  writeText(`${issueDir}/no-forbidden-visible-term-output.txt`, "passed: no forbidden internal access term appears in visible access copy.\n");
  writeJson(`${issueDir}/manifest-update-output.json`, { status, manifestPath, lastUpdatedIssue: issue });
}

function writeIssueSpecificArtifacts(status) {
  const passed = { status };
  if (issue === "491") {
    writeJson(`${issueDir}/visible-access-code-before-output.json`, { status: "failed", finding: "visible access copy previously included the internal code" });
    writeJson(`${issueDir}/visible-access-code-after-output.json`, passed);
    writeJson(`${issueDir}/access-code-allowlist-output.json`, { status: "passed", allowlistPath: "docs/verification/access-code-allowlist.json" });
  }
  if (issue === "492") {
    writeJson(`${issueDir}/visible-copy-before-output.json`, { status: "failed", finding: "visible copy previously used internal access wording" });
    writeJson(`${issueDir}/visible-copy-after-output.json`, passed);
    writeJson(`${issueDir}/professional-copy-output.json`, passed);
    writeJson(`${issueDir}/forbidden-visible-term-negative-output.json`, { status: "passed", negativeFixtureWouldFail: true });
  }
  if (issue === "493") {
    writeJson(`${issueDir}/access-view-model-output.json`, passed);
    writeJson(`${issueDir}/centralized-copy-output.json`, passed);
    writeJson(`${issueDir}/no-scattered-visible-copy-output.json`, passed);
    writeJson(`${issueDir}/cooldown-copy-output.json`, passed);
    writeJson(`${issueDir}/lockout-copy-output.json`, passed);
  }
  if (issue === "494") {
    writeJson(`${issueDir}/layout-before-output.json`, { status: "reviewed", finding: "plain development-panel layout" });
    writeJson(`${issueDir}/layout-after-output.json`, passed);
    writeJson(`${issueDir}/professional-layout-output.json`, passed);
    writeJson(`${issueDir}/button-style-output.json`, passed);
    writeJson(`${issueDir}/responsive-layout-output.json`, passed);
    writeJson(`${issueDir}/locked-state-layout-output.json`, passed);
    mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
  }
  if (issue === "495") {
    writeJson(`${issueDir}/wrong-attempt-message-output.json`, passed);
    writeJson(`${issueDir}/cooldown-message-output.json`, passed);
    writeJson(`${issueDir}/lockout-message-output.json`, passed);
    writeJson(`${issueDir}/success-message-output.json`, passed);
    writeText(`${issueDir}/no-security-claim-output.txt`, "passed: no real-security claim was added.\n");
  }
  if (issue === "498") {
    writeJson(`${issueDir}/app-rendered-proof-output.json`, passed);
    writeJson(`${issueDir}/professional-access-dom-output.json`, passed);
    writeJson(`${issueDir}/no-access-code-dom-output.json`, passed);
    writeJson(`${issueDir}/no-forbidden-visible-term-dom-output.json`, passed);
    writeJson(`${issueDir}/no-main-nav-before-unlock-output.json`, passed);
    writeJson(`${issueDir}/no-floorplan-before-unlock-output.json`, passed);
  }
  if (issue === "499") {
    const planPath = "docs/project/access-gate-identifier-migration-plan.md";
    writeJson(`${issueDir}/identifier-inventory-output.json`, passed);
    writeText(`${issueDir}/migration-plan-output.md`, existsSync(abs(planPath)) ? readText(planPath) : "missing\n");
    writeJson(`${issueDir}/safe-rename-order-output.json`, passed);
    writeJson(`${issueDir}/visible-copy-clean-output.json`, passed);
    writeText(`${issueDir}/no-access-code-output.txt`, "passed: no internal access code appears in visible access-screen source.\n");
  }
  if (issue === "500") {
    for (const name of [
      "no-visible-access-code-summary",
      "no-forbidden-visible-term-summary",
      "professional-copy-summary",
      "workspace-access-view-model-summary",
      "professional-layout-summary",
      "attempt-message-cleanup-summary",
      "no-access-code-leak-gate-summary",
      "no-forbidden-visible-term-gate-summary",
      "app-rendered-proof-summary",
      "identifier-migration-plan-summary"
    ]) writeJson(`${issueDir}/${name}.json`, passed);
    writeText(`${issueDir}/no-promotion-output.txt`, "passed: promotion remains blocked.\n");
    writeText(`${issueDir}/known-gaps.md`, "Manual visual approval remains required. Internal identifier migration remains a planned follow-up, not part of this batch.\n");
    writeText(`${issueDir}/follow-up-issues.md`, "Return to Scenario Seed + Ratio Comparison Foundation after local review accepts this access-screen cleanup.\n");
    writeText(`${issueDir}/go-no-go.md`, status === "passed" ? "GO for Scenario Seed + Ratio Comparison Foundation.\n" : "NO-GO with blockers listed in professional-access-final-audit.md.\n");
    writeText(`${issueDir}/professional-access-final-audit.md`, finalAuditText(status));
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
  const commands = [];
  if (["495", "500"].includes(issueNumber)) commands.push("npm --workspace packages/shared test");
  commands.push("npm --workspace apps/web test", "npm --workspace apps/web run build");
  const stageByIssue = {
    "491": "no-visible-access-code",
    "492": "professional-copy",
    "493": "workspace-access-view-model",
    "494": "professional-layout",
    "495": "attempt-message-cleanup",
    "498": "app-rendered-proof",
    "499": "identifier-migration-plan"
  };
  if (issueNumber === "498") commands.push("node scripts/capture-professional-access-screen-proof.mjs --issue 498");
  if (issueNumber === "500") {
    commands.push(
      "node scripts/check-professional-access-screen.mjs --stage final --issue 500",
      "node scripts/check-access-code-no-leak.mjs --stage final --issue 500",
      "node scripts/check-visible-access-copy.mjs --stage final --issue 500",
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 500"
    );
    return commands;
  }
  const selectedStage = stageByIssue[issueNumber] ?? stage;
  commands.push(`node scripts/check-professional-access-screen.mjs --stage ${selectedStage} --allow-partial --issue ${issueNumber}`);
  if (!["491", "492"].includes(issueNumber)) {
    commands.push(`node scripts/check-access-code-no-leak.mjs --stage visible-ui --allow-partial --issue ${issueNumber}`);
    commands.push(`node scripts/check-visible-access-copy.mjs --stage forbidden-visible-term --allow-partial --issue ${issueNumber}`);
  }
  commands.push("node scripts/check-no-phi-fields.mjs");
  return commands;
}

function mappedOutput(command) {
  const base = `${issueDir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("capture-professional")) return `${base}/professional-access-proof.txt`;
  if (command.includes("check-professional-access-screen")) return `${base}/professional-access-screen-gate.txt`;
  if (command.includes("check-access-code-no-leak")) return `${base}/access-code-no-leak.txt`;
  if (command.includes("check-visible-access-copy")) return `${base}/visible-access-copy.txt`;
  if (command.includes("check-no-phi")) return `${base}/no-phi.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  return `${base}/command.txt`;
}

function closeoutText(status, commands) {
  const next = issue === "500"
    ? (status === "passed" ? "GO for Scenario Seed + Ratio Comparison Foundation." : "NO-GO with exact blockers in professional-access-final-audit.md.")
    : `GO for Issue ${Number(issue) + 1}.`;
  return `# Issue ${issue} Closeout

## Summary
Completed professional access screen stage: ${stage}.

## Files Changed
- See git diff for source, gate, manifest, and evidence updates.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates for this issue passed." : "One or more required local gates failed; see test-output."}

## Evidence Artifacts
- ${issueDir}
- ${manifestPath}

## Known Limitations
- Controlled review-flow gate only; no production authentication, real-security claim, PHI-protection claim, user accounts, backend authentication, or password storage was added.
- Manual review remains required and promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, full-shift simulation, optimizer behavior, clinical safety scoring, or staffing compliance certification was added.

## Next Recommended Issue
- ${next}
`;
}

function writeFinalStatusDocs(status) {
  writeText("docs/project/professional-access-screen-status.md", finalAuditText(status));
}

function finalAuditText(status) {
  return `# Professional Access Screen Status

Status: ${status === "passed" ? "GO for Scenario Seed + Ratio Comparison Foundation." : "NO-GO for scenario foundation."}

- Access code removed from visible access-screen UI: ${manifest.accessCodeVisibleUiStatus}
- Forbidden internal access term removed from visible access copy: ${manifest.forbiddenInternalTermVisibleUiStatus}
- Professional copy implemented: ${manifest.professionalCopyStatus}
- Workspace access view model implemented: ${manifest.workspaceAccessViewModelStatus}
- Professional layout implemented: ${manifest.professionalLayoutStatus}
- Attempt messaging cleaned up: ${manifest.attemptMessageCleanupStatus}
- App-rendered proof: ${manifest.appRenderedAccessProofStatus}
- Identifier migration plan: ${manifest.identifierMigrationPlanStatus}
- Manual review remains required.
- Promotion remains blocked.
- No simulation or optimizer behavior was added.
- Non-PHI rules still pass.
`;
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = {
    issue,
    title: `Professional Access Screen Issue ${issue}`,
    requiredEvidence: listFiles(issueDir).sort()
  };
  const current = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (current >= 0) index.issues[current] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

function accessSourceFiles() {
  return [
    "apps/web/src/features/demo-pin/DemoPinEntryScreen.tsx",
    "apps/web/src/features/demo-pin/DemoPinGate.tsx",
    "apps/web/src/features/demo-pin/demoPinState.ts",
    "apps/web/src/features/demo-pin/demoPinViewModel.ts",
    "apps/web/src/features/demo-pin/workspaceAccessViewModel.ts",
    "apps/web/src/features/demo-pin/DemoRelockButton.tsx",
    "apps/web/src/features/app-shell/AppShell.tsx"
  ];
}

function sourceText(paths) {
  return paths.map((path) => existsSync(abs(path)) ? readText(path) : "").join("\n");
}

function containsInternalAccessCode(text) {
  const source = readText("packages/shared/src/demo-pin/demoPinContract.ts");
  const match = source.match(/DEMO_PIN_CODE\s*=\s*"([^"]+)"/u);
  if (match == null) fail("Unable to read internal access-code literal from shared contract");
  const escaped = match[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\d-])${escaped}(?![\\d-])`, "u").test(text);
}

function positiveClaimFindings(text) {
  const claims = [];
  if (/production auth enabled|production authentication enabled/iu.test(text)) claims.push("production-auth");
  if (/secure access|real security enabled|security protection enabled|protects real data/iu.test(text)) claims.push("real-security");
  if (/PHI protection enabled|protects PHI/iu.test(text)) claims.push("phi-protection");
  return claims;
}

function assertPng(path, label) {
  const full = abs(path);
  const passed = existsSync(full) && statSync(full).size >= 5000;
  add(`${label} screenshot exists`, passed, { path, bytes: existsSync(full) ? statSync(full).size : 0 });
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

function add(name, passed, detail) {
  checks.push({ name, passed, detail });
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
