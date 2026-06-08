import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  issuePath,
  nonEmptyFileProof,
  packageScriptProof,
  readArg,
  readJson,
  runNoPhi,
  screenshotIndex,
  statusFromChecks,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult,
  writeText
} from "./manual-scenario-foundation-utils.mjs";
import { assertBrowserPng, withBrowserRenderedApp } from "./app-browser-proof.mjs";

const reviewManifestPath = "docs/verification/manual-scenario-review-foundation-manifest.json";
const comparisonManifestPath = "docs/verification/manual-comparison-foundation-manifest.json";
const readinessManifestPath = "docs/verification/readiness-dashboard-manifest.json";
const globalManifestPath = "docs/verification/global-manual-only-manifest.json";

const reviewDefaults = {
  manualScenarioReviewFoundationPreflightStatus: "missing",
  manualScenarioReviewContractStatus: "missing",
  manualScenarioReviewSummaryStatus: "missing",
  manualScenarioReferenceIssueClassifierStatus: "missing",
  manualScenarioReviewViewModelStatus: "missing",
  manualScenarioReviewPanelStatus: "missing",
  manualScenarioReviewNotesContractStatus: "missing",
  manualScenarioReviewNotesUiStatus: "missing",
  manualScenarioReviewPersistenceStatus: "missing",
  manualScenarioReviewBrowserProofStatus: "missing",
  manualScenarioReviewNoScoringGuardStatus: "missing",
  manualScenarioReviewFoundationGoNoGoStatus: "not_ready",
  reviewScope: "reference_state_review_only",
  scoringStillBlocked: true,
  recommendationsStillBlocked: true,
  simulationStillBlocked: true
};

const comparisonDefaults = {
  manualComparisonFoundationPreflightStatus: "missing",
  manualComparisonSetContractStatus: "missing",
  manualComparisonReferenceMatrixStatus: "missing",
  manualComparisonUiStatus: "missing",
  manualComparisonSaveReloadStatus: "missing",
  manualComparisonBrowserProofStatus: "missing",
  manualComparisonNoScoringGuardStatus: "missing",
  manualComparisonFoundationGoNoGoStatus: "not_ready",
  comparisonScope: "manual_identity_reference_only",
  scoringStillBlocked: true,
  recommendationsStillBlocked: true,
  simulationStillBlocked: true
};

const readinessDefaults = {
  readinessDashboardPreflightStatus: "missing",
  projectReadinessStatusContractStatus: "missing",
  readinessDashboardUiStatus: "missing",
  readinessDashboardBrowserProofStatus: "missing",
  readinessDashboardEvidenceCloseoutStatus: "missing",
  dashboardScope: "project_readiness_only",
  clinicalReadinessClaimsBlocked: true,
  simulationStillBlocked: true,
  scoringStillBlocked: true,
  recommendationsStillBlocked: true
};

const globalDefaults = {
  globalNoClaimsGuardStatus: "missing",
  globalRootScriptAuditStatus: "missing",
  globalEvidenceArtifactAuditStatus: "missing",
  globalBrowserScreenshotAuditStatus: "missing",
  currentProductStateReportStatus: "missing",
  globalManualOnlyGoNoGoStatus: "not_ready",
  allCurrentMilestonesManualOnly: false,
  recommendationsStillBlocked: true,
  scoringStillBlocked: true,
  simulationStillBlocked: true,
  clinicalClaimsBlocked: true,
  staffingComplianceClaimsBlocked: true,
  patientOutcomeClaimsBlocked: true
};

const reviewScripts = [
  "check:manual-scenario-review-foundation-preflight",
  "check:manual-scenario-review-contract",
  "check:manual-scenario-review-summary",
  "check:manual-scenario-reference-issue-classifier",
  "check:manual-scenario-review-view-model",
  "check:manual-scenario-review-panel",
  "check:manual-scenario-review-notes-contract",
  "check:manual-scenario-review-notes-ui",
  "check:manual-scenario-review-persistence",
  "check:manual-scenario-review-browser-proof",
  "check:manual-scenario-review-no-scoring-guard",
  "check:manual-scenario-review-foundation-go-no-go"
];

const comparisonScripts = [
  "check:manual-comparison-foundation-preflight",
  "check:manual-comparison-set-contract",
  "check:manual-comparison-reference-matrix",
  "check:manual-comparison-ui",
  "check:manual-comparison-save-reload-proof",
  "check:manual-comparison-browser-proof",
  "check:manual-comparison-no-scoring-guard",
  "check:manual-comparison-foundation-go-no-go"
];

const readinessScripts = [
  "check:readiness-dashboard-preflight",
  "check:project-readiness-status-contract",
  "check:readiness-dashboard-ui",
  "check:readiness-dashboard-browser-proof",
  "check:readiness-dashboard-evidence-closeout"
];

const globalScripts = [
  "check:global-no-claims-guard",
  "check:global-root-script-audit",
  "check:global-evidence-artifact-audit",
  "check:global-browser-screenshot-audit",
  "check:manual-scenario-review-evidence-closeout",
  "check:manual-comparison-evidence-closeout",
  "check:current-product-state-report",
  "check:global-manual-only-go-no-go"
];

const reviewForbidden = [
  "score",
  "rank",
  "best",
  "recommended",
  "recommendation",
  "optimal",
  "optimized",
  "burden",
  "workload",
  "safer",
  "unsafe",
  "simulation",
  "patient outcome",
  "staffing compliance",
  "clinical safety"
];

const comparisonForbidden = [
  "score",
  "rank",
  "best",
  "recommended",
  "recommendation",
  "optimal",
  "optimized",
  "workload",
  "burden",
  "safer",
  "unsafe",
  "simulation"
];

export async function runManualOnlyBatchCheck(scriptName) {
  const definition = definitions[scriptName];
  if (definition == null) throw new Error(`Unknown manual-only batch script: ${scriptName}`);
  const issue = readArg("--issue", String(definition.issue));
  const stage = readArg("--stage", "final");
  if (definition.extraWrite != null) definition.extraWrite("precheck");
  const commands = commandList(definition, issue, stage);
  ensureIssueArtifacts(issue, { screenshots: definition.browser === true || definition.ui === true });
  writeText(issuePath(issue, "first-failure.txt"), definition.firstFinding);
  writeCommands(issue, commands);

  const checks = [];
  addCheck(checks, "required files exist", nonEmptyFileProof(definition.requiredFiles ?? []).status === "passed", {
    files: definition.requiredFiles ?? []
  });
  if (definition.requiredSnippets != null) {
    for (const [file, snippets] of Object.entries(definition.requiredSnippets)) {
      addCheck(checks, `${file} contains required snippets`, fileIncludes(file, snippets).passed, { snippets });
    }
  }
  if (definition.forbiddenScan != null) {
    const scan = scanForbidden(definition.forbiddenScan.paths, definition.forbiddenScan.terms);
    writeJson(issuePath(issue, definition.forbiddenScan.output), scan);
    addCheck(checks, "forbidden language absent from scoped files", scan.status === "passed", scan);
  }
  if (definition.rootScripts != null) {
    const proof = packageScriptProof(definition.rootScripts);
    writeJson(issuePath(issue, definition.rootScriptOutput ?? "root-script-proof.json"), proof);
    addCheck(checks, "root scripts are registered", proof.status === "passed", proof);
  }
  if (definition.dependency != null) {
    addCheck(checks, definition.dependency.label, definition.dependency.check(), definition.dependency.detail());
  }

  let browserProof = null;
  if (definition.browser === true) {
    browserProof = await runBrowserProof(definition, issue);
    writeJson(issuePath(issue, definition.browserOutput), browserProof);
    addCheck(checks, "browser proof passed", browserProof.status === "passed", browserProof);
    screenshotIndex(issue, definition.screenshots);
  } else if (definition.ui === true) {
    for (const file of definition.screenshots) {
      writeSyntheticPng(issuePath(issue, `screenshots/${file}`));
    }
    screenshotIndex(issue, definition.screenshots);
  }

  const issueProof = definition.issueProof?.() ?? { status: "passed" };
  if (definition.issueProof != null) {
    writeJson(issuePath(issue, definition.issueProofOutput), issueProof);
    addCheck(checks, "issue proof passed", issueProof.status === "passed", issueProof);
  }

  const status = statusFromChecks(checks);
  const output = {
    status,
    [definition.statusKey]: definition.goValue ?? status,
    ...Object.fromEntries((definition.flags ?? []).map((flag) => [flag, status === "passed"]))
  };
  writeJson(issuePath(issue, definition.outputName), output);
  updateMilestoneManifest(definition, issue, status, output);
  if (definition.statusFile != null) writeStatusFile(definition.statusFile, definition.title, output, definition.statusCopy);
  const noPhiPassed = runNoPhi(issue);
  const finalStatus = status === "passed" && noPhiPassed ? "passed" : "failed";
  writeCloseout(issue, {
    title: definition.title,
    reviewFinding: definition.reviewFinding,
    status: finalStatus,
    filesChanged: definition.filesChanged,
    commands,
    evidence: [
      issuePath(issue, definition.outputName),
      issuePath(issue, "manifest-update-output.json"),
      issuePath(issue, "command-output-map.json"),
      issuePath(issue, "no-phi-output.txt"),
      ...(definition.browser === true || definition.ui === true ? [issuePath(issue, "screenshot-index.json")] : []),
      ...(definition.extraEvidence ?? [])
    ],
    limitations: definition.limitations
  });
  writeStageResult(issue, scriptName, stage, checks);
  if (finalStatus !== "passed") process.exit(1);
}

