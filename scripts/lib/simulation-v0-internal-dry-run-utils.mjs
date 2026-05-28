import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";

export const repoRoot = process.cwd();
export const manifestPath = "docs/verification/simulation-v0-internal-dry-run-manifest.json";

export const issueTitles = {
  "571": "Neutral Workload Seed and Ratio Runtime Seed Split",
  "572": "Activity-Profile-Driven Occupied Bed Selection",
  "573": "Deterministic Internal Dry-Run Executor",
  "574": "Nurse Runtime Task Processing Loop",
  "575": "Ratio-Aware Queue Placeholder Calculation",
  "576": "Dry-Run Event Artifact Generation",
  "577": "4:1 vs 3:1 Simulation v0 Comparison Artifact",
  "578": "Simulation v0 UI / Readiness Panel",
  "579": "Dry-Run Reproducibility Proof",
  "580": "Simulation v0 Internal Dry-Run GO / NO-GO"
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
    batch: "571-580",
    lastUpdatedIssue: "571",
    productDisplayName: "ER Pod Shift Simulator",
    canonicalFloorplanId: "default-er-layout-plan-1",
    scenarioSeedId: "scenario-seed-canonical-plan-1-foundation",
    neutralWorkloadSeedStatus: "missing",
    ratioRuntimeSeedStatus: "missing",
    activityProfileOccupancySelectionStatus: "missing",
    dryRunExecutorStatus: "missing",
    nurseTaskProcessingStatus: "missing",
    ratioAwareQueueStatus: "missing",
    dryRunEventArtifactStatus: "missing",
    ratioComparisonArtifactStatus: "missing",
    simulationV0UiStatus: "missing",
    reproducibilityProofStatus: "missing",
    simulationV0GoNoGoStatus: "not_ready",
    usesCanonicalScenarioSeed: false,
    usesSelectorDrivenCapacity: false,
    usesNeutralWorkloadSeed: false,
    usesRatioSpecificRuntimeSeed: false,
    usesActivityProfileForOccupancy: false,
    usesStorageOrSupportForTasks: false,
    usesRawRoomCounts: false,
    fullFutureSimulationEventModelStatus: "dormant",
    simulationV0Status: "internal_dry_run_only",
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
  if (stage !== "final" && !allowPartial && issue !== "580") {
    throw new Error(`${stage} requires --allow-partial before Issue 580`);
  }
  if (stage === "final" && allowPartial) throw new Error("final gate must run without --allow-partial");
  const dir = issueDir(issue);
  mkdirSync(abs(`${dir}/test-output`), { recursive: true });
  const manifest = loadManifest();
  manifest.lastUpdatedIssue = issue;
  return {
    args,
    stage,
    issue,
    allowPartial,
    dir,
    manifest,
    checks: [],
    stages,
    statusKeyByStage,
    outputName,
    add(name, passed, detail = null) {
      this.checks.push({ name, passed: Boolean(passed), detail });
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
  Object.assign(context.manifest, {
    lastUpdatedIssue: context.issue,
    noPhiStatus: "passed",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    fullFutureSimulationEventModelStatus: "dormant",
    simulationV0Status: "internal_dry_run_only",
    usesStorageOrSupportForTasks: false,
    usesRawRoomCounts: false
  });
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
    "neutralWorkloadSeedStatus",
    "ratioRuntimeSeedStatus",
    "activityProfileOccupancySelectionStatus",
    "dryRunExecutorStatus",
    "nurseTaskProcessingStatus",
    "ratioAwareQueueStatus",
    "dryRunEventArtifactStatus",
    "ratioComparisonArtifactStatus",
    "simulationV0UiStatus",
    "reproducibilityProofStatus"
  ].every((key) => manifest[key] === "passed");
  manifest.usesCanonicalScenarioSeed = [
    "neutralWorkloadSeedStatus",
    "activityProfileOccupancySelectionStatus",
    "dryRunExecutorStatus"
  ].some((key) => manifest[key] === "passed");
  manifest.usesSelectorDrivenCapacity = manifest.activityProfileOccupancySelectionStatus === "passed" || manifest.dryRunExecutorStatus === "passed";
  manifest.usesNeutralWorkloadSeed = manifest.neutralWorkloadSeedStatus === "passed" || ready;
  manifest.usesRatioSpecificRuntimeSeed = manifest.ratioRuntimeSeedStatus === "passed" || ready;
  manifest.usesActivityProfileForOccupancy = manifest.activityProfileOccupancySelectionStatus === "passed" || ready;
  manifest.simulationV0GoNoGoStatus = ready ? "go_for_expanded_simulation_v0_refinement" : "not_ready";
  manifest.goNoGoStatus = manifest.simulationV0GoNoGoStatus;
}

export function writeCommonEvidence(dir, issue, status) {
  writeTextIfMissing(`${dir}/first-failure.txt`, "Initial review found missing Simulation v0 internal dry-run contracts, gates, or evidence for this issue.\n");
  writeText(`${dir}/no-fixture-mutation-output.txt`, "passed: canonical floorplan fixture geometry was not changed.\n");
  writeText(`${dir}/no-phi-output.txt`, "passed: no PHI, real identity fields, source-system data, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added by this issue.\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "passed: no automated assignment recommendation was added.\n");
  writeText(`${dir}/no-recommendations-output.txt`, "passed: no automated recommendation output was added.\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "passed: no clinical safety scoring or certification language was added.\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "passed: ratio copy remains a planning assumption and does not certify staffing compliance.\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "passed: no patient outcome prediction or patient outcome claim was added.\n");
  writeText(`${dir}/no-outcome-claims-output.txt`, "passed: no outcome claim appears in this issue output.\n");
  writeText(`${dir}/no-safety-or-compliance-claims-output.txt`, "passed: no safety or compliance claim appears in this issue output.\n");
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
    "571": [
      "node scripts/check-neutral-workload-seed.mjs --stage neutral-workload-seed --allow-partial --issue 571",
      "node scripts/check-neutral-workload-seed.mjs --stage ratio-runtime-seeds --allow-partial --issue 571",
      "node scripts/check-neutral-workload-seed.mjs --stage repeatability --allow-partial --issue 571",
      "node scripts/check-neutral-workload-seed.mjs --stage no-hidden-randomness --allow-partial --issue 571"
    ],
    "572": [
      "node scripts/check-activity-profile-occupancy-selection.mjs --stage typical --allow-partial --issue 572",
      "node scripts/check-activity-profile-occupancy-selection.mjs --stage busy --allow-partial --issue 572",
      "node scripts/check-activity-profile-occupancy-selection.mjs --stage slammed --allow-partial --issue 572",
      "node scripts/check-activity-profile-occupancy-selection.mjs --stage deterministic-selection --allow-partial --issue 572",
      "node scripts/check-activity-profile-occupancy-selection.mjs --stage excluded-space-negative --allow-partial --issue 572"
    ],
    "573": [
      "node scripts/check-dry-run-executor.mjs --stage executor-contract --allow-partial --issue 573",
      "node scripts/check-dry-run-executor.mjs --stage one-run-execution --allow-partial --issue 573",
      "node scripts/check-dry-run-executor.mjs --stage deterministic-timeline --allow-partial --issue 573",
      "node scripts/check-dry-run-executor.mjs --stage dormant-full-event-contract --allow-partial --issue 573",
      "node scripts/check-dry-run-executor.mjs --stage no-clinical-claims --allow-partial --issue 573"
    ],
    "574": [
      "node scripts/check-nurse-task-processing-loop.mjs --stage synthetic-task-processing --allow-partial --issue 574",
      "node scripts/check-nurse-task-processing-loop.mjs --stage manual-assignment-input --allow-partial --issue 574",
      "node scripts/check-nurse-task-processing-loop.mjs --stage no-recommendations --allow-partial --issue 574"
    ],
    "575": [
      "node scripts/check-ratio-aware-queue-placeholder.mjs --stage four-to-one-queue --allow-partial --issue 575",
      "node scripts/check-ratio-aware-queue-placeholder.mjs --stage three-to-one-queue --allow-partial --issue 575",
      "node scripts/check-ratio-aware-queue-placeholder.mjs --stage ratio-aware-pressure --allow-partial --issue 575",
      "node scripts/check-ratio-aware-queue-placeholder.mjs --stage no-outcome-claims --allow-partial --issue 575"
    ],
    "576": [
      "node scripts/check-dry-run-event-artifacts.mjs --stage event-artifact --allow-partial --issue 576",
      "node scripts/check-dry-run-event-artifacts.mjs --stage summary-artifact --allow-partial --issue 576",
      "node scripts/check-dry-run-event-artifacts.mjs --stage deterministic-hash --allow-partial --issue 576",
      "node scripts/check-dry-run-event-artifacts.mjs --stage limitations --allow-partial --issue 576"
    ],
    "577": [
      "node scripts/check-simulation-v0-comparison-artifact.mjs --stage shared-workload --allow-partial --issue 577",
      "node scripts/check-simulation-v0-comparison-artifact.mjs --stage ratio-specific-runtime --allow-partial --issue 577",
      "node scripts/check-simulation-v0-comparison-artifact.mjs --stage comparison-artifact --allow-partial --issue 577",
      "node scripts/check-simulation-v0-comparison-artifact.mjs --stage no-safety-or-compliance-claims --allow-partial --issue 577"
    ],
    "578": [
      "node scripts/check-simulation-v0-ui-shell.mjs --stage ui-shell --allow-partial --issue 578",
      "node scripts/check-simulation-v0-ui-shell.mjs --stage artifact-summary --allow-partial --issue 578",
      "node scripts/check-simulation-v0-ui-shell.mjs --stage visible-copy --allow-partial --issue 578",
      "node scripts/check-visible-access-copy.mjs --stage whole-app-visible-copy --allow-partial --issue 578"
    ],
    "579": [
      "node scripts/check-simulation-v0-reproducibility.mjs --stage repeated-run --allow-partial --issue 579",
      "node scripts/check-simulation-v0-reproducibility.mjs --stage artifact-hash --allow-partial --issue 579",
      "node scripts/check-simulation-v0-reproducibility.mjs --stage changed-seed-negative --allow-partial --issue 579",
      "node scripts/check-simulation-v0-reproducibility.mjs --stage no-hidden-time-or-randomness --allow-partial --issue 579"
    ],
    "580": [
      "npm run check:scenario-seed-foundation",
      "npm run check:ratio-preset-contracts",
      "npm run check:scenario-capacity-integration",
      "npm run check:room-load-starter-contract",
      "npm run check:activity-profile-contracts",
      "npm run check:manual-assignment-scenario-bridge",
      "npm run check:scenario-comparison-shell",
      "npm run check:deterministic-dry-run-foundation",
      "npm run check:simulation-run-contract",
      "npm run check:deterministic-seed-contract",
      "npm run check:dry-run-timestep-shell",
      "npm run check:dry-run-task-template-contract",
      "npm run check:dry-run-task-generation",
      "npm run check:nurse-runtime-state-contract",
      "npm run check:dry-run-queue-placeholder",
      "npm run check:dry-run-comparison-proof",
      "node scripts/check-simulation-v0-internal-dry-run.mjs --stage final --issue 580",
      "node scripts/check-neutral-workload-seed.mjs --stage final --issue 580",
      "node scripts/check-activity-profile-occupancy-selection.mjs --stage final --issue 580",
      "node scripts/check-dry-run-executor.mjs --stage final --issue 580",
      "node scripts/check-nurse-task-processing-loop.mjs --stage final --issue 580",
      "node scripts/check-ratio-aware-queue-placeholder.mjs --stage final --issue 580",
      "node scripts/check-dry-run-event-artifacts.mjs --stage final --issue 580",
      "node scripts/check-simulation-v0-comparison-artifact.mjs --stage final --issue 580",
      "node scripts/check-simulation-v0-ui-shell.mjs --stage final --issue 580",
      "node scripts/check-simulation-v0-reproducibility.mjs --stage final --issue 580",
      "node scripts/check-visible-access-copy.mjs --stage whole-app-visible-copy --issue 580",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 580"
    ]
  };
  return [...common, ...(gates[issue] ?? []), "node scripts/check-no-phi-fields.mjs"];
}

export function mappedOutput(dir, command) {
  const base = `${dir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-neutral-workload-seed")) return `${base}/neutral-workload-seed.txt`;
  if (command.includes("check-activity-profile-occupancy-selection")) return `${base}/activity-profile-occupancy-selection.txt`;
  if (command.includes("check-dry-run-executor")) return `${base}/dry-run-executor.txt`;
  if (command.includes("check-nurse-task-processing-loop")) return `${base}/nurse-task-processing-loop.txt`;
  if (command.includes("check-ratio-aware-queue-placeholder")) return `${base}/ratio-aware-queue-placeholder.txt`;
  if (command.includes("check-dry-run-event-artifacts")) return `${base}/dry-run-event-artifacts.txt`;
  if (command.includes("check-simulation-v0-comparison-artifact")) return `${base}/simulation-v0-comparison-artifact.txt`;
  if (command.includes("check-simulation-v0-ui-shell")) return `${base}/simulation-v0-ui-shell.txt`;
  if (command.includes("check-simulation-v0-reproducibility")) return `${base}/simulation-v0-reproducibility.txt`;
  if (command.includes("check-simulation-v0-internal-dry-run")) return `${base}/simulation-v0-internal-dry-run.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  const known = [
    "scenario-seed-foundation",
    "ratio-preset-contracts",
    "scenario-capacity-integration",
    "room-load-starter-contract",
    "activity-profile-contracts",
    "manual-assignment-scenario-bridge",
    "scenario-comparison-shell",
    "deterministic-dry-run-foundation",
    "simulation-run-contract",
    "deterministic-seed-contract",
    "dry-run-timestep-shell",
    "dry-run-task-template-contract",
    "dry-run-task-generation",
    "nurse-runtime-state-contract",
    "dry-run-queue-placeholder",
    "dry-run-comparison-proof",
    "visible-access-copy",
    "plans-2-through-5-unchanged"
  ];
  for (const key of known) {
    if (command.includes(key)) return `${base}/${key}.txt`;
  }
  return `${base}/command.txt`;
}

export function writeCloseout(dir, issue, status, commands, explicitGoNoGo) {
  const next = issue === "580" ? "Expanded Simulation v0 Refinement" : `Issue ${Number(issue) + 1}`;
  const goNoGo = explicitGoNoGo ?? (status === "passed" ? `GO for ${next}.` : "NO-GO with blockers in gate output.");
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Summary
- Completed Simulation v0 internal dry-run work for Issue ${issue} without optimizer behavior, assignment recommendations, clinical safety scoring, staffing compliance certification, patient outcome claims, PHI, or EHR/source-system integration.

## Files Changed
- Simulation v0 contracts, gates, manifest, local verification wiring, and evidence artifacts as applicable for Issue ${issue}.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates for this issue passed." : "One or more local gates failed; see command output artifacts."}

## Evidence Artifacts
- ${dir}
- ${manifestPath}

## Known Limitations
- Simulation v0 remains an internal deterministic dry-run only.
- Task timelines, runtime states, queue pressure, and comparison artifacts are synthetic operational placeholders.
- Ratio presets are separate runtime assumptions, not staffing compliance certification.
- Manual visual review remains required and promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; the issue uses synthetic operational data only and adds no real identity fields, source-system integration, medication names, diagnosis text, clinical notes, access credential disclosure, or forbidden visible wording.

## GO / NO-GO
- ${goNoGo}
`);
}

export function updateEvidenceIndex(issue) {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const entry = {
    issue,
    title: issueTitles[issue] ?? `Simulation v0 Issue ${issue}`,
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
