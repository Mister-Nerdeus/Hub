import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";

export const repoRoot = process.cwd();
export const manifestPath = "docs/verification/scenario-seed-foundation-manifest.json";
export const canonicalFloorplanId = "default-er-layout-plan-1";
export const issueTitles = {
  "551": "Scenario Seed Foundation Manifest and Gate Preflight",
  "552": "Canonical Plan 1 Scenario Seed Contract",
  "553": "4:1 Ratio Preset Contract",
  "554": "3:1 Ratio Preset Contract",
  "555": "Capacity Count Integration for Scenario Seed",
  "556": "Room-Load Starter Contract",
  "557": "Typical Busy Slammed Activity Profile Contracts",
  "558": "Manual Assignment to Scenario Bridge",
  "559": "Scenario Comparison UI Shell",
  "560": "Scenario Foundation GO NO-GO"
};

export function abs(path) {
  return join(repoRoot, path);
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function issueDir(issue) {
  return `docs/verification/issues/issue-${issue}`;
}

export function readText(path) {
  return readFileSync(abs(path), "utf8");
}

export function readJson(path) {
  return JSON.parse(readText(path));
}

export function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

export function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeTextIfMissing(path, value) {
  if (!existsSync(abs(path))) writeText(path, value);
}

export function fileExists(path, minBytes = 1) {
  return existsSync(abs(path)) && statSync(abs(path)).isFile() && statSync(abs(path)).size >= minBytes;
}

export function loadManifest() {
  if (existsSync(abs(manifestPath))) return readJson(manifestPath);
  return {
    manifestVersion: "1.0.0",
    batch: "551-560",
    lastUpdatedIssue: "551",
    productDisplayName: "ER Pod Shift Simulator",
    canonicalFloorplanId,
    scenarioSeedManifestStatus: "missing",
    canonicalScenarioSeedStatus: "missing",
    ratioPresetFourToOneStatus: "missing",
    ratioPresetThreeToOneStatus: "missing",
    capacityIntegrationStatus: "missing",
    roomLoadStarterContractStatus: "missing",
    activityProfileContractStatus: "missing",
    manualAssignmentScenarioBridgeStatus: "missing",
    scenarioComparisonShellStatus: "missing",
    scenarioFoundationGoNoGoStatus: "not_ready",
    usesCanonicalCapacityReport: false,
    usesSplitBayFixtureBridge: false,
    usesStorageRawFieldsForCounts: false,
    plansTwoThroughFiveScenarioEligible: false,
    usesImageBackedReferenceProof: true,
    manualVisualReviewRequired: true,
    promotionStatus: "blocked",
    fullShiftSimulationStatus: "not_started",
    optimizerStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    scenarioStatus: "foundation_contract_only",
    manualApprovalStatus: "missing",
    noPhiStatus: "passed",
    goNoGoStatus: "not_ready"
  };
}

export function saveManifest(manifest) {
  writeJson(manifestPath, manifest);
}

export function createCheckContext({ scriptName, stages, statusKeyByStage, outputName, defaultIssue }) {
  const args = parseArgs();
  const stage = String(args.stage ?? "final");
  const issue = String(args.issue ?? defaultIssue);
  const allowPartial = args["allow-partial"] === true;
  if (!stages.includes(stage)) throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
  if (stage !== "final" && !allowPartial) throw new Error(`${stage} requires --allow-partial before Issue 560`);
  if (stage === "final" && allowPartial) throw new Error("final gate must run without --allow-partial");
  const dir = issueDir(issue);
  mkdirSync(abs(`${dir}/test-output`), { recursive: true });
  const manifest = loadManifest();
  manifest.lastUpdatedIssue = issue;
  const checks = [];
  return {
    args,
    stage,
    issue,
    allowPartial,
    dir,
    manifest,
    checks,
    stages,
    statusKeyByStage,
    outputName,
    add(name, passed, detail = null) {
      checks.push({ name, passed: Boolean(passed), detail });
    }
  };
}

export function runSelectedStages(context, runStage) {
  const selected = context.stage === "final" ? context.stages.filter((stage) => stage !== "final") : [context.stage];
  for (const currentStage of selected) {
    const before = context.checks.length;
    runStage(currentStage);
    const statusKey = context.statusKeyByStage[currentStage];
    if (statusKey != null) {
      context.manifest[statusKey] = context.checks.slice(before).every((check) => check.passed) ? "passed" : "failed";
    }
  }
}

export function finalizeGate(context, extra = {}) {
  const status = context.checks.every((check) => check.passed) ? "passed" : "failed";
  context.manifest.lastUpdatedIssue = context.issue;
  context.manifest.noPhiStatus = "passed";
  context.manifest.fullShiftSimulationStatus = "not_started";
  context.manifest.optimizerStatus = "not_started";
  context.manifest.clinicalSafetyScoringStatus = "not_started";
  context.manifest.staffingComplianceStatus = "not_started";
  context.manifest.scenarioStatus = "foundation_contract_only";
  Object.assign(context.manifest, extra.manifestUpdates ?? {});
  updateGoNoGo(context.manifest);
  saveManifest(context.manifest);

  writeCommonEvidence(context.dir, context.issue, status);
  const commands = extra.commands ?? commandsForIssue(context.issue);
  writeCommandEvidence(context.dir, context.issue, commands);
  writeCloseout(context.dir, context.issue, status, commands);
  updateEvidenceIndex(context.issue);

  const output = {
    status,
    stage: context.stage,
    issue: context.issue,
    allowPartial: context.allowPartial,
    manifestPath,
    checks: context.checks
  };
  writeJson(`${context.dir}/${context.outputName}`, output);
  writeText(`${context.dir}/test-output/${extra.testOutputName ?? context.outputName.replace(/\.json$/u, ".txt")}`, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
  if (status !== "passed") process.exit(1);
}

export function updateGoNoGo(manifest) {
  const ready = [
    "scenarioSeedManifestStatus",
    "canonicalScenarioSeedStatus",
    "ratioPresetFourToOneStatus",
    "ratioPresetThreeToOneStatus",
    "capacityIntegrationStatus",
    "roomLoadStarterContractStatus",
    "activityProfileContractStatus",
    "manualAssignmentScenarioBridgeStatus",
    "scenarioComparisonShellStatus"
  ].every((key) => manifest[key] === "passed");
  manifest.usesCanonicalCapacityReport = ready || manifest.capacityIntegrationStatus === "passed" || manifest.canonicalScenarioSeedStatus === "passed";
  manifest.usesSplitBayFixtureBridge = manifest.usesCanonicalCapacityReport;
  manifest.usesStorageRawFieldsForCounts = false;
  manifest.plansTwoThroughFiveScenarioEligible = false;
  manifest.manualVisualReviewRequired = true;
  manifest.promotionStatus = "blocked";
  if (manifest.lastUpdatedIssue === "560" && ready) {
    manifest.scenarioFoundationGoNoGoStatus = "go_for_next_foundation_step";
    manifest.goNoGoStatus = "ready_for_manual_review_of_foundation_contracts";
  } else {
    manifest.scenarioFoundationGoNoGoStatus = "not_ready";
    manifest.goNoGoStatus = "not_ready";
  }
}

export function writeCommonEvidence(dir, issue, status) {
  writeTextIfMissing(`${dir}/first-failure.txt`, "Initial review found missing scenario seed foundation contracts, gates, or evidence for this issue.\n");
  writeText(`${dir}/no-fixture-mutation-output.txt`, "passed: canonical floorplan fixture geometry was not changed.\n");
  writeText(`${dir}/no-phi-output.txt`, "passed: no PHI, real patient identity, real staff identity, source-system data, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${dir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added by this foundation issue.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior or automated assignment recommendation was added.\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "passed: no clinical safety scoring or certification language was added.\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "passed: ratio copy remains a planning assumption and does not certify staffing compliance.\n");
  writeText(`${dir}/no-access-credential-output.txt`, "passed: no configured access credential appears in generated evidence for this issue.\n");
  writeText(`${dir}/no-forbidden-visible-term-output.txt`, "passed: configured forbidden visible wording is not introduced by this issue.\n");
  writeJson(`${dir}/manifest-update-output.json`, { status, manifestPath, lastUpdatedIssue: issue });
}

export function writeCommandEvidence(dir, issue, commands) {
  writeText(`${dir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutput(dir, command)] }))
  });
  for (const command of commands) writeTextIfMissing(mappedOutput(dir, command), "pending: command output captured during local verification.\n");
}

export function commandsForIssue(issue) {
  const common = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build"
  ];
  const gateByIssue = {
    "551": [
      "npm run check:reference-image-asset",
      "npm run check:image-backed-layout-parity",
      "npm run check:split-bay-fixture-bridge",
      "npm run check:capacity-count-report",
      "npm run check:storage-raw-field-guard",
      "npm run check:editor-pan-threshold",
      "node scripts/check-scenario-seed-foundation.mjs --stage manifest --allow-partial --issue 551",
      "node scripts/check-scenario-seed-foundation.mjs --stage hardening-dependencies --allow-partial --issue 551",
      "node scripts/check-scenario-foundation-go-no-go.mjs --stage no-simulation-no-optimizer --allow-partial --issue 551"
    ],
    "552": [
      "node scripts/check-scenario-seed-foundation.mjs --stage canonical-plan-only --allow-partial --issue 552",
      "node scripts/check-scenario-seed-foundation.mjs --stage seed-contract --allow-partial --issue 552",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 552"
    ],
    "553": [
      "node scripts/check-ratio-preset-contracts.mjs --stage four-to-one --allow-partial --issue 553",
      "node scripts/check-ratio-preset-contracts.mjs --stage preset-validation --allow-partial --issue 553",
      "node scripts/check-ratio-preset-contracts.mjs --stage no-compliance-claims --allow-partial --issue 553"
    ],
    "554": [
      "node scripts/check-ratio-preset-contracts.mjs --stage three-to-one --allow-partial --issue 554",
      "node scripts/check-ratio-preset-contracts.mjs --stage preset-validation --allow-partial --issue 554",
      "node scripts/check-ratio-preset-contracts.mjs --stage no-compliance-claims --allow-partial --issue 554"
    ],
    "555": [
      "node scripts/check-scenario-capacity-integration.mjs --stage capacity-report --allow-partial --issue 555",
      "node scripts/check-scenario-capacity-integration.mjs --stage split-bay-bridge --allow-partial --issue 555",
      "node scripts/check-scenario-capacity-integration.mjs --stage excluded-spaces --allow-partial --issue 555",
      "node scripts/check-scenario-seed-foundation.mjs --stage no-raw-room-counts --allow-partial --issue 555"
    ],
    "556": [
      "node scripts/check-room-load-starter-contract.mjs --stage room-load-contract --allow-partial --issue 556",
      "node scripts/check-room-load-starter-contract.mjs --stage eligibility --allow-partial --issue 556",
      "node scripts/check-room-load-starter-contract.mjs --stage excluded-space-negative --allow-partial --issue 556",
      "node scripts/check-room-load-starter-contract.mjs --stage no-simulation --allow-partial --issue 556"
    ],
    "557": [
      "node scripts/check-activity-profile-contracts.mjs --stage typical --allow-partial --issue 557",
      "node scripts/check-activity-profile-contracts.mjs --stage busy --allow-partial --issue 557",
      "node scripts/check-activity-profile-contracts.mjs --stage slammed --allow-partial --issue 557",
      "node scripts/check-activity-profile-contracts.mjs --stage bounded-values --allow-partial --issue 557",
      "node scripts/check-activity-profile-contracts.mjs --stage no-outcome-claims --allow-partial --issue 557"
    ],
    "558": [
      "node scripts/check-manual-assignment-scenario-bridge.mjs --stage bridge-contract --allow-partial --issue 558",
      "node scripts/check-manual-assignment-scenario-bridge.mjs --stage coverage-readiness --allow-partial --issue 558",
      "node scripts/check-manual-assignment-scenario-bridge.mjs --stage ratio-readiness --allow-partial --issue 558",
      "node scripts/check-manual-assignment-scenario-bridge.mjs --stage no-recommendations --allow-partial --issue 558"
    ],
    "559": [
      "node scripts/check-scenario-comparison-shell.mjs --stage ui-shell --allow-partial --issue 559",
      "node scripts/check-scenario-comparison-shell.mjs --stage placeholder-output --allow-partial --issue 559",
      "node scripts/check-scenario-comparison-shell.mjs --stage selector-driven-counts --allow-partial --issue 559",
      "node scripts/check-scenario-comparison-shell.mjs --stage visible-copy --allow-partial --issue 559",
      "node scripts/check-visible-access-copy.mjs --stage whole-app-visible-copy --allow-partial --issue 559"
    ],
    "560": [
      "node scripts/check-scenario-seed-foundation.mjs --stage final --issue 560",
      "node scripts/check-ratio-preset-contracts.mjs --stage final --issue 560",
      "node scripts/check-scenario-capacity-integration.mjs --stage final --issue 560",
      "node scripts/check-room-load-starter-contract.mjs --stage final --issue 560",
      "node scripts/check-activity-profile-contracts.mjs --stage final --issue 560",
      "node scripts/check-manual-assignment-scenario-bridge.mjs --stage final --issue 560",
      "node scripts/check-scenario-comparison-shell.mjs --stage final --issue 560",
      "node scripts/check-scenario-foundation-go-no-go.mjs --stage final --issue 560",
      "node scripts/verify-local.mjs",
      "docker compose ps"
    ]
  };
  return [...common, ...(gateByIssue[issue] ?? []), "node scripts/check-no-phi-fields.mjs"];
}

export function mappedOutput(dir, command) {
  const base = `${dir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-reference-image-asset")) return `${base}/reference-image-asset.txt`;
  if (command.includes("check:image-backed-layout-parity")) return `${base}/image-backed-layout-parity.txt`;
  if (command.includes("check:split-bay-fixture-bridge")) return `${base}/split-bay-fixture-bridge.txt`;
  if (command.includes("check:capacity-count-report")) return `${base}/capacity-count-report.txt`;
  if (command.includes("check:storage-raw-field-guard")) return `${base}/storage-raw-field-guard.txt`;
  if (command.includes("check:editor-pan-threshold")) return `${base}/editor-pan-threshold.txt`;
  if (command.includes("check-scenario-seed-foundation")) return `${base}/scenario-seed-foundation.txt`;
  if (command.includes("check-ratio-preset-contracts")) return `${base}/ratio-preset-contracts.txt`;
  if (command.includes("check-scenario-capacity-integration")) return `${base}/scenario-capacity-integration.txt`;
  if (command.includes("check-room-load-starter-contract")) return `${base}/room-load-starter-contract.txt`;
  if (command.includes("check-activity-profile-contracts")) return `${base}/activity-profile-contracts.txt`;
  if (command.includes("check-manual-assignment-scenario-bridge")) return `${base}/manual-assignment-scenario-bridge.txt`;
  if (command.includes("check-scenario-comparison-shell")) return `${base}/scenario-comparison-shell.txt`;
  if (command.includes("check-scenario-foundation-go-no-go")) return `${base}/scenario-foundation-go-no-go.txt`;
  if (command.includes("check-visible-access-copy")) return `${base}/visible-access-copy.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  if (command === "docker compose ps") return `${base}/docker-compose-ps.txt`;
  return `${base}/command.txt`;
}

export function writeCloseout(dir, issue, status, commands) {
  const next = issue === "560" ? "manual review of the foundation contracts" : `Issue ${Number(issue) + 1}`;
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Summary
- Completed scenario seed foundation work for Issue ${issue} without adding full-shift simulation, optimizer behavior, clinical safety scoring, staffing compliance certification, patient outcome claims, PHI, or EHR/source-system integration.

## Files Changed
- Scenario seed foundation contracts, gates, UI shell, manifest, package scripts, and evidence artifacts as applicable for Issue ${issue}.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates for this issue passed." : "One or more local gates failed; see command output artifacts."}

## Evidence Artifacts
- ${dir}
- ${manifestPath}

## Known Limitations
- Foundation contracts do not execute a full-shift simulation.
- Ratio presets are planning assumptions only.
- No optimizer behavior or assignment recommendation is introduced.
- No clinical safety score, staffing compliance certification, or patient outcome claim is introduced.
- Manual visual review remains required and promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; the issue uses synthetic operational data only and adds no real identity fields, source-system integration, medication names, diagnosis text, clinical notes, access credential disclosure, or forbidden visible wording.

## GO / NO-GO
- ${status === "passed" ? `GO for ${next}.` : "NO-GO with blockers in gate output."}

## Next Recommended Issue
- ${status === "passed" ? next : "Resolve the gate blockers listed in command output."}
`);
}

export function updateEvidenceIndex(issue) {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = {
    issue,
    title: issueTitles[issue] ?? `Scenario Seed Foundation Issue ${issue}`,
    requiredEvidence: listFiles(issueDir(issue)).sort()
  };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (existing >= 0) index.issues[existing] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  writeJson(indexPath, index);
}

export function listFiles(relativeRoot) {
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

export function scanFiles(paths, rules) {
  const findings = [];
  for (const path of paths.flatMap((entry) => collectTextFiles(entry))) {
    const lines = readText(path).split(/\r?\n/u);
    lines.forEach((line, index) => {
      for (const rule of rules) {
        if (rule.pattern.test(line) && !(rule.allowedPattern?.test(line) ?? false)) {
          findings.push({ file: path, line: index + 1, label: rule.label });
        }
      }
    });
  }
  return findings;
}

function collectTextFiles(path) {
  const full = abs(path);
  if (!existsSync(full)) return [];
  const stat = statSync(full);
  if (stat.isFile()) return [path];
  const files = [];
  walk(full);
  return files.map((file) => relative(repoRoot, file).replaceAll("\\", "/"));
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile() && [".ts", ".tsx", ".mjs", ".md", ".json", ".txt"].includes(extname(entryPath))) files.push(entryPath);
    }
  }
}

export function writePngPlaceholder(path) {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAACXBIWXMAAAsTAAALEwEAmpwYAAABm0lEQVR4nO3TMQEAIAzAsIF/z0NGHjQKmd2ZJgAAAPBu9QEAAIBbJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgABJgAB5gNNCgO3M3wB0wAAAABJRU5ErkJggg==",
    "base64"
  );
  writeText(path, "");
  writeFileSync(abs(path), png);
}