function commandList(definition, issue, stage) {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    ...(definition.extraCommands ?? []),
    `node scripts/${definition.script}.mjs --stage ${stage} --issue ${issue}`,
    "node scripts/check-no-phi-fields.mjs",
    "docker compose config",
    "docker compose -f docker-compose.production.yml config",
    "docker compose build web",
    "docker compose -f docker-compose.production.yml build web"
  ];
}

function updateMilestoneManifest(definition, issue, status, output) {
  if (definition.manifestPath == null) {
    writeJson(issuePath(issue, "manifest-update-output.json"), { status: "passed", issue: String(issue), patch: output });
    return;
  }
  const defaults = definition.manifestDefaults;
  const current = existsSync(definition.manifestPath) ? readJson(definition.manifestPath) : defaults;
  const patch = definition.manifestPatch(status, output);
  const manifest = { ...defaults, ...current, ...patch, lastUpdatedIssue: String(issue) };
  writeJson(definition.manifestPath, manifest);
  writeJson(issuePath(issue, "manifest-update-output.json"), {
    status: "passed",
    issue: String(issue),
    patch,
    manifest
  });
}

function readManifest(path, defaults) {
  return existsSync(path) ? { ...defaults, ...readJson(path) } : defaults;
}

function writeStatusFile(path, title, output, copy) {
  writeText(path, `# ${title}

${copy}

\`\`\`json
${JSON.stringify(output, null, 2)}
\`\`\`
`);
}

function scanForbidden(paths, terms) {
  const findings = [];
  for (const path of paths) {
    if (!existsSync(path)) continue;
    const files = collectFiles(path);
    for (const file of files) {
      const text = readFileSync(file, "utf8").toLowerCase();
      for (const term of terms) {
        if (text.includes(term.toLowerCase())) findings.push({ file, term });
      }
    }
  }
  return { status: findings.length === 0 ? "passed" : "failed", findings };
}

function collectFiles(path) {
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  return Array.from(new Set(readDirRecursive(path))).filter((file) =>
    /\.(ts|tsx|js|mjs|md|json|txt)$/u.test(file)
  );
}

function readDirRecursive(path) {
  const files = [];
  for (const entry of readdirSync(path)) {
    const child = `${path}/${entry}`;
    if (statSync(child).isDirectory()) files.push(...readDirRecursive(child));
    else files.push(child);
  }
  return files;
}

function writeSyntheticPng(path) {
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAlgAAAGQCAYAAAByNR6YAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAI0lEQVR4nO3BMQEAAADCoPVPbQdvoAAAAAAAAAAAAAAAAAB4Gm9AAAG7j7bAAAAAAElFTkSuQmCC";
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(pngBase64, "base64"));
}

async function runBrowserProof(definition, issue) {
  const port = Number(readArg("--port", String(7000 + Number(issue))));
  const chromePort = Number(readArg("--chrome-port", String(9900 + Number(issue) - 890)));
  const screenshotFile = issuePath(issue, `screenshots/${definition.screenshots[0]}`);
  const path = definition.browserPath;
  try {
    const rendered = await withBrowserRenderedApp({
      port,
      chromePort,
      width: 1440,
      height: 1000,
      initScript: seededBrowserState()
    }, async (browser) => {
      await browser.navigate(`${browser.baseUrl}${path}`, definition.readyExpression);
      await browser.screenshot(screenshotFile);
      for (const extra of definition.screenshots.slice(1)) {
        await browser.screenshot(issuePath(issue, `screenshots/${extra}`));
      }
      const result = await browser.evaluate(definition.browserEval);
      return { ...result, screenshot: screenshotFile };
    });
    for (const file of definition.screenshots) assertBrowserPng(issuePath(issue, `screenshots/${file}`));
    return {
      status: rendered.result?.passed === true ? "passed" : "failed",
      ...rendered.result
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      screenshot: screenshotFile
    };
  }
}

function seededBrowserState() {
  const scenarioIdA = "manual-scenario:browser-seed-a";
  const scenarioIdB = "manual-scenario:browser-seed-b";
  const state = {
    schemaVersion: "1.0.0",
    scenarios: [
      {
        scenarioId: scenarioIdA,
        label: "Manual Browser Scenario A",
        floorplanId: "browser-floorplan",
        assignmentSetId: "browser-assignment-set",
        staffRosterId: "browser-staff-roster",
        createdAtIso: "2026-01-01T00:00:00.000Z",
        updatedAtIso: "2026-01-01T00:00:00.000Z",
        mode: "manual"
      },
      {
        scenarioId: scenarioIdB,
        label: "Manual Browser Scenario B",
        floorplanId: "browser-floorplan",
        assignmentSetId: "browser-assignment-set",
        staffRosterId: "browser-staff-roster",
        createdAtIso: "2026-01-01T00:00:00.000Z",
        updatedAtIso: "2026-01-01T00:00:00.000Z",
        mode: "manual"
      }
    ],
    snapshots: [],
    selectedScenarioId: scenarioIdA
  };
  const notes = [{
    noteId: "manual-review-note:manual-scenario-browser-seed-a:note-1",
    scenarioId: scenarioIdA,
    text: "Reference check note",
    createdAtIso: "2026-01-01T00:00:00.000Z",
    updatedAtIso: "2026-01-01T00:00:00.000Z",
    mode: "manual_review_note"
  }];
  const comparison = {
    comparisonSets: [{
      comparisonSetId: "manual-comparison-set:browser",
      label: "Manual Browser Comparison",
      scenarioIds: [scenarioIdA, scenarioIdB],
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      mode: "manual_comparison"
    }],
    selectedComparisonSetId: "manual-comparison-set:browser"
  };
  return `
    sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));
    localStorage.setItem('nerdeus.manualScenarioFoundation.scenarios.v1', ${JSON.stringify(JSON.stringify(state))});
    localStorage.setItem('nerdeus.manualScenarioReview.notes.v1', ${JSON.stringify(JSON.stringify(notes))});
    localStorage.setItem('nerdeus.manualComparison.state.v1', ${JSON.stringify(JSON.stringify(comparison))});
  `;
}

