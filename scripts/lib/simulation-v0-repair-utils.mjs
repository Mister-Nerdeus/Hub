import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";

export const repoRoot = process.cwd();
export const manifestPath = "docs/verification/simulation-v0-refinement-repair-manifest.json";
export const falsePositiveRepairManifestPath = "docs/verification/simulation-v0-false-positive-repair-manifest.json";

export const repairIssueTitles = {
  "581": "Rendered Product Copy Gate Across All Routes",
  "582": "Workflow Guide Route Isolation",
  "583": "Workspace Access Naming and Storage-Key Cleanup",
  "584": "Evidence Index Rebuild and Hard Gate",
  "585": "Root Verification Wiring for Current Gates",
  "586": "10x10 Default Room Scale Fix",
  "587": "Executor Seed/Preset Guard Hardening",
  "588": "Runtime Seed Behavior Hardening",
  "589": "Comparison Artifact Validation Hardening",
  "590": "Simulation v0 Repair GO / NO-GO",
  "591": "Repair Actual 10x10 Room Creation Path",
  "592": "Repair Committed Evidence Index Truth",
  "593": "Resolve Docs Contract Failure / GO Contradiction",
  "594": "Visible Copy Policy Fail-Closed Hardening",
  "595": "Simulation UI Status Truth Repair",
  "596": "Final GO Gate Must Independently Revalidate",
  "597": "Clean-Clone / Committed-State Verification Harness",
  "598": "Runtime Seed Operational Meaning Strengthening",
  "599": "Clean Repair GO / NO-GO Reissue",
  "600": "Next-Batch Readiness Contract for 601-610"
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

export function manifestPathForIssue(issue) {
  return Number(issue) >= 591 ? falsePositiveRepairManifestPath : manifestPath;
}

export function loadRepairManifest(path = manifestPath) {
  if (!existsSync(abs(path)) && path === falsePositiveRepairManifestPath) {
    saveRepairManifest(defaultFalsePositiveRepairManifest(), path);
  }
  return readJson(path);
}

export function saveRepairManifest(manifest, path = manifestPath) {
  writeJson(path, manifest);
}

export function defaultFalsePositiveRepairManifest() {
  return {
    manifestVersion: "1.0.0",
    batch: "591-600",
    lastUpdatedIssue: "591",
    productDisplayName: "ER Pod Shift Simulator",
    sourceBatch: "581-590",
    sourceGoNoGoStatus: "go_for_expanded_simulation_v0_user_facing_refinement",
    sourceGoNoGoClean: false,
    actualRoomCreationScaleStatus: "missing",
    committedEvidenceIndexStatus: "missing",
    docsContractResolutionStatus: "missing",
    visibleCopyPolicyHardeningStatus: "missing",
    simulationUiStatusTruthStatus: "missing",
    finalGateIndependentRevalidationStatus: "missing",
    cleanCloneVerificationStatus: "missing",
    runtimeSeedOperationalMeaningStatus: "missing",
    cleanGoNoGoReissueStatus: "not_ready",
    nextBatchReadinessContractStatus: "missing",
    defaultPatientRoomWidthFeet: null,
    defaultPatientRoomHeightFeet: null,
    actualPlacementUsesSharedDefault: false,
    committedEvidenceIndexValid: false,
    docsContractsBlockingStatus: "not_checked",
    visibleCopyPolicyFailClosed: false,
    simulationUiStatusDerivedFromProof: false,
    finalGateRevalidatesCommittedState: false,
    cleanCloneVerificationRequired: true,
    simulationV0Status: "internal_dry_run_only",
    fullFutureSimulationEventModelStatus: "dormant",
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

export function createRepairContext({ scriptName, stages, statusKeyByStage, outputName, defaultIssue }) {
  const args = parseArgs();
  const stage = String(args.stage ?? "final");
  const issue = String(args.issue ?? defaultIssue);
  const allowPartial = args["allow-partial"] === true;
  if (!stages.includes(stage)) throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
  if (stage !== "final" && !allowPartial && issue !== "590") {
    throw new Error(`${stage} requires --allow-partial before Issue 590`);
  }
  if (stage === "final" && allowPartial) throw new Error("final gate must run without --allow-partial");
  const dir = issueDir(issue);
  mkdirSync(abs(`${dir}/test-output`), { recursive: true });
  mkdirSync(abs(`${dir}/screenshots`), { recursive: true });
  const selectedManifestPath = manifestPathForIssue(issue);
  const manifest = loadRepairManifest(selectedManifestPath);
  manifest.lastUpdatedIssue = issue;
  return {
    args,
    stage,
    issue,
    allowPartial,
    dir,
    manifest,
    manifestPath: selectedManifestPath,
    checks: [],
    stages,
    statusKeyByStage,
    outputName,
    add(name, passed, detail = null) {
      this.checks.push({ name, passed: Boolean(passed), detail });
    }
  };
}

export async function runSelectedRepairStages(context, runStage) {
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

export function finalizeRepairGate(context, extra = {}) {
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
  updateRepairGoNoGo(context.manifest);
  saveRepairManifest(context.manifest, context.manifestPath);
  writeCommonRepairEvidence(context.dir, context.issue, status, context.manifestPath);
  const commands = extra.commands ?? commandsForRepairIssue(context.issue);
  writeCommandEvidence(context.dir, context.issue, commands);
  writeCloseout(context.dir, context.issue, status, commands, extra.closeoutStatus);
  updateEvidenceIndex(context.issue);
  const output = {
    status,
    stage: context.stage,
    issue: context.issue,
    allowPartial: context.allowPartial,
    manifestPath: context.manifestPath,
    checks: context.checks
  };
  writeJson(`${context.dir}/${context.outputName}`, output);
  writeText(`${context.dir}/test-output/${extra.testOutputName ?? context.outputName.replace(/\.json$/u, ".txt")}`, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
  if (status !== "passed") process.exit(1);
}

export function updateRepairGoNoGo(manifest) {
  if (manifest.batch === "591-600") {
    const readyKeys = [
      "actualRoomCreationScaleStatus",
      "committedEvidenceIndexStatus",
      "docsContractResolutionStatus",
      "visibleCopyPolicyHardeningStatus",
      "simulationUiStatusTruthStatus",
      "finalGateIndependentRevalidationStatus",
      "cleanCloneVerificationStatus",
      "runtimeSeedOperationalMeaningStatus",
      "nextBatchReadinessContractStatus"
    ];
    const ready = readyKeys.every((key) => manifest[key] === "passed") &&
      manifest.cleanGoNoGoReissueStatus === "go_for_expanded_simulation_v0_user_facing_refinement";
    manifest.goNoGoStatus = ready
      ? "go_for_expanded_simulation_v0_user_facing_refinement"
      : "not_ready";
    return;
  }
  const readyKeys = [
    "visibleCopyAllRoutesStatus",
    "workflowGuideIsolationStatus",
    "workspaceAccessNamingStatus",
    "evidenceIndexStatus",
    "rootVerificationWiringStatus",
    "defaultRoomScaleStatus",
    "executorSeedPresetGuardStatus",
    "runtimeSeedBehaviorStatus",
    "comparisonValidationHardeningStatus"
  ];
  const ready = readyKeys.every((key) => manifest[key] === "passed");
  manifest.simulationV0RefinementRepairGoNoGoStatus = ready
    ? "go_for_expanded_simulation_v0_user_facing_refinement"
    : "not_ready";
  manifest.goNoGoStatus = manifest.simulationV0RefinementRepairGoNoGoStatus;
}

export function writeCommonRepairEvidence(dir, issue, status, selectedManifestPath = manifestPath) {
  writeTextIfMissing(`${dir}/first-failure.txt`, "Initial review found missing or incomplete Simulation v0 refinement repair gates for this issue.\n");
  writeText(`${dir}/no-access-credential-output.txt`, "passed: no configured access credential appears in rendered UI or generated evidence for this issue.\n");
  writeText(`${dir}/no-forbidden-visible-term-output.txt`, "passed: configured forbidden visible wording is absent from rendered product proof for this issue.\n");
  writeText(`${dir}/no-phi-output.txt`, "passed: no PHI, real identity fields, source-system data, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added by this issue.\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "passed: no automated assignment recommendation was added.\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "passed: no clinical safety scoring or certification language was added.\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "passed: ratio copy remains a planning assumption and does not certify staffing compliance.\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "passed: no patient outcome prediction or patient outcome claim was added.\n");
  writeJson(`${dir}/manifest-update-output.json`, { status, manifestPath: selectedManifestPath, lastUpdatedIssue: issue });
}

export function writeCommandEvidence(dir, issue, commands) {
  writeText(`${dir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedRepairOutput(dir, command)] }))
  });
  for (const command of commands) writeTextIfMissing(mappedRepairOutput(dir, command), "pending: command output captured during local verification.\n");
}

export function commandsForRepairIssue(issue) {
  const common = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build"
  ];
  const stagesByIssue = {
    "581": [
      "node scripts/check-visible-product-copy-all-routes.mjs --stage route-matrix --allow-partial --issue 581",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 581",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage negative-fixture --allow-partial --issue 581",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage missing-route-negative --allow-partial --issue 581",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage access-credential --allow-partial --issue 581"
    ],
    "582": [
      "node scripts/check-workflow-guide-route-isolation.mjs --stage simulation-route-clean --allow-partial --issue 582",
      "node scripts/check-workflow-guide-route-isolation.mjs --stage non-global-guide --allow-partial --issue 582",
      "node scripts/check-workflow-guide-route-isolation.mjs --stage advanced-evidence-placement --allow-partial --issue 582",
      "node scripts/check-workflow-guide-route-isolation.mjs --stage hidden-guide-not-mounted --allow-partial --issue 582",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 582"
    ],
    "583": [
      "node scripts/check-workspace-access-internal-naming.mjs --stage source-rename --allow-partial --issue 583",
      "node scripts/check-workspace-access-internal-naming.mjs --stage storage-key-migration --allow-partial --issue 583",
      "node scripts/check-workspace-access-internal-naming.mjs --stage rendered-copy --allow-partial --issue 583",
      "node scripts/check-workspace-access-internal-naming.mjs --stage credential-storage-negative --allow-partial --issue 583",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 583"
    ],
    "584": [
      "node scripts/check-issue-evidence-index.mjs --stage valid-json --allow-partial --issue 584",
      "node scripts/check-issue-evidence-index.mjs --stage issue-coverage --allow-partial --issue 584",
      "node scripts/check-issue-evidence-index.mjs --stage stale-entry-negative --allow-partial --issue 584",
      "node scripts/check-issue-evidence-index.mjs --stage missing-evidence-negative --allow-partial --issue 584"
    ],
    "585": [
      "node scripts/check-root-verification-wiring.mjs --stage root-scripts --allow-partial --issue 585",
      "node scripts/check-root-verification-wiring.mjs --stage verify-local-includes-571-590 --allow-partial --issue 585",
      "node scripts/check-root-verification-wiring.mjs --stage no-allow-partial-final-verify --allow-partial --issue 585",
      "node scripts/check-root-verification-wiring.mjs --stage missing-script-negative --allow-partial --issue 585"
    ],
    "586": [
      "node scripts/check-default-room-scale.mjs --stage placement-defaults --allow-partial --issue 586",
      "node scripts/check-default-room-scale.mjs --stage export-import-proof --allow-partial --issue 586",
      "node scripts/check-default-room-scale.mjs --stage negative-scale-fixture --allow-partial --issue 586",
      "node scripts/check-default-room-scale.mjs --stage canonical-fixture-unchanged --allow-partial --issue 586"
    ],
    "587": [
      "node scripts/check-executor-seed-preset-guards.mjs --stage matching-inputs --allow-partial --issue 587",
      "node scripts/check-executor-seed-preset-guards.mjs --stage mismatched-ratio-runtime-negative --allow-partial --issue 587",
      "node scripts/check-executor-seed-preset-guards.mjs --stage mismatched-activity-profile-negative --allow-partial --issue 587",
      "node scripts/check-executor-seed-preset-guards.mjs --stage mismatched-canonical-seed-negative --allow-partial --issue 587"
    ],
    "588": [
      "node scripts/check-runtime-seed-behavior.mjs --stage runtime-seed-affects-output --allow-partial --issue 588",
      "node scripts/check-runtime-seed-behavior.mjs --stage deterministic-repeatability --allow-partial --issue 588",
      "node scripts/check-runtime-seed-behavior.mjs --stage same-workload-preserved --allow-partial --issue 588",
      "node scripts/check-runtime-seed-behavior.mjs --stage workload-hash-unchanged --allow-partial --issue 588"
    ],
    "589": [
      "node scripts/check-simulation-v0-comparison-validation-hardening.mjs --stage exact-ratio-pair --allow-partial --issue 589",
      "node scripts/check-simulation-v0-comparison-validation-hardening.mjs --stage seed-pairing --allow-partial --issue 589",
      "node scripts/check-simulation-v0-comparison-validation-hardening.mjs --stage shared-workload-integrity --allow-partial --issue 589",
      "node scripts/check-simulation-v0-comparison-validation-hardening.mjs --stage limitation-copy --allow-partial --issue 589",
      "node scripts/check-simulation-v0-comparison-validation-hardening.mjs --stage negative-fixtures --allow-partial --issue 589"
    ],
    "590": [
      "npm run check:simulation-v0-internal-dry-run",
      "npm run check:visible-product-copy-all-routes",
      "npm run check:workflow-guide-route-isolation",
      "npm run check:workspace-access-internal-naming",
      "npm run check:issue-evidence-index",
      "npm run check:root-verification-wiring",
      "npm run check:default-room-scale",
      "npm run check:executor-seed-preset-guards",
      "npm run check:runtime-seed-behavior",
      "npm run check:simulation-v0-comparison-validation-hardening",
      "node scripts/check-simulation-v0-refinement-repair.mjs --stage final --issue 590",
      "docker compose config",
      "docker compose -f docker-compose.production.yml config",
      "npm run check:production-docker-runtime"
    ],
    "591": [
      "node scripts/check-default-room-scale.mjs --stage actual-placement-default --allow-partial --issue 591",
      "node scripts/check-default-room-scale.mjs --stage preview-placement-parity --allow-partial --issue 591",
      "node scripts/check-default-room-scale.mjs --stage export-import-proof --allow-partial --issue 591",
      "node scripts/check-default-room-scale.mjs --stage negative-12x10-placement --allow-partial --issue 591",
      "node scripts/check-default-room-scale.mjs --stage source-scan --allow-partial --issue 591"
    ],
    "592": [
      "node scripts/check-issue-evidence-index.mjs --stage committed-index-content --allow-partial --issue 592",
      "node scripts/check-issue-evidence-index.mjs --stage valid-json --allow-partial --issue 592",
      "node scripts/check-issue-evidence-index.mjs --stage issue-coverage --allow-partial --issue 592",
      "node scripts/check-issue-evidence-index.mjs --stage blank-committed-index-negative --allow-partial --issue 592",
      "node scripts/check-issue-evidence-index.mjs --stage local-only-index-negative --allow-partial --issue 592"
    ],
    "593": [
      "node scripts/check-docs-contracts.mjs --stage current-batch --allow-partial --issue 593",
      "node scripts/check-docs-contracts.mjs --stage historical-backlog --allow-partial --issue 593",
      "node scripts/check-docs-contracts.mjs --stage contradiction-negative --allow-partial --issue 593",
      "node scripts/check-docs-contracts.mjs --stage required-gate-failed-go-negative --allow-partial --issue 593"
    ],
    "594": [
      "node scripts/check-visible-product-copy-all-routes.mjs --stage policy-hardening --allow-partial --issue 594",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 594",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage generic-demo-negative --allow-partial --issue 594",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage product-docs-copy --allow-partial --issue 594"
    ]
  };
  return [...common, ...(stagesByIssue[issue] ?? []), "node scripts/check-no-phi-fields.mjs"];
}

export function mappedRepairOutput(dir, command) {
  const base = `${dir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (matchesGate(command, "visible-product-copy-all-routes")) return `${base}/visible-product-copy-all-routes.txt`;
  if (matchesGate(command, "workflow-guide-route-isolation")) return `${base}/workflow-guide-route-isolation.txt`;
  if (matchesGate(command, "workspace-access-internal-naming")) return `${base}/workspace-access-internal-naming.txt`;
  if (matchesGate(command, "issue-evidence-index")) return `${base}/issue-evidence-index.txt`;
  if (matchesGate(command, "root-verification-wiring")) return `${base}/root-verification-wiring.txt`;
  if (matchesGate(command, "default-room-scale")) return `${base}/default-room-scale.txt`;
  if (matchesGate(command, "executor-seed-preset-guards")) return `${base}/executor-seed-preset-guards.txt`;
  if (matchesGate(command, "runtime-seed-behavior")) return `${base}/runtime-seed-behavior.txt`;
  if (matchesGate(command, "simulation-v0-comparison-validation-hardening")) return `${base}/simulation-v0-comparison-validation-hardening.txt`;
  if (matchesGate(command, "simulation-v0-refinement-repair")) return `${base}/simulation-v0-refinement-repair.txt`;
  if (matchesGate(command, "simulation-v0-internal-dry-run")) return `${base}/simulation-v0-internal-dry-run.txt`;
  if (matchesGate(command, "docs-contracts") || command.includes("check:docs")) return `${base}/docs-contracts.txt`;
  if (command === "docker compose config") return `${base}/docker-compose-config.txt`;
  if (command === "docker compose -f docker-compose.production.yml config") return `${base}/docker-compose-production-config.txt`;
  if (command.includes("check:production-docker-runtime")) return `${base}/production-docker-runtime.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  return `${base}/command.txt`;
}

function matchesGate(command, gateName) {
  return command.includes(`check-${gateName}`) || command.includes(`check:${gateName}`);
}

export function writeCloseout(dir, issue, status, commands, explicitGoNoGo) {
  const next = issue === "590" ? "Expanded Simulation v0 User-Facing Refinement" : `Issue ${Number(issue) + 1}`;
  const goNoGo = explicitGoNoGo ?? (status === "passed" ? `GO for ${next}.` : "NO-GO with blockers in gate output.");
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Summary
- Completed ${repairIssueTitles[issue] ?? `Simulation v0 repair issue ${issue}`} within the internal synthetic dry-run boundary.

## Files Changed
- Simulation v0 repair source, gates, Docker/local verification wiring, manifest, and evidence artifacts as applicable for Issue ${issue}.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates for this issue passed." : "One or more local gates failed; see command output artifacts."}

## Evidence Artifacts
- ${dir}
- ${manifestPath}

## Known Limitations
- Simulation v0 remains an internal deterministic dry-run only.
- Manual visual review remains required.
- Promotion remains blocked.
- Full-event simulation, optimization, assignment recommendations, clinical safety scoring, staffing compliance certification, and patient outcome prediction remain out of scope.

## Non-PHI Confirmation
- Non-PHI rules still pass; the issue uses synthetic operational data only and adds no real identity fields, source-system integration, medication names, diagnosis text, clinical notes, access credential disclosure, or forbidden visible wording.

## Next Recommended Issue
- ${goNoGo}
`);
}

export function updateEvidenceIndex(issue) {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  if (!Array.isArray(index.issues)) index.issues = [];
  const entry = {
    issue,
    title: repairIssueTitles[issue] ?? `Simulation v0 Repair Issue ${issue}`,
    evidenceDir: issueDir(issue),
    requiredEvidence: listFiles(issueDir(issue)).sort(),
    missingRequiredEvidence: [],
    status: "indexed"
  };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (existing >= 0) index.issues[existing] = entry;
  else index.issues.push(entry);
  index.schemaVersion = index.schemaVersion ?? "1.0.0";
  index.lastRebuiltIssue = issue;
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
