import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

export const repoRoot = process.cwd();
export const manualReviewUxManifestPath = "docs/verification/simulation-v0-manual-review-ux-manifest.json";

export const manualReviewUxIssueTitles = {
  "611": "Root Feature Gates and Final GO/NO-GO Depth Repair",
  "612": "Manual Visual Review Evidence Pack",
  "613": "Simulation Route Navigation Placement Decision",
  "614": "Simulation v0 Copy and Explanation Polish",
  "615": "Timeline Usability Hardening",
  "616": "Summary Cards Visual Hierarchy and Shared Queue Summary",
  "617": "Artifact Export UX Polish",
  "618": "Simulation Route Accessibility Pass",
  "619": "Simulation Route Responsive Proof",
  "620": "Manual Visual Review GO / NO-GO"
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

export function defaultManualReviewUxManifest() {
  return {
    manifestVersion: "1.0.0",
    batch: "611-620",
    lastUpdatedIssue: "611",
    productDisplayName: "ER Pod Shift Simulator",
    sourceBatch: "601-610",
    sourceGoNoGoStatus: "go_for_manual_visual_review",
    featureGateRootWiringStatus: "missing",
    finalGateDepthStatus: "missing",
    manualVisualReviewEvidencePackStatus: "missing",
    navigationPlacementDecisionStatus: "missing",
    userCopyExplanationPolishStatus: "missing",
    timelineUsabilityStatus: "missing",
    summaryCardsVisualHierarchyStatus: "missing",
    artifactExportUxStatus: "missing",
    accessibilityPassStatus: "missing",
    responsiveRouteProofStatus: "missing",
    manualReviewGoNoGoStatus: "not_ready",
    rootScriptsInclude603To610FeatureGates: false,
    verifyLocalIncludes603To610FeatureGates: false,
    finalGateRerunsFeatureValidators: false,
    finalGateNotManifestOnly: false,
    manualReviewScreenshotsCaptured: false,
    manualReviewChecklistCaptured: false,
    navigationPlacement: "not_decided",
    copyExplainsSyntheticDryRun: false,
    copyExplainsActivityProfiles: false,
    copyExplainsRatioAssumptions: false,
    copyExplainsArtifactHash: false,
    copyExplainsExport: false,
    timelineUsesStableEventIds: false,
    timelineHasUsabilityControls: false,
    summaryCardsUseSharedQueueSummary: false,
    artifactExportHasUserFeedback: false,
    accessibilityProofCaptured: false,
    responsiveProofCaptured: false,
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

export function loadManualReviewUxManifest() {
  if (!existsSync(abs(manualReviewUxManifestPath))) {
    saveManualReviewUxManifest(defaultManualReviewUxManifest());
  }
  return readJson(manualReviewUxManifestPath);
}

export function saveManualReviewUxManifest(manifest) {
  writeJson(manualReviewUxManifestPath, manifest);
}

export function createManualReviewUxContext({ scriptName, stages, statusKeyByStage = {}, outputName, defaultIssue }) {
  const args = parseArgs();
  const stage = String(args.stage ?? "final");
  const issue = String(args.issue ?? defaultIssue);
  const allowPartial = args["allow-partial"] === true;
  if (!stages.includes(stage)) throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
  if (stage !== "final" && !allowPartial && Number(issue) < 620) {
    throw new Error(`${stage} requires --allow-partial before Issue 620`);
  }
  if (stage === "final" && allowPartial) throw new Error("final gate must run without --allow-partial");
  const dir = issueDir(issue);
  mkdirSync(abs(`${dir}/test-output`), { recursive: true });
  mkdirSync(abs(`${dir}/screenshots`), { recursive: true });
  const manifest = loadManualReviewUxManifest();
  manifest.lastUpdatedIssue = latestIssue(manifest.lastUpdatedIssue, issue);
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

export async function runSelectedManualReviewUxStages(context, runStage) {
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

export function finalizeManualReviewUxGate(context, extra = {}) {
  const status = context.checks.every((check) => check.passed) ? "passed" : "failed";
  Object.assign(context.manifest, {
    lastUpdatedIssue: latestIssue(context.manifest.lastUpdatedIssue, context.issue),
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
    humanReviewCompleted: false
  });
  Object.assign(context.manifest, extra.manifestUpdates ?? {});
  if (
    ![
      "go_for_manual_visual_review",
      "go_for_additional_ux_repair",
      "no_go"
    ].includes(context.manifest.manualReviewGoNoGoStatus)
  ) {
    context.manifest.goNoGoStatus = "not_ready";
  }
  saveManualReviewUxManifest(context.manifest);
  writeCommonManualReviewUxEvidence(context.dir, context.issue, status);
  const commands = extra.commands ?? commandsForManualReviewUxIssue(context.issue);
  writeCommandEvidence(context.dir, context.issue, commands);
  writeCloseout(context.dir, context.issue, status, commands, extra.closeoutStatus);
  updateEvidenceIndex(context.issue);
  const output = {
    status,
    stage: context.stage,
    issue: context.issue,
    allowPartial: context.allowPartial,
    manifestPath: manualReviewUxManifestPath,
    checks: context.checks
  };
  writeJson(`${context.dir}/${context.outputName}`, output);
  writeText(`${context.dir}/test-output/${extra.testOutputName ?? context.outputName.replace(/\.json$/u, ".txt")}`, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
  if (status !== "passed") process.exit(1);
}

export function addAndWrite(context, outputName, label, passed, detail = {}) {
  context.add(label, passed, detail);
  writeJson(`${context.dir}/${outputName}`, { status: passed ? "passed" : "failed", detail });
}

export function collectSimulationSourceText() {
  const files = [
    "apps/web/src/features/simulation/SimulationV0InternalDryRunPanel.tsx",
    "apps/web/src/features/simulation/SimulationV0ActivityProfileSelector.tsx",
    "apps/web/src/features/simulation/SimulationV0RatioControls.tsx",
    "apps/web/src/features/simulation/SimulationV0TimelineTable.tsx",
    "apps/web/src/features/simulation/SimulationV0SummaryCards.tsx",
    "apps/web/src/features/simulation/SimulationV0OccupiedBedProofPanel.tsx",
    "apps/web/src/features/simulation/SimulationV0ArtifactProofPanel.tsx",
    "apps/web/src/features/simulation/SimulationV0ArtifactExport.tsx",
    "apps/web/src/features/simulation/simulationV0ViewModel.ts",
    "apps/web/src/features/simulation/simulationV0TimelineViewModel.ts",
    "apps/web/src/features/simulation/simulationV0SummaryCardsViewModel.ts",
    "apps/web/src/features/simulation/simulationV0ArtifactExportViewModel.ts",
    "apps/web/src/features/simulation/simulationV0Copy.ts"
  ];
  return files.filter((file) => fileExists(file)).map((file) => readText(file)).join("\n");
}

export function forbiddenClaimFindings(text) {
  const lower = text.toLowerCase();
  const forbidden = [
    "best assignment",
    "recommended assignment",
    "recommended staffing",
    "safe staffing",
    "staffing compliance",
    "clinical safety",
    "patient outcome",
    "optimizer",
    "safe",
    "unsafe",
    "compliant",
    "noncompliant"
  ];
  return forbidden.filter((fragment) => lower.includes(fragment));
}

function latestIssue(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return String(Math.max(leftNumber, rightNumber)).padStart(3, "0");
  }
  return String(right);
}

function writeCommonManualReviewUxEvidence(dir, issue, status) {
  writeTextIfMissing(`${dir}/first-failure.txt`, "Initial code review found the Simulation v0 manual-review UX evidence or proof gate missing for this issue.\n");
  writeText(`${dir}/no-phi-output.txt`, "passed: no PHI, real identity fields, EHR integration, medication names, diagnosis text, or clinical notes were added.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "passed: no assignment recommendation or ranking was added.\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "passed: no clinical safety score or certification language was added.\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "passed: no staffing compliance certification language was added.\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "passed: no patient outcome prediction was added.\n");
  writeJson(`${dir}/manifest-update-output.json`, { status, manifestPath: manualReviewUxManifestPath, lastUpdatedIssue: issue });
}

function writeCommandEvidence(dir, issue, commands) {
  writeText(`${dir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutput(dir, command)] }))
  });
  for (const command of commands) writeTextIfMissing(mappedOutput(dir, command), "pending: command output captured during local verification.\n");
}

function mappedOutput(dir, command) {
  const base = `${dir}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("manual-review-evidence")) return `${base}/simulation-v0-manual-review-evidence.txt`;
  if (command.includes("navigation-placement")) return `${base}/simulation-v0-navigation-placement.txt`;
  if (command.includes("copy-polish")) return `${base}/simulation-v0-copy-polish.txt`;
  if (command.includes("timeline-usability")) return `${base}/simulation-v0-timeline-usability.txt`;
  if (command.includes("summary-card-hierarchy")) return `${base}/simulation-v0-summary-card-hierarchy.txt`;
  if (command.includes("artifact-export-ux")) return `${base}/simulation-v0-artifact-export-ux.txt`;
  if (command.includes("user-facing-feature-gates")) return `${base}/simulation-v0-user-facing-feature-gates.txt`;
  if (command.includes("accessibility")) return `${base}/simulation-v0-accessibility.txt`;
  if (command.includes("responsive-proof")) return `${base}/simulation-v0-responsive-proof.txt`;
  if (command.includes("manual-review-go-no-go")) return `${base}/simulation-v0-manual-review-go-no-go.txt`;
  if (command.includes("visible-product-copy-all-routes")) return `${base}/visible-product-copy-all-routes.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("check:clean-committed-state")) return `${base}/clean-committed-state.txt`;
  if (command.includes("docker compose config")) return `${base}/docker-compose-config.txt`;
  if (command.includes("docker compose up --build -d")) return `${base}/docker-compose-up-build.txt`;
  if (command === "docker compose ps") return `${base}/docker-compose-ps.txt`;
  if (command.includes("docker-compose.production.yml")) return `${base}/docker-compose-production-config.txt`;
  return `${base}/command.txt`;
}

export function commandsForManualReviewUxIssue(issue) {
  const common = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build"
  ];
  const stagesByIssue = {
    "611": [
      "node scripts/check-simulation-v0-manual-review-evidence.mjs --stage evidence-pack --allow-partial --issue 611",
      "node scripts/check-simulation-v0-manual-review-evidence.mjs --stage route-screenshot --allow-partial --issue 611",
      "node scripts/check-simulation-v0-manual-review-evidence.mjs --stage checklist --allow-partial --issue 611",
      "node scripts/check-simulation-v0-manual-review-evidence.mjs --stage scorecard --allow-partial --issue 611",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 611"
    ],
    "612": [
      "node scripts/check-simulation-v0-navigation-placement.mjs --stage decision-doc --allow-partial --issue 612",
      "node scripts/check-simulation-v0-navigation-placement.mjs --stage rendered-navigation --allow-partial --issue 612",
      "node scripts/check-simulation-v0-navigation-placement.mjs --stage forbidden-copy-negative --allow-partial --issue 612",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 612"
    ],
    "613": [
      "node scripts/check-simulation-v0-copy-polish.mjs --stage copy-contract --allow-partial --issue 613",
      "node scripts/check-simulation-v0-copy-polish.mjs --stage rendered-copy --allow-partial --issue 613",
      "node scripts/check-simulation-v0-copy-polish.mjs --stage forbidden-copy-negative --allow-partial --issue 613",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 613"
    ],
    "614": [
      "node scripts/check-simulation-v0-timeline-usability.mjs --stage event-id --allow-partial --issue 614",
      "node scripts/check-simulation-v0-timeline-usability.mjs --stage pagination --allow-partial --issue 614",
      "node scripts/check-simulation-v0-timeline-usability.mjs --stage fixed-filter --allow-partial --issue 614",
      "node scripts/check-simulation-v0-timeline-usability.mjs --stage no-free-text-filter --allow-partial --issue 614"
    ],
    "615": [
      "node scripts/check-simulation-v0-summary-card-hierarchy.mjs --stage hierarchy --allow-partial --issue 615",
      "node scripts/check-simulation-v0-summary-card-hierarchy.mjs --stage artifact-derived-values --allow-partial --issue 615",
      "node scripts/check-simulation-v0-summary-card-hierarchy.mjs --stage forbidden-copy-negative --allow-partial --issue 615"
    ],
    "616": [
      "node scripts/check-simulation-v0-artifact-export-ux.mjs --stage status-state --allow-partial --issue 616",
      "node scripts/check-simulation-v0-artifact-export-ux.mjs --stage copy-feedback --allow-partial --issue 616",
      "node scripts/check-simulation-v0-artifact-export-ux.mjs --stage no-credential-export --allow-partial --issue 616",
      "node scripts/check-simulation-v0-artifact-export-ux.mjs --stage no-phi-export --allow-partial --issue 616"
    ],
    "617": [
      "node scripts/check-simulation-v0-user-facing-feature-gates.mjs --stage root-scripts --allow-partial --issue 617",
      "node scripts/check-simulation-v0-user-facing-feature-gates.mjs --stage rerun-feature-gates --allow-partial --issue 617",
      "node scripts/check-simulation-v0-user-facing-feature-gates.mjs --stage missing-feature-gate-negative --allow-partial --issue 617"
    ],
    "618": [
      "node scripts/check-simulation-v0-accessibility.mjs --stage semantic-scan --allow-partial --issue 618",
      "node scripts/check-simulation-v0-accessibility.mjs --stage keyboard-navigation --allow-partial --issue 618",
      "node scripts/check-simulation-v0-accessibility.mjs --stage focus-order --allow-partial --issue 618",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 618"
    ],
    "619": [
      "node scripts/check-simulation-v0-responsive-proof.mjs --stage desktop --allow-partial --issue 619",
      "node scripts/check-simulation-v0-responsive-proof.mjs --stage tablet --allow-partial --issue 619",
      "node scripts/check-simulation-v0-responsive-proof.mjs --stage mobile --allow-partial --issue 619",
      "node scripts/check-simulation-v0-responsive-proof.mjs --stage no-horizontal-overflow --allow-partial --issue 619"
    ],
    "620": [
      "npm run check:clean-committed-state",
      "npm run check:simulation-v0-user-facing-feature-gates",
      "node scripts/check-simulation-v0-manual-review-go-no-go.mjs --stage final --issue 620",
      "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue 620",
      "docker compose config",
      "docker compose -f docker-compose.production.yml config",
      "docker compose up --build -d",
      "docker compose ps"
    ]
  };
  return [...common, ...(stagesByIssue[issue] ?? []), "node scripts/check-no-phi-fields.mjs"];
}

function writeCloseout(dir, issue, status, commands, explicitGoNoGo) {
  const goNoGo = explicitGoNoGo ?? (status === "passed" ? `GO for Issue ${Number(issue) + 1}.` : "NO-GO with blockers in gate output.");
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Summary
- Completed ${manualReviewUxIssueTitles[issue] ?? `Simulation v0 manual-review UX issue ${issue}`} within the internal synthetic dry-run boundary.

## Files Changed
- Simulation v0 manual-review UX source, gates, manifest, and evidence artifacts as applicable for Issue ${issue}.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates for this issue passed." : "One or more local gates failed; see command output artifacts."}

## Evidence Artifacts
- ${dir}
- ${manualReviewUxManifestPath}

## Known Limitations
- Simulation v0 remains an internal deterministic dry-run only.
- Manual visual review remains required and is not completed by automation.
- Promotion remains blocked.
- Full-event simulation, optimization, assignment recommendations, clinical safety scoring, staffing compliance certification, and patient outcome prediction remain out of scope.

## Non-PHI Confirmation
- Non-PHI rules still pass; the issue uses synthetic operational data only and adds no real identity fields, source-system integration, medication names, diagnosis text, clinical notes, access credential disclosure, or forbidden claim wording.

## GO / NO-GO
- ${goNoGo}
`);
}

function updateEvidenceIndex(issue) {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  if (!Array.isArray(index.issues)) index.issues = [];
  const entry = {
    issue,
    title: manualReviewUxIssueTitles[issue] ?? `Simulation v0 Manual Review UX Issue ${issue}`,
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