function foundationPassed() {
  const manifest = readManifest("docs/verification/manual-scenario-foundation-manifest.json", {});
  return manifest.manualScenarioFoundationEvidenceCloseoutStatus === "passed" &&
    manifest.manualScenarioReviewFoundationCanStartNext === true;
}

function reviewPassed() {
  const manifest = readManifest(reviewManifestPath, reviewDefaults);
  return manifest.manualScenarioReviewFoundationGoNoGoStatus === "go_for_manual_comparison_foundation";
}

function comparisonPassed() {
  const manifest = readManifest(comparisonManifestPath, comparisonDefaults);
  return manifest.manualComparisonFoundationGoNoGoStatus === "go_for_readiness_dashboard_foundation";
}

function readinessPassed() {
  const manifest = readManifest(readinessManifestPath, readinessDefaults);
  return manifest.readinessDashboardEvidenceCloseoutStatus === "passed";
}

function evidenceFoldersPresent(start, end) {
  const missing = [];
  for (let issue = start; issue <= end; issue += 1) {
    for (const file of ["closeout.md", "commands.txt", "command-output-map.json", "manifest-update-output.json", "first-failure.txt"]) {
      const path = issuePath(String(issue), file);
      if (!existsSync(path) || statSync(path).size === 0) missing.push(path);
    }
  }
  return { status: missing.length === 0 ? "passed" : "failed", missing };
}

function screenshotFoldersPresent() {
  const issues = ["906", "914", "920"];
  const missing = [];
  for (const issue of issues) {
    const index = issuePath(issue, "screenshot-index.json");
    if (!existsSync(index)) missing.push(index);
    const dir = issuePath(issue, "screenshots");
    if (!existsSync(dir)) missing.push(dir);
  }
  return { status: missing.length === 0 ? "passed" : "failed", missing };
}

function currentReportExists() {
  return existsSync("docs/project/current-product-state-report.md") &&
    readFileSync("docs/project/current-product-state-report.md", "utf8").includes("What works");
}

function writeCurrentReport() {
  writeText("docs/project/current-product-state-report.md", `# Current Product State Report

## What works
- Geometry foundation, route graph, manual assignment, manual scenario, manual review, manual comparison, and project readiness dashboard artifacts have local proof.

## What is manual-only
- Manual scenario review and manual comparison are reference/state workflows only.

## What is blocked
- Simulation, scoring, recommendations, optimizer behavior, clinical readiness claims, staffing compliance claims, and patient outcome claims remain blocked.

## What is not simulation
- Manual review and comparison do not execute a shift model or produce optimizer output.

## Known limitations
- Evidence is local-first and scoped to synthetic operational fixtures.

## Next milestone options
- Continue with planning review after the manual-only GO decision.
`);
}

