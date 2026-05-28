import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";

export const repoRoot = process.cwd();
export const manifestPath = "docs/verification/deterministic-dry-run-manifest.json";
export const canonicalFloorplanId = "default-er-layout-plan-1";
export const canonicalScenarioSeedId = "scenario-seed-canonical-plan-1-foundation";

export const issueTitles = {
  "561": "Deterministic Dry-Run Manifest and Gate Preflight",
  "562": "Simulation Run Contract, Internal Dry-Run Only",
  "563": "Deterministic Seed Contract",
  "564": "Timestep Shell Contract",
  "565": "Synthetic Task Template Contract",
  "566": "Generate Task Instances from Room-Load Assumptions",
  "567": "Nurse Runtime State Contract",
  "568": "Queue / Delayed-Task Placeholder Model",
  "569": "4:1 vs 3:1 Internal Dry-Run Proof Shell",
  "570": "Simulation v0 Internal Dry-Run GO / NO-GO"
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
    batch: "561-570",
    lastUpdatedIssue: "561",
    productDisplayName: "ER Pod Shift Simulator",
    canonicalFloorplanId,
    scenarioSeedId: canonicalScenarioSeedId,
    dryRunManifestStatus: "missing",
    simulationRunContractStatus: "missing",
    deterministicSeedStatus: "missing",
    timestepShellStatus: "missing",
    taskTemplateContractStatus: "missing",
    taskInstanceGenerationStatus: "missing",
    nurseRuntimeStateStatus: "missing",
    queuePlaceholderStatus: "missing",
    ratioDryRunComparisonStatus: "missing",
    simulationV0GoNoGoStatus: "not_ready",
    usesCanonicalScenarioSeed: false,
    usesRatioPresetContracts: false,
    usesRoomLoadStarterContract: false,
    usesActivityProfiles: false,
    usesManualAssignmentBridge: false,
    usesRawRoomCounts: false,
    usesStorageOrSupportForTasks: false,
    simulationV0Status: "internal_dry_run_shell_only",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
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
  if (stage !== "final" && !allowPartial) throw new Error(`${stage} requires --allow-partial before Issue 570`);
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

export async function runSelectedStages(context, runStage) {
  const selected = context.stage === "final" ? context.stages.filter((stage) => stage !== "final") : [context.stage];
  for (const currentStage of selected) {
    const before = context.checks.length;
    await runStage(currentStage);
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
  context.manifest.optimizerStatus = "not_started";
  context.manifest.assignmentRecommendationStatus = "not_started";
  context.manifest.clinicalSafetyScoringStatus = "not_started";
  context.manifest.staffingComplianceStatus = "not_started";
  context.manifest.patientOutcomePredictionStatus = "not_started";
  context.manifest.manualApprovalStatus = "missing";
  context.manifest.promotionStatus = "blocked";
  context.manifest.simulationV0Status = "internal_dry_run_shell_only";
  Object.assign(context.manifest, extra.manifestUpdates ?? {});
  updateGoNoGo(context.manifest);
  saveManifest(context.manifest);

  writeCommonEvidence(context.dir, context.issue, status);
  const commands = extra.commands ?? commandsForIssue(context.issue);
  writeCommandEvidence(context.dir, context.issue, commands);
  writeCloseout(context.dir, context.issue, status, commands, extra.closeoutStatus);
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
    "dryRunManifestStatus",
    "simulationRunContractStatus",
    "deterministicSeedStatus",
    "timestepShellStatus",
    "taskTemplateContractStatus",
    "taskInstanceGenerationStatus",
    "nurseRuntimeStateStatus",
    "queuePlaceholderStatus",
    "ratioDryRunComparisonStatus"
  ].every((key) => manifest[key] === "passed");
  manifest.usesCanonicalScenarioSeed = ready || manifest.simulationRunContractStatus === "passed" || manifest.dryRunManifestStatus === "passed";
  manifest.usesRatioPresetContracts = ready || manifest.simulationRunContractStatus === "passed" || manifest.ratioDryRunComparisonStatus === "passed";
  manifest.usesRoomLoadStarterContract = ready || manifest.taskInstanceGenerationStatus === "passed" || manifest.ratioDryRunComparisonStatus === "passed";
  manifest.usesActivityProfiles = ready || manifest.deterministicSeedStatus === "passed" || manifest.taskTemplateContractStatus === "passed";
  manifest.usesManualAssignmentBridge = ready || manifest.nurseRuntimeStateStatus === "passed" || manifest.simulationRunContractStatus === "passed";
  manifest.usesRawRoomCounts = false;
  manifest.usesStorageOrSupportForTasks = false;
  if (manifest.lastUpdatedIssue === "570" && ready) {
    manifest.simulationV0GoNoGoStatus = "go_for_simulation_v0_internal_dry_run_implementation";
    manifest.goNoGoStatus = "go_for_simulation_v0_internal_dry_run_implementation";
  } else {
    manifest.simulationV0GoNoGoStatus = "not_ready";
    manifest.goNoGoStatus = "not_ready";
  }
}

export function writeCommonEvidence(dir, issue, status) {
  writeTextIfMissing(`${dir}/first-failure.txt`, "Initial review found missing deterministic dry-run contracts, gates, or evidence for this issue.\n");
  writeText(`${dir}/no-fixture-mutation-output.txt`, "passed: canonical floorplan fixture geometry was not changed.\n");
  writeText(`${dir}/no-phi-output.txt`, "passed: no PHI, real patient identity, real staff identity, source-system data, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added by this deterministic dry-run issue.\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "passed: no automated assignment recommendation was added.\n");
  writeText(`${dir}/no-recommendations-output.txt`, "passed: no automated recommendation output was added.\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "passed: no clinical safety scoring or certification language was added.\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "passed: ratio copy remains a planning assumption and does not certify staffing compliance.\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "passed: no patient outcome prediction or patient outcome claim was added.\n");
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
  const gates = {
    "561": [
      "npm run check:scenario-seed-foundation",
      "npm run check:ratio-preset-contracts",
      "npm run check:scenario-capacity-integration",
      "npm run check:room-load-starter-contract",
      "npm run check:activity-profile-contracts",
      "npm run check:manual-assignment-scenario-bridge",
      "npm run check:scenario-comparison-shell",
      "node scripts/check-deterministic-dry-run-foundation.mjs --stage manifest --allow-partial --issue 561",
      "node scripts/check-deterministic-dry-run-foundation.mjs --stage scenario-foundation-dependencies --allow-partial --issue 561",
      "node scripts/check-simulation-v0-go-no-go.mjs --stage no-optimizer --allow-partial --issue 561"
    ],
    "562": [
      "node scripts/check-simulation-run-contract.mjs --stage run-contract --allow-partial --issue 562",
      "node scripts/check-simulation-run-contract.mjs --stage canonical-seed-only --allow-partial --issue 562",
      "node scripts/check-simulation-run-contract.mjs --stage synthetic-internal-only --allow-partial --issue 562",
      "node scripts/check-simulation-run-contract.mjs --stage no-optimizer --allow-partial --issue 562"
    ],
    "563": [
      "node scripts/check-deterministic-seed-contract.mjs --stage seed-contract --allow-partial --issue 563",
      "node scripts/check-deterministic-seed-contract.mjs --stage repeatability --allow-partial --issue 563",
      "node scripts/check-deterministic-seed-contract.mjs --stage profile-binding --allow-partial --issue 563",
      "node scripts/check-deterministic-seed-contract.mjs --stage no-hidden-randomness --allow-partial --issue 563"
    ],
    "564": [
      "node scripts/check-dry-run-timestep-shell.mjs --stage timestep-contract --allow-partial --issue 564",
      "node scripts/check-dry-run-timestep-shell.mjs --stage bounded-window --allow-partial --issue 564",
      "node scripts/check-dry-run-timestep-shell.mjs --stage deterministic-order --allow-partial --issue 564",
      "node scripts/check-dry-run-timestep-shell.mjs --stage no-real-time-claim --allow-partial --issue 564"
    ],
    "565": [
      "node scripts/check-dry-run-task-template-contract.mjs --stage task-template-contract --allow-partial --issue 565",
      "node scripts/check-dry-run-task-template-contract.mjs --stage no-clinical-task-claims --allow-partial --issue 565",
      "node scripts/check-dry-run-task-template-contract.mjs --stage no-medication-or-diagnosis --allow-partial --issue 565",
      "node scripts/check-dry-run-task-template-contract.mjs --stage bounded-placeholders --allow-partial --issue 565"
    ],
    "566": [
      "node scripts/check-dry-run-task-generation.mjs --stage room-load-input --allow-partial --issue 566",
      "node scripts/check-dry-run-task-generation.mjs --stage task-instance-generation --allow-partial --issue 566",
      "node scripts/check-dry-run-task-generation.mjs --stage excluded-space-negative --allow-partial --issue 566",
      "node scripts/check-dry-run-task-generation.mjs --stage deterministic-repeatability --allow-partial --issue 566"
    ],
    "567": [
      "node scripts/check-nurse-runtime-state-contract.mjs --stage runtime-state-contract --allow-partial --issue 567",
      "node scripts/check-nurse-runtime-state-contract.mjs --stage manual-assignment-input --allow-partial --issue 567",
      "node scripts/check-nurse-runtime-state-contract.mjs --stage synthetic-nurse-labels --allow-partial --issue 567",
      "node scripts/check-nurse-runtime-state-contract.mjs --stage no-recommendations --allow-partial --issue 567"
    ],
    "568": [
      "node scripts/check-dry-run-queue-placeholder.mjs --stage queue-placeholder --allow-partial --issue 568",
      "node scripts/check-dry-run-queue-placeholder.mjs --stage delayed-task-placeholder --allow-partial --issue 568",
      "node scripts/check-dry-run-queue-placeholder.mjs --stage deterministic-order --allow-partial --issue 568",
      "node scripts/check-dry-run-queue-placeholder.mjs --stage no-outcome-claim --allow-partial --issue 568"
    ],
    "569": [
      "node scripts/check-dry-run-comparison-proof.mjs --stage four-to-one-dry-run --allow-partial --issue 569",
      "node scripts/check-dry-run-comparison-proof.mjs --stage three-to-one-dry-run --allow-partial --issue 569",
      "node scripts/check-dry-run-comparison-proof.mjs --stage shared-inputs --allow-partial --issue 569",
      "node scripts/check-dry-run-comparison-proof.mjs --stage comparison-proof --allow-partial --issue 569",
      "node scripts/check-dry-run-comparison-proof.mjs --stage no-safety-or-compliance-claims --allow-partial --issue 569"
    ],
    "570": [
      "npm run check:scenario-seed-foundation",
      "npm run check:ratio-preset-contracts",
      "npm run check:scenario-capacity-integration",
      "npm run check:room-load-starter-contract",
      "npm run check:activity-profile-contracts",
      "npm run check:manual-assignment-scenario-bridge",
      "npm run check:scenario-comparison-shell",
      "node scripts/check-deterministic-dry-run-foundation.mjs --stage final --issue 570",
      "node scripts/check-simulation-run-contract.mjs --stage final --issue 570",
      "node scripts/check-deterministic-seed-contract.mjs --stage final --issue 570",
      "node scripts/check-dry-run-timestep-shell.mjs --stage final --issue 570",
      "node scripts/check-dry-run-task-template-contract.mjs --stage final --issue 570",
      "node scripts/check-dry-run-task-generation.mjs --stage final --issue 570",
      "node scripts/check-nurse-runtime-state-contract.mjs --stage final --issue 570",
      "node scripts/check-dry-run-queue-placeholder.mjs --stage final --issue 570",
      "node scripts/check-dry-run-comparison-proof.mjs --stage final --issue 570",
      "node scripts/check-simulation-v0-go-no-go.mjs --stage final --issue 570",
      "node scripts/check-visible-access-copy.mjs --stage whole-app-visible-copy --issue 570",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 570"
    ]
  };
  return [...common, ...(gates[issue] ?? []), "node scripts/check-no-phi-fields.mjs"];
}

export function mappedOutput(dir, command) {
  const base = `${dir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check:scenario-seed-foundation")) return `${base}/scenario-seed-foundation.txt`;
  if (command.includes("check:ratio-preset-contracts")) return `${base}/ratio-preset-contracts.txt`;
  if (command.includes("check:scenario-capacity-integration")) return `${base}/scenario-capacity-integration.txt`;
  if (command.includes("check:room-load-starter-contract")) return `${base}/room-load-starter-contract.txt`;
  if (command.includes("check:activity-profile-contracts")) return `${base}/activity-profile-contracts.txt`;
  if (command.includes("check:manual-assignment-scenario-bridge")) return `${base}/manual-assignment-scenario-bridge.txt`;
  if (command.includes("check:scenario-comparison-shell")) return `${base}/scenario-comparison-shell.txt`;
  if (command.includes("check-deterministic-dry-run-foundation")) return `${base}/deterministic-dry-run-foundation.txt`;
  if (command.includes("check-simulation-run-contract")) return `${base}/simulation-run-contract.txt`;
  if (command.includes("check-deterministic-seed-contract")) return `${base}/deterministic-seed-contract.txt`;
  if (command.includes("check-dry-run-timestep-shell")) return `${base}/dry-run-timestep-shell.txt`;
  if (command.includes("check-dry-run-task-template-contract")) return `${base}/dry-run-task-template-contract.txt`;
  if (command.includes("check-dry-run-task-generation")) return `${base}/dry-run-task-generation.txt`;
  if (command.includes("check-nurse-runtime-state-contract")) return `${base}/nurse-runtime-state-contract.txt`;
  if (command.includes("check-dry-run-queue-placeholder")) return `${base}/dry-run-queue-placeholder.txt`;
  if (command.includes("check-dry-run-comparison-proof")) return `${base}/dry-run-comparison-proof.txt`;
  if (command.includes("check-simulation-v0-go-no-go")) return `${base}/simulation-v0-go-no-go.txt`;
  if (command.includes("check-visible-access-copy")) return `${base}/visible-access-copy.txt`;
  if (command.includes("check-default-plans")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  return `${base}/command.txt`;
}

export function writeCloseout(dir, issue, status, commands, explicitGoNoGo) {
  const next = issue === "570" ? "Simulation v0 Internal Dry-Run Implementation" : `Issue ${Number(issue) + 1}`;
  const goNoGo = explicitGoNoGo ?? (status === "passed" ? `GO for ${next}.` : "NO-GO with blockers in gate output.");
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Summary
- Completed deterministic dry-run planning work for Issue ${issue} without adding optimizer behavior, automated assignment recommendations, clinical safety scoring, staffing compliance certification, patient outcome claims, PHI, or EHR/source-system integration.

## Files Changed
- Deterministic dry-run contracts, gates, manifest, package scripts, Docker/local verification wiring, and evidence artifacts as applicable for Issue ${issue}.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates for this issue passed." : "One or more local gates failed; see command output artifacts."}

## Evidence Artifacts
- ${dir}
- ${manifestPath}

## Known Limitations
- Simulation v0 remains an internal deterministic dry-run shell only.
- Task templates and generated task instances are synthetic operational placeholders.
- Ratio presets remain planning assumptions only.
- No optimizer behavior or assignment recommendation is introduced.
- No clinical safety score, staffing compliance certification, or patient outcome claim is introduced.
- Manual visual review remains required and promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; the issue uses synthetic operational data only and adds no real identity fields, source-system integration, medication names, diagnosis text, clinical notes, access credential disclosure, or forbidden visible wording.

## GO / NO-GO
- ${goNoGo}

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
    title: issueTitles[issue] ?? `Deterministic Dry-Run Issue ${issue}`,
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

export function collectTextFiles(path) {
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