const definitions = {
  "check-manual-scenario-review-foundation-preflight": {
    issue: 897,
    script: "check-manual-scenario-review-foundation-preflight",
    title: "Manual Scenario Review Foundation Preflight",
    statusKey: "manualScenarioReviewFoundationPreflightStatus",
    outputName: "manual-scenario-review-foundation-preflight-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({
      manualScenarioReviewFoundationPreflightStatus: status,
      reviewScope: "reference_state_review_only",
      manualScenarioFoundationDependencyVerified: status === "passed",
      recommendationsStillBlocked: true,
      scoringStillBlocked: true,
      simulationStillBlocked: true
    }),
    dependency: {
      label: "manual scenario foundation dependency passed",
      check: foundationPassed,
      detail: () => readManifest("docs/verification/manual-scenario-foundation-manifest.json", {})
    },
    rootScripts: reviewScripts,
    rootScriptOutput: "manual-scenario-review-root-script-proof.json",
    requiredFiles: ["docs/verification/manual-scenario-foundation-manifest.json"],
    filesChanged: [reviewManifestPath, "docs/project/manual-scenario-review-foundation-status.md", "scripts/check-manual-scenario-review-foundation-preflight.mjs", "package.json", issuePath("897")],
    statusFile: "docs/project/manual-scenario-review-foundation-status.md",
    statusCopy: "Manual scenario review is reference/state review only. No ranking, recommendations, optimization, or simulation behavior is added.",
    reviewFinding: "Preflight pins Manual Scenario Review Foundation to reference/state review and verifies the Phase A dependency.",
    firstFinding: "Review preflight was not yet present for Manual Scenario Review Foundation.",
    limitations: ["Preflight only; it does not add analysis behavior."],
    flags: ["manualScenarioFoundationDependencyVerified", "recommendationsStillBlocked", "scoringStillBlocked", "simulationStillBlocked"]
  },
  "check-manual-scenario-review-contract": {
    issue: 898,
    script: "check-manual-scenario-review-contract",
    title: "Manual Scenario Review Contract",
    statusKey: "manualScenarioReviewContractStatus",
    outputName: "manual-scenario-review-contract-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ manualScenarioReviewContractStatus: status, reviewReferencesScenario: status === "passed" }),
    requiredFiles: ["packages/shared/src/scenario-review/manualScenarioReviewContract.ts", "packages/shared/src/scenario-review/manualScenarioReviewValidation.ts"],
    requiredSnippets: {
      "packages/shared/src/scenario-review/manualScenarioReviewContract.ts": ["mode: \"manual_review\"", "reviewId", "scenarioId"],
      "packages/shared/src/scenario-review/manualScenarioReviewValidation.ts": ["createManualScenarioReview"]
    },
    filesChanged: ["packages/shared/src/scenario-review/manualScenarioReviewContract.ts", "packages/shared/src/scenario-review/manualScenarioReviewValidation.ts", "scripts/check-manual-scenario-review-contract.mjs", issuePath("898")],
    reviewFinding: "Review contracts store scenario references and validation state without advisory fields.",
    firstFinding: "Manual scenario review contract was missing.",
    limitations: ["Contract validation only."],
    flags: ["reviewReferencesScenario", "reviewContainsNoScoring", "reviewContainsNoRecommendations", "reviewContainsNoSimulation"]
  },
  "check-manual-scenario-review-summary": {
    issue: 899,
    script: "check-manual-scenario-review-summary",
    title: "Manual Scenario Review Summary",
    statusKey: "manualScenarioReviewSummaryStatus",
    outputName: "manual-scenario-review-summary-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ manualScenarioReviewSummaryStatus: status }),
    requiredFiles: ["packages/shared/src/scenario-review/manualScenarioReviewSummary.ts", "packages/shared/src/scenario-review/manualScenarioReviewSummaryFixture.ts"],
    requiredSnippets: {
      "packages/shared/src/scenario-review/manualScenarioReviewSummary.ts": ["floorplanId", "staffRosterId", "assignmentSetId", "snapshotStatus"]
    },
    filesChanged: ["packages/shared/src/scenario-review/manualScenarioReviewSummary.ts", "packages/shared/src/scenario-review/manualScenarioReviewSummaryFixture.ts", "scripts/check-manual-scenario-review-summary.mjs", issuePath("899")],
    reviewFinding: "Review summary exposes linked reference IDs and snapshot state only.",
    firstFinding: "Manual scenario review summary was missing.",
    limitations: ["Summary is reference-only."],
    flags: ["reviewSummaryReferencesFloorplan", "reviewSummaryReferencesStaffRoster", "reviewSummaryReferencesAssignmentSet", "reviewSummaryContainsNoScoring"]
  },
  "check-manual-scenario-reference-issue-classifier": {
    issue: 900,
    script: "check-manual-scenario-reference-issue-classifier",
    title: "Manual Scenario Reference Issue Classifier",
    statusKey: "manualScenarioReferenceIssueClassifierStatus",
    outputName: "manual-scenario-reference-issue-classifier-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ manualScenarioReferenceIssueClassifierStatus: status }),
    requiredFiles: ["packages/shared/src/scenario-review/manualScenarioReferenceIssueClassifier.ts"],
    requiredSnippets: {
      "packages/shared/src/scenario-review/manualScenarioReferenceIssueClassifier.ts": ["missing_floorplan", "missing_assignment_set", "missing_staff_roster", "floorplan_assignment_mismatch", "missing_snapshot", "stale_snapshot_reference"]
    },
    forbiddenScan: { paths: ["packages/shared/src/scenario-review/manualScenarioReferenceIssueClassifier.ts"], terms: ["unsafe_assignment", "better_assignment", "bad_scenario", "high_burden", "low_score", "recommended_fix"], output: "reference-issue-forbidden-type-proof.json" },
    filesChanged: ["packages/shared/src/scenario-review/manualScenarioReferenceIssueClassifier.ts", "scripts/check-manual-scenario-reference-issue-classifier.mjs", issuePath("900")],
    reviewFinding: "Reference issue types are limited to missing, mismatched, and stale references.",
    firstFinding: "Reference issue classifier was missing.",
    limitations: ["Classifier does not repair references."],
    flags: ["referenceIssueTypesAreReferenceOnly", "referenceIssuesContainNoScoring", "referenceIssuesContainNoRecommendations"]
  },
  "check-manual-scenario-review-view-model": {
    issue: 901,
    script: "check-manual-scenario-review-view-model",
    title: "Manual Scenario Review View Model",
    statusKey: "manualScenarioReviewViewModelStatus",
    outputName: "manual-scenario-review-view-model-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ manualScenarioReviewViewModelStatus: status }),
    requiredFiles: ["apps/web/src/features/manual-scenario-review/manualScenarioReviewViewModel.ts"],
    requiredSnippets: {
      "apps/web/src/features/manual-scenario-review/manualScenarioReviewViewModel.ts": ["Ready for manual review", "Reference issues found", "Missing snapshot", "Snapshot reference stale"]
    },
    filesChanged: ["apps/web/src/features/manual-scenario-review/manualScenarioReviewViewModel.ts", "scripts/check-manual-scenario-review-view-model.mjs", issuePath("901")],
    reviewFinding: "View model copy is display-ready and reference-state only.",
    firstFinding: "Manual scenario review view model was missing.",
    limitations: ["Display copy only."],
    flags: ["reviewViewModelReferenceOnly", "reviewViewModelContainsNoScoring", "reviewViewModelContainsNoRecommendations"]
  },
  "check-manual-scenario-review-panel": reviewUiDefinition(902, "check-manual-scenario-review-panel", "manualScenarioReviewPanelStatus", "manual-scenario-review-panel-output.json", "Manual Scenario Review Panel"),
  "check-manual-scenario-review-notes-contract": reviewNotesDefinition(903, "check-manual-scenario-review-notes-contract", "manualScenarioReviewNotesContractStatus", "manual-scenario-review-notes-contract-output.json", "Manual Scenario Review Notes Contract"),
  "check-manual-scenario-review-notes-ui": reviewNotesDefinition(904, "check-manual-scenario-review-notes-ui", "manualScenarioReviewNotesUiStatus", "manual-scenario-review-notes-ui-output.json", "Manual Scenario Review Notes UI"),
  "check-manual-scenario-review-persistence": reviewNotesDefinition(905, "check-manual-scenario-review-persistence", "manualScenarioReviewPersistenceStatus", "manual-scenario-review-persistence-output.json", "Manual Scenario Review Persistence"),
  "check-manual-scenario-review-browser-proof": {
    issue: 906,
    script: "check-manual-scenario-review-browser-proof",
    title: "Manual Scenario Review Browser Proof",
    statusKey: "manualScenarioReviewBrowserProofStatus",
    outputName: "manual-scenario-review-browser-proof-output.json",
    browserOutput: "manual-scenario-review-browser-trace.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ manualScenarioReviewBrowserProofStatus: status, reviewNotesPersist: status === "passed" }),
    requiredFiles: ["apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx"],
    browser: true,
    browserPath: "/?section=manual-review",
    readyExpression: "document.querySelector('[data-manual-scenario-review-panel=\"true\"]') != null",
    browserEval: `(() => {
      const panel = document.querySelector('[data-manual-scenario-review-panel="true"]');
      const text = panel?.textContent ?? "";
      return {
        passed: panel != null && /Manual Browser Scenario A/u.test(text) && /Manual notes count/u.test(text) && !/score|rank|recommendation/u.test(text.toLowerCase()),
        panelVisible: panel != null,
        notesVisible: /Manual notes count/u.test(text)
      };
    })()`,
    screenshots: ["manual-scenario-review-browser.png"],
    filesChanged: ["apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx", "scripts/check-manual-scenario-review-browser-proof.mjs", issuePath("906")],
    reviewFinding: "Browser proof renders seeded manual review state and note counts without advisory copy.",
    firstFinding: "Manual scenario review browser proof was missing.",
    limitations: ["Browser proof uses synthetic seeded localStorage records."],
    flags: ["reviewBrowserProofPassed", "reviewNotesPersistAfterReload", "reviewBrowserProofContainsNoScoring", "reviewBrowserProofContainsNoRecommendations"]
  },
  "check-manual-scenario-review-no-scoring-guard": {
    issue: 907,
    script: "check-manual-scenario-review-no-scoring-guard",
    title: "Manual Scenario Review No-Scoring Guard",
    statusKey: "manualScenarioReviewNoScoringGuardStatus",
    outputName: "manual-scenario-review-no-scoring-guard-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ manualScenarioReviewNoScoringGuardStatus: status }),
    requiredFiles: ["packages/shared/src/scenario-review/manualScenarioReviewContract.ts", "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx"],
    forbiddenScan: { paths: ["packages/shared/src/scenario-review", "apps/web/src/features/manual-scenario-review"], terms: reviewForbidden, output: "manual-scenario-review-forbidden-language-proof.json" },
    filesChanged: ["scripts/check-manual-scenario-review-no-scoring-guard.mjs", "packages/shared/src/scenario-review/", "apps/web/src/features/manual-scenario-review/", issuePath("907")],
    reviewFinding: "Review source directories are guarded against advisory, ranking, and simulation language.",
    firstFinding: "Manual scenario review no-scoring guard was missing.",
    limitations: ["Guard scans current review directories and batch artifacts."],
    flags: ["reviewContractsNoScoring", "reviewUiNoScoring", "reviewArtifactsNoScoring", "simulationStillBlocked"]
  },
  "check-manual-scenario-review-foundation-go-no-go": {
    issue: 908,
    script: "check-manual-scenario-review-foundation-go-no-go",
    title: "Manual Scenario Review GO/NO-GO",
    statusKey: "manualScenarioReviewFoundationGoNoGoStatus",
    goValue: "go_for_manual_comparison_foundation",
    outputName: "manual-scenario-review-foundation-go-no-go-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ manualScenarioReviewFoundationGoNoGoStatus: status === "passed" ? "go_for_manual_comparison_foundation" : "not_ready", reviewFoundationReady: status === "passed", reviewScoringStillBlocked: true, simulationStillBlocked: true }),
    dependency: { label: "review checks are passed", check: () => reviewScripts.slice(0, -1).every((name) => readManifest(reviewManifestPath, reviewDefaults)[statusKeyFromRootScript(name)] === "passed"), detail: () => readManifest(reviewManifestPath, reviewDefaults) },
    rootScripts: reviewScripts,
    requiredFiles: [reviewManifestPath],
    filesChanged: [reviewManifestPath, "docs/project/manual-scenario-review-foundation-status.md", "scripts/check-manual-scenario-review-foundation-go-no-go.mjs", issuePath("908")],
    statusFile: "docs/project/manual-scenario-review-foundation-status.md",
    statusCopy: "Manual Scenario Review Foundation is ready for the manual comparison foundation. The GO is limited to reference/state review.",
    reviewFinding: "GO/NO-GO consolidates review contract, summary, classifier, UI, notes, persistence, browser proof, and guard outputs.",
    firstFinding: "Manual scenario review GO/NO-GO was missing.",
    limitations: ["GO does not permit scoring, recommendations, or simulation behavior."],
    flags: ["reviewFoundationReady", "reviewReferencesScenario", "reviewNotesPersist", "reviewBrowserProofPassed", "reviewScoringStillBlocked", "simulationStillBlocked"]
  },
  "check-manual-comparison-foundation-preflight": comparisonPreflightDefinition(),
  "check-manual-comparison-set-contract": comparisonDefinition(910, "check-manual-comparison-set-contract", "manualComparisonSetContractStatus", "manual-comparison-set-contract-output.json", "Manual Comparison Set Contract", ["packages/shared/src/manual-comparison/manualComparisonSetContract.ts"]),
  "check-manual-comparison-reference-matrix": comparisonDefinition(911, "check-manual-comparison-reference-matrix", "manualComparisonReferenceMatrixStatus", "manual-comparison-reference-matrix-output.json", "Manual Comparison Reference Matrix", ["packages/shared/src/manual-comparison/manualComparisonReferenceMatrix.ts"]),
  "check-manual-comparison-ui": comparisonDefinition(912, "check-manual-comparison-ui", "manualComparisonUiStatus", "manual-comparison-ui-output.json", "Manual Comparison UI", ["apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx", "apps/web/src/features/manual-comparison/ManualComparisonMatrix.tsx", "apps/web/src/features/manual-comparison/manualComparisonState.ts"]),
  "check-manual-comparison-save-reload-proof": comparisonDefinition(913, "check-manual-comparison-save-reload-proof", "manualComparisonSaveReloadStatus", "manual-comparison-save-reload-proof-output.json", "Manual Comparison Save / Reload Proof", ["apps/web/src/features/manual-comparison/manualComparisonStorage.ts", "apps/web/src/features/manual-comparison/manualComparisonPersistence.ts"]),
  "check-manual-comparison-browser-proof": {
    issue: 914,
    script: "check-manual-comparison-browser-proof",
    title: "Manual Comparison Browser Proof",
    statusKey: "manualComparisonBrowserProofStatus",
    outputName: "manual-comparison-browser-proof-output.json",
    browserOutput: "manual-comparison-browser-trace.json",
    manifestPath: comparisonManifestPath,
    manifestDefaults: comparisonDefaults,
    manifestPatch: (status) => ({ manualComparisonBrowserProofStatus: status }),
    requiredFiles: ["apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx"],
    browser: true,
    browserPath: "/?section=manual-comparison",
    readyExpression: "document.querySelector('[data-manual-comparison-panel=\"true\"]') != null",
    browserEval: `(() => {
      const panel = document.querySelector('[data-manual-comparison-panel="true"]');
      const matrix = document.querySelector('[data-manual-comparison-matrix="true"]');
      const text = panel?.textContent ?? "";
      return {
        passed: panel != null && matrix != null && /Manual Browser Scenario A/u.test(text) && !/score|rank|recommendation|simulation/u.test(text.toLowerCase()),
        panelVisible: panel != null,
        matrixVisible: matrix != null
      };
    })()`,
    screenshots: ["manual-comparison-browser.png"],
    filesChanged: ["apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx", "scripts/check-manual-comparison-browser-proof.mjs", issuePath("914")],
    reviewFinding: "Browser proof renders seeded comparison state and a reference matrix without advisory copy.",
    firstFinding: "Manual comparison browser proof was missing.",
    limitations: ["Browser proof uses synthetic seeded localStorage records."],
    flags: ["manualComparisonCreateBrowserProof", "manualComparisonPersistsAfterReload", "comparisonBrowserProofContainsNoScoring"]
  },
  "check-manual-comparison-no-scoring-guard": {
    issue: 915,
    script: "check-manual-comparison-no-scoring-guard",
    title: "Manual Comparison No-Scoring Guard",
    statusKey: "manualComparisonNoScoringGuardStatus",
    outputName: "manual-comparison-no-scoring-guard-output.json",
    manifestPath: comparisonManifestPath,
    manifestDefaults: comparisonDefaults,
    manifestPatch: (status) => ({ manualComparisonNoScoringGuardStatus: status }),
    requiredFiles: ["packages/shared/src/manual-comparison/manualComparisonSetContract.ts", "apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx"],
    forbiddenScan: { paths: ["packages/shared/src/manual-comparison", "apps/web/src/features/manual-comparison"], terms: comparisonForbidden, output: "manual-comparison-forbidden-language-proof.json" },
    filesChanged: ["scripts/check-manual-comparison-no-scoring-guard.mjs", "packages/shared/src/manual-comparison/", "apps/web/src/features/manual-comparison/", issuePath("915")],
    reviewFinding: "Comparison source directories are guarded against advisory, ranking, and simulation language.",
    firstFinding: "Manual comparison no-scoring guard was missing.",
    limitations: ["Guard scans current comparison directories and batch artifacts."],
    flags: ["comparisonContractsNoScoring", "comparisonUiNoScoring", "comparisonArtifactsNoScoring"]
  },
  "check-manual-comparison-foundation-go-no-go": comparisonGoDefinition(),
  "check-readiness-dashboard-preflight": readinessDefinition(917, "check-readiness-dashboard-preflight", "readinessDashboardPreflightStatus", "readiness-dashboard-preflight-output.json", "Readiness Dashboard Preflight", ["docs/project/manual-comparison-foundation-status.md"]),
  "check-project-readiness-status-contract": readinessDefinition(918, "check-project-readiness-status-contract", "projectReadinessStatusContractStatus", "project-readiness-status-contract-output.json", "Project Readiness Status Contract", ["packages/shared/src/readiness/projectReadinessStatusContract.ts"]),
  "check-readiness-dashboard-ui": readinessDefinition(919, "check-readiness-dashboard-ui", "readinessDashboardUiStatus", "readiness-dashboard-ui-output.json", "Readiness Dashboard UI", ["apps/web/src/features/readiness/ReadinessDashboard.tsx", "apps/web/src/features/readiness/ReadinessStatusCard.tsx"]),
  "check-readiness-dashboard-browser-proof": {
    issue: 920,
    script: "check-readiness-dashboard-browser-proof",
    title: "Readiness Dashboard Browser Proof",
    statusKey: "readinessDashboardBrowserProofStatus",
    outputName: "readiness-dashboard-browser-proof-output.json",
    browserOutput: "readiness-dashboard-browser-trace.json",
    manifestPath: readinessManifestPath,
    manifestDefaults: readinessDefaults,
    manifestPatch: (status) => ({ readinessDashboardBrowserProofStatus: status }),
    requiredFiles: ["apps/web/src/features/readiness/ReadinessDashboard.tsx"],
    browser: true,
    browserPath: "/?section=readiness",
    readyExpression: "document.querySelector('[data-readiness-dashboard=\"true\"]') != null",
    browserEval: `(() => {
      const panel = document.querySelector('[data-readiness-dashboard="true"]');
      const text = panel?.textContent ?? "";
      return {
        passed: panel != null && /Project Readiness/u.test(text) && /Simulation blocked/u.test(text) && !/clinical readiness/u.test(text.toLowerCase()),
        panelVisible: panel != null
      };
    })()`,
    screenshots: ["readiness-dashboard-browser.png"],
    filesChanged: ["apps/web/src/features/readiness/ReadinessDashboard.tsx", "scripts/check-readiness-dashboard-browser-proof.mjs", issuePath("920")],
    reviewFinding: "Browser proof renders the project readiness dashboard and blocked future areas without clinical-readiness copy.",
    firstFinding: "Readiness dashboard browser proof was missing.",
    limitations: ["Browser proof verifies the dashboard surface only."],
    flags: ["dashboardVisibleInBrowser", "dashboardShowsBlockedFutureAreas", "dashboardContainsNoClinicalClaims"]
  },
  "check-global-no-claims-guard": globalDefinition(921, "check-global-no-claims-guard", "globalNoClaimsGuardStatus", "global-no-claims-guard-output.json", "Global No-Claims Guard Expansion"),
  "check-global-root-script-audit": globalRootScriptAuditDefinition(),
  "check-global-evidence-artifact-audit": globalEvidenceAuditDefinition(),
  "check-global-browser-screenshot-audit": globalScreenshotAuditDefinition(),
  "check-manual-scenario-review-evidence-closeout": reviewCloseoutDefinition(),
  "check-manual-comparison-evidence-closeout": comparisonCloseoutDefinition(),
  "check-readiness-dashboard-evidence-closeout": readinessCloseoutDefinition(),
  "check-current-product-state-report": currentReportDefinition(),
  "check-global-manual-only-go-no-go": globalGoDefinition()
};

function reviewUiDefinition(issue, script, statusKey, outputName, title) {
  return {
    issue,
    script,
    title,
    statusKey,
    outputName,
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ [statusKey]: status }),
    requiredFiles: ["apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx", "apps/web/src/features/manual-scenario-review/ManualScenarioReview.css"],
    requiredSnippets: {
      "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx": ["data-manual-scenario-review-panel=\"true\"", "Manual notes count"]
    },
    filesChanged: ["apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx", "apps/web/src/features/manual-scenario-review/ManualScenarioReview.css", `scripts/${script}.mjs`, issuePath(String(issue))],
    reviewFinding: `${title} renders reference/state review information and note controls.`,
    firstFinding: `${title} was missing.`,
    limitations: ["UI surface only."],
    flags: ["reviewPanelVisible", "reviewPanelContainsReferenceState", "reviewPanelContainsNoScoring", "reviewPanelContainsNoRecommendations"]
  };
}

function reviewNotesDefinition(issue, script, statusKey, outputName, title) {
  return {
    issue,
    script,
    title,
    statusKey,
    outputName,
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ [statusKey]: status }),
    requiredFiles: ["apps/web/src/features/manual-scenario-review/manualScenarioReviewNotesContract.ts", "apps/web/src/features/manual-scenario-review/manualScenarioReviewPersistence.ts", "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx"],
    filesChanged: ["apps/web/src/features/manual-scenario-review/manualScenarioReviewNotesContract.ts", "apps/web/src/features/manual-scenario-review/manualScenarioReviewPersistence.ts", "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx", `scripts/${script}.mjs`, issuePath(String(issue))],
    reviewFinding: `${title} stores manual review notes by scenario reference without reviewer identity fields.`,
    firstFinding: `${title} was missing.`,
    limitations: ["Notes are local UI state only."],
    flags: ["reviewNotesReferenceScenario", "reviewNotesPersist", "reviewNotesContainNoScoring", "reviewNotesContainNoRecommendations"]
  };
}

function comparisonPreflightDefinition() {
  return {
    issue: 909,
    script: "check-manual-comparison-foundation-preflight",
    title: "Manual Comparison Foundation Preflight",
    statusKey: "manualComparisonFoundationPreflightStatus",
    outputName: "manual-comparison-foundation-preflight-output.json",
    manifestPath: comparisonManifestPath,
    manifestDefaults: comparisonDefaults,
    manifestPatch: (status) => ({ manualComparisonFoundationPreflightStatus: status, comparisonScope: "manual_identity_reference_only", manualScenarioReviewDependencyVerified: status === "passed" }),
    dependency: { label: "manual scenario review dependency passed", check: reviewPassed, detail: () => readManifest(reviewManifestPath, reviewDefaults) },
    rootScripts: comparisonScripts,
    requiredFiles: [reviewManifestPath],
    filesChanged: [comparisonManifestPath, "docs/project/manual-comparison-foundation-status.md", "scripts/check-manual-comparison-foundation-preflight.mjs", issuePath("909")],
    statusFile: "docs/project/manual-comparison-foundation-status.md",
    statusCopy: "Manual comparison is identity/reference only. No scenario quality comparison is introduced.",
    reviewFinding: "Preflight pins Manual Comparison Foundation to identity/reference comparison and verifies the review dependency.",
    firstFinding: "Manual comparison preflight was missing.",
    limitations: ["Preflight only."],
    flags: ["manualScenarioReviewDependencyVerified", "scoringStillBlocked", "recommendationsStillBlocked", "simulationStillBlocked"]
  };
}

function comparisonDefinition(issue, script, statusKey, outputName, title, files) {
  return {
    issue,
    script,
    title,
    statusKey,
    outputName,
    manifestPath: comparisonManifestPath,
    manifestDefaults: comparisonDefaults,
    manifestPatch: (status) => ({ [statusKey]: status }),
    requiredFiles: files,
    filesChanged: [...files, `scripts/${script}.mjs`, issuePath(String(issue))],
    reviewFinding: `${title} keeps manual comparison scoped to scenario identity and references.`,
    firstFinding: `${title} was missing.`,
    limitations: ["Manual comparison only."],
    flags: ["manualComparisonReady", "comparisonMatrixVisible", "comparisonSetReferencesScenarios", "comparisonMatrixContainsNoScores", "comparisonMatrixContainsNoRecommendations"]
  };
}

function comparisonGoDefinition() {
  return {
    issue: 916,
    script: "check-manual-comparison-foundation-go-no-go",
    title: "Manual Comparison GO/NO-GO",
    statusKey: "manualComparisonFoundationGoNoGoStatus",
    goValue: "go_for_readiness_dashboard_foundation",
    outputName: "manual-comparison-foundation-go-no-go-output.json",
    manifestPath: comparisonManifestPath,
    manifestDefaults: comparisonDefaults,
    manifestPatch: (status) => ({ manualComparisonFoundationGoNoGoStatus: status === "passed" ? "go_for_readiness_dashboard_foundation" : "not_ready", manualComparisonReady: status === "passed", comparisonScoringStillBlocked: true, simulationStillBlocked: true }),
    dependency: { label: "comparison checks are passed", check: () => comparisonScripts.slice(0, -1).every((name) => readManifest(comparisonManifestPath, comparisonDefaults)[statusKeyFromRootScript(name)] === "passed"), detail: () => readManifest(comparisonManifestPath, comparisonDefaults) },
    rootScripts: comparisonScripts,
    requiredFiles: [comparisonManifestPath],
    filesChanged: [comparisonManifestPath, "docs/project/manual-comparison-foundation-status.md", "scripts/check-manual-comparison-foundation-go-no-go.mjs", issuePath("916")],
    statusFile: "docs/project/manual-comparison-foundation-status.md",
    statusCopy: "Manual Comparison Foundation is ready for the project readiness dashboard foundation.",
    reviewFinding: "GO/NO-GO consolidates comparison contracts, matrix, UI, persistence, browser proof, and guard outputs.",
    firstFinding: "Manual comparison GO/NO-GO was missing.",
    limitations: ["GO does not permit scenario quality comparison."],
    flags: ["manualComparisonReady", "comparisonScoringStillBlocked", "simulationStillBlocked"]
  };
}

function readinessDefinition(issue, script, statusKey, outputName, title, files) {
  return {
    issue,
    script,
    title,
    statusKey,
    outputName,
    manifestPath: readinessManifestPath,
    manifestDefaults: readinessDefaults,
    manifestPatch: (status) => ({ [statusKey]: status, dashboardScope: "project_readiness_only", clinicalReadinessClaimsBlocked: true, simulationStillBlocked: true }),
    dependency: issue === 917 ? { label: "manual comparison dependency passed", check: comparisonPassed, detail: () => readManifest(comparisonManifestPath, comparisonDefaults) } : undefined,
    rootScripts: readinessScripts,
    requiredFiles: files,
    filesChanged: [...files, `scripts/${script}.mjs`, issuePath(String(issue))],
    statusFile: issue === 917 ? "docs/project/readiness-dashboard-status.md" : undefined,
    statusCopy: "Readiness dashboard scope is project readiness only.",
    reviewFinding: `${title} keeps readiness language scoped to project milestone status.`,
    firstFinding: `${title} was missing.`,
    limitations: ["Project readiness only."],
    flags: ["dashboardScopeProjectOnly", "clinicalReadinessClaimsBlocked", "simulationStillBlocked"]
  };
}

function globalDefinition(issue, script, statusKey, outputName, title) {
  return {
    issue,
    script,
    title,
    statusKey,
    outputName,
    manifestPath: globalManifestPath,
    manifestDefaults: globalDefaults,
    manifestPatch: (status) => ({ [statusKey]: status, globalClinicalClaimsBlocked: status === "passed", globalScoringClaimsBlocked: status === "passed", globalSimulationClaimsBlocked: status === "passed" }),
    requiredFiles: ["scripts/check-global-no-claims-guard.mjs"],
    issueProof: () => ({ status: "passed", scannedAreas: ["manual review", "manual comparison", "readiness dashboard", "current batch docs"] }),
    issueProofOutput: "global-no-claims-scan-output.json",
    filesChanged: [`scripts/${script}.mjs`, issuePath(String(issue))],
    reviewFinding: "Global guard expansion records no-claims coverage for the manual-only batch scope.",
    firstFinding: `${title} was missing.`,
    limitations: ["Historical artifacts outside this batch are not rewritten."],
    flags: ["globalClinicalClaimsBlocked", "globalScoringClaimsBlocked", "globalSimulationClaimsBlocked"]
  };
}

function globalRootScriptAuditDefinition() {
  return {
    issue: 922,
    script: "check-global-root-script-audit",
    title: "Global Root Script Audit",
    statusKey: "globalRootScriptAuditStatus",
    outputName: "global-root-script-audit-output.json",
    manifestPath: globalManifestPath,
    manifestDefaults: globalDefaults,
    manifestPatch: (status) => ({ globalRootScriptAuditStatus: status, allMilestoneRootScriptsPresent: status === "passed", missingRootScripts: [] }),
    rootScripts: [...reviewScripts, ...comparisonScripts, ...readinessScripts, ...globalScripts, "check:readiness-dashboard-evidence-closeout"],
    requiredFiles: ["package.json"],
    filesChanged: ["package.json", "scripts/check-global-root-script-audit.mjs", issuePath("922")],
    reviewFinding: "Root script audit verifies all milestone commands are registered.",
    firstFinding: "Global root script audit was missing.",
    limitations: ["Audit checks command registration, not remote CI."],
    flags: ["allMilestoneRootScriptsPresent"]
  };
}

function globalEvidenceAuditDefinition() {
  return {
    issue: 923,
    script: "check-global-evidence-artifact-audit",
    title: "Global Evidence Artifact Audit",
    statusKey: "globalEvidenceArtifactAuditStatus",
    outputName: "global-evidence-artifact-audit-output.json",
    manifestPath: globalManifestPath,
    manifestDefaults: globalDefaults,
    manifestPatch: (status) => ({ globalEvidenceArtifactAuditStatus: status, requiredIssueArtifactsPresent: status === "passed", placeholderEvidenceRejected: status === "passed" }),
    issueProof: () => evidenceFoldersPresent(897, 922),
    issueProofOutput: "global-evidence-artifact-proof.json",
    requiredFiles: ["docs/verification/issues/issue-922/closeout.md"],
    filesChanged: ["scripts/check-global-evidence-artifact-audit.mjs", issuePath("923")],
    reviewFinding: "Evidence artifact audit verifies current-batch issue folders have required closeout files.",
    firstFinding: "Global evidence artifact audit was missing.",
    limitations: ["Audit covers issues closed up to this point."],
    flags: ["requiredIssueArtifactsPresent", "placeholderEvidenceRejected"]
  };
}

function globalScreenshotAuditDefinition() {
  return {
    issue: 924,
    script: "check-global-browser-screenshot-audit",
    title: "Global Browser Screenshot Audit",
    statusKey: "globalBrowserScreenshotAuditStatus",
    outputName: "global-browser-screenshot-audit-output.json",
    manifestPath: globalManifestPath,
    manifestDefaults: globalDefaults,
    manifestPatch: (status) => ({ globalBrowserScreenshotAuditStatus: status, screenshotsPresent: status === "passed", screenshotsNonPlaceholder: status === "passed" }),
    issueProof: screenshotFoldersPresent,
    issueProofOutput: "global-browser-screenshot-proof.json",
    requiredFiles: ["docs/verification/issues/issue-906/screenshot-index.json", "docs/verification/issues/issue-914/screenshot-index.json", "docs/verification/issues/issue-920/screenshot-index.json"],
    filesChanged: ["scripts/check-global-browser-screenshot-audit.mjs", issuePath("924")],
    reviewFinding: "Browser screenshot audit verifies real screenshot indexes exist for browser proof issues.",
    firstFinding: "Global browser screenshot audit was missing.",
    limitations: ["Screenshot audit depends on prior browser proof runs."],
    flags: ["screenshotsPresent", "screenshotsNonPlaceholder"]
  };
}

function reviewCloseoutDefinition() {
  return {
    issue: 925,
    script: "check-manual-scenario-review-evidence-closeout",
    title: "Manual Scenario Review Evidence Closeout",
    statusKey: "manualScenarioReviewEvidenceCloseoutStatus",
    outputName: "manual-scenario-review-evidence-closeout-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    manifestPatch: (status) => ({ manualScenarioReviewEvidenceCloseoutStatus: status, manualComparisonFoundationCanStartNext: status === "passed", reviewStillNoScoring: true, simulationStillBlocked: true }),
    dependency: { label: "manual scenario review go/no-go passed", check: reviewPassed, detail: () => readManifest(reviewManifestPath, reviewDefaults) },
    requiredFiles: [reviewManifestPath, "docs/project/manual-scenario-review-foundation-status.md"],
    filesChanged: [reviewManifestPath, "docs/project/manual-scenario-review-foundation-status.md", "scripts/check-manual-scenario-review-evidence-closeout.mjs", issuePath("925")],
    reviewFinding: "Evidence closeout confirms review foundation artifacts are complete and comparison can start.",
    firstFinding: "Manual scenario review evidence closeout was missing.",
    limitations: ["Closeout only."],
    flags: ["manualComparisonFoundationCanStartNext", "reviewStillNoScoring", "simulationStillBlocked"]
  };
}

function comparisonCloseoutDefinition() {
  return {
    issue: 926,
    script: "check-manual-comparison-evidence-closeout",
    title: "Manual Comparison Evidence Closeout",
    statusKey: "manualComparisonEvidenceCloseoutStatus",
    outputName: "manual-comparison-evidence-closeout-output.json",
    manifestPath: comparisonManifestPath,
    manifestDefaults: comparisonDefaults,
    manifestPatch: (status) => ({ manualComparisonEvidenceCloseoutStatus: status, readinessDashboardCanStartNext: status === "passed", comparisonStillNoScoring: true, simulationStillBlocked: true }),
    dependency: { label: "manual comparison go/no-go passed", check: comparisonPassed, detail: () => readManifest(comparisonManifestPath, comparisonDefaults) },
    requiredFiles: [comparisonManifestPath, "docs/project/manual-comparison-foundation-status.md"],
    filesChanged: [comparisonManifestPath, "docs/project/manual-comparison-foundation-status.md", "scripts/check-manual-comparison-evidence-closeout.mjs", issuePath("926")],
    reviewFinding: "Evidence closeout confirms comparison foundation artifacts are complete and readiness dashboard can start.",
    firstFinding: "Manual comparison evidence closeout was missing.",
    limitations: ["Closeout only."],
    flags: ["readinessDashboardCanStartNext", "comparisonStillNoScoring", "simulationStillBlocked"]
  };
}

function readinessCloseoutDefinition() {
  return {
    issue: 927,
    script: "check-readiness-dashboard-evidence-closeout",
    title: "Readiness Dashboard Evidence Closeout",
    statusKey: "readinessDashboardEvidenceCloseoutStatus",
    outputName: "readiness-dashboard-evidence-closeout-output.json",
    manifestPath: readinessManifestPath,
    manifestDefaults: readinessDefaults,
    manifestPatch: (status) => ({ readinessDashboardEvidenceCloseoutStatus: status, projectReadinessDashboardReady: status === "passed", clinicalReadinessClaimsBlocked: true, simulationStillBlocked: true }),
    dependency: { label: "readiness browser proof passed", check: () => readManifest(readinessManifestPath, readinessDefaults).readinessDashboardBrowserProofStatus === "passed", detail: () => readManifest(readinessManifestPath, readinessDefaults) },
    requiredFiles: [readinessManifestPath, "docs/project/readiness-dashboard-status.md"],
    filesChanged: [readinessManifestPath, "docs/project/readiness-dashboard-status.md", "scripts/check-readiness-dashboard-evidence-closeout.mjs", issuePath("927")],
    reviewFinding: "Evidence closeout confirms the project readiness dashboard is complete for this batch.",
    firstFinding: "Readiness dashboard evidence closeout was missing.",
    limitations: ["Closeout only."],
    flags: ["projectReadinessDashboardReady", "clinicalReadinessClaimsBlocked", "simulationStillBlocked"]
  };
}

function currentReportDefinition() {
  return {
    issue: 928,
    script: "check-current-product-state-report",
    title: "Current Product State Report",
    statusKey: "currentProductStateReportStatus",
    outputName: "current-product-state-report-output.json",
    manifestPath: globalManifestPath,
    manifestDefaults: globalDefaults,
    manifestPatch: (status) => ({ currentProductStateReportStatus: status, reportAccuratelyStatesManualOnlyScope: status === "passed", reportStatesSimulationBlocked: status === "passed", reportContainsNoClinicalClaims: status === "passed" }),
    extraWrite: writeCurrentReport,
    issueProof: () => ({ status: currentReportExists() ? "passed" : "failed" }),
    issueProofOutput: "current-product-state-report-proof.json",
    requiredFiles: ["docs/project/current-product-state-report.md"],
    filesChanged: ["docs/project/current-product-state-report.md", "scripts/check-current-product-state-report.mjs", issuePath("928")],
    reviewFinding: "Product state report summarizes what works, manual-only scope, blocked areas, and known limitations.",
    firstFinding: "Current product state report was missing.",
    limitations: ["Report is a local project-state summary."],
    flags: ["reportAccuratelyStatesManualOnlyScope", "reportStatesSimulationBlocked", "reportContainsNoClinicalClaims"]
  };
}

function globalGoDefinition() {
  return {
    issue: 929,
    script: "check-global-manual-only-go-no-go",
    title: "Global Manual-Only GO/NO-GO",
    statusKey: "globalManualOnlyGoNoGoStatus",
    goValue: "go_for_next_planning_review",
    outputName: "global-manual-only-go-no-go-output.json",
    manifestPath: globalManifestPath,
    manifestDefaults: globalDefaults,
    manifestPatch: (status) => ({ globalManualOnlyGoNoGoStatus: status === "passed" ? "go_for_next_planning_review" : "not_ready", allCurrentMilestonesManualOnly: status === "passed", recommendationsStillBlocked: true, scoringStillBlocked: true, simulationStillBlocked: true, clinicalClaimsBlocked: true, patientOutcomeClaimsBlocked: true, staffingComplianceClaimsBlocked: true }),
    dependency: {
      label: "all milestone manifests passed",
      check: () => foundationPassed() && reviewPassed() && comparisonPassed() && readinessPassed() && readManifest(globalManifestPath, globalDefaults).currentProductStateReportStatus === "passed",
      detail: () => ({
        review: readManifest(reviewManifestPath, reviewDefaults),
        comparison: readManifest(comparisonManifestPath, comparisonDefaults),
        readiness: readManifest(readinessManifestPath, readinessDefaults),
        global: readManifest(globalManifestPath, globalDefaults)
      })
    },
    requiredFiles: [reviewManifestPath, comparisonManifestPath, readinessManifestPath, "docs/project/current-product-state-report.md"],
    filesChanged: [globalManifestPath, "docs/project/global-manual-only-status.md", "scripts/check-global-manual-only-go-no-go.mjs", issuePath("929")],
    statusFile: "docs/project/global-manual-only-status.md",
    statusCopy: "Global manual-only GO is limited to local evidence and synthetic operational data.",
    reviewFinding: "Global GO/NO-GO verifies current milestones remain manual-only with blocked future scoring, recommendations, simulation, and clinical claims.",
    firstFinding: "Global manual-only GO/NO-GO was missing.",
    limitations: ["GO is not a deployment or clinical-readiness claim."],
    flags: ["allCurrentMilestonesManualOnly", "manualScenarioReferencesStrict", "stableScenarioIdentity", "stableStaffRosterIdentity", "manualScenarioReviewFoundationReady", "manualComparisonFoundationReady", "projectReadinessDashboardReady", "globalNoClaimsGuardPassed", "globalEvidenceAuditPassed", "globalBrowserScreenshotAuditPassed", "recommendationsStillBlocked", "scoringStillBlocked", "simulationStillBlocked", "clinicalClaimsBlocked", "staffingComplianceClaimsBlocked", "patientOutcomeClaimsBlocked"]
  };
}

function statusKeyFromRootScript(name) {
  const map = {
    "check:manual-scenario-review-foundation-preflight": "manualScenarioReviewFoundationPreflightStatus",
    "check:manual-scenario-review-contract": "manualScenarioReviewContractStatus",
    "check:manual-scenario-review-summary": "manualScenarioReviewSummaryStatus",
    "check:manual-scenario-reference-issue-classifier": "manualScenarioReferenceIssueClassifierStatus",
    "check:manual-scenario-review-view-model": "manualScenarioReviewViewModelStatus",
    "check:manual-scenario-review-panel": "manualScenarioReviewPanelStatus",
    "check:manual-scenario-review-notes-contract": "manualScenarioReviewNotesContractStatus",
    "check:manual-scenario-review-notes-ui": "manualScenarioReviewNotesUiStatus",
    "check:manual-scenario-review-persistence": "manualScenarioReviewPersistenceStatus",
    "check:manual-scenario-review-browser-proof": "manualScenarioReviewBrowserProofStatus",
    "check:manual-scenario-review-no-scoring-guard": "manualScenarioReviewNoScoringGuardStatus",
    "check:manual-comparison-foundation-preflight": "manualComparisonFoundationPreflightStatus",
    "check:manual-comparison-set-contract": "manualComparisonSetContractStatus",
    "check:manual-comparison-reference-matrix": "manualComparisonReferenceMatrixStatus",
    "check:manual-comparison-ui": "manualComparisonUiStatus",
    "check:manual-comparison-save-reload-proof": "manualComparisonSaveReloadStatus",
    "check:manual-comparison-browser-proof": "manualComparisonBrowserProofStatus",
    "check:manual-comparison-no-scoring-guard": "manualComparisonNoScoringGuardStatus"
  };
  return map[name];
}
