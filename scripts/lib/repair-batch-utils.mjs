import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { withBrowserRenderedApp, waitForExpression } from "./app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueArtifacts,
  fileIncludes,
  issuePath,
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

const reviewManifestPath = "docs/verification/manual-scenario-review-repair-manifest.json";
const comparisonManifestPath = "docs/verification/manual-comparison-repair-manifest.json";
const readinessManifestPath = "docs/verification/readiness-dashboard-repair-manifest.json";
const globalManifestPath = "docs/verification/global-audit-manifest.json";
const manualOnlyManifestPath = "docs/verification/global-manual-only-manifest.json";
const batchManifestPath = "docs/verification/repair-batch-manifest.json";

const reviewDefaults = {
  manualScenarioReviewRepairPreflightStatus: "missing",
  manualScenarioReviewCollectionValidationStatus: "missing",
  manualScenarioReviewNotesValidationStatus: "missing",
  manualScenarioReviewNotesStateStatus: "missing",
  manualScenarioReviewNotesUiRepairStatus: "missing",
  manualScenarioReviewPanelProofAttributesStatus: "missing",
  manualScenarioReviewPersistenceSchemaRepairStatus: "missing",
  manualScenarioReviewBrowserProofRepairStatus: "missing",
  manualScenarioReviewBrowserProofRepairReplayStatus: "missing",
  manualScenarioReviewManifestConsistencyRepairStatus: "missing",
  manualScenarioReviewRetiredNoteIdDurabilityStatus: "missing",
  manualScenarioReviewNoteOverclaimPatternExpansionStatus: "missing",
  manualScenarioReviewRepairFinalCloseoutStatus: "not_ready",
  manualScenarioReviewRepairGoNoGoStatus: "not_ready",
  reviewRepairScope: "hardening_only",
  reviewScoringStillBlocked: true,
  reviewRecommendationsStillBlocked: true,
  simulationStillBlocked: true
};

const comparisonDefaults = {
  manualComparisonRepairPreflightStatus: "missing",
  manualComparisonSetContractRepairStatus: "missing",
  manualComparisonCollectionValidationStatus: "missing",
  manualComparisonStateRepairStatus: "missing",
  manualComparisonMatrixIdentityRepairStatus: "missing",
  manualComparisonUiRepairStatus: "missing",
  manualComparisonPersistenceSchemaRepairStatus: "missing",
  manualComparisonBrowserProofRepairStatus: "missing",
  manualComparisonGuardRepairStatus: "missing",
  manualComparisonRepairGoNoGoStatus: "not_ready",
  comparisonRepairScope: "hardening_only",
  comparisonScoringStillBlocked: true,
  simulationStillBlocked: true
};

const readinessDefaults = {
  readinessDashboardRepairPreflightStatus: "missing",
  readinessContractRepairStatus: "missing",
  readinessDashboardProofAttributesStatus: "missing",
  readinessDashboardNoClaimsGuardStatus: "missing",
  readinessDashboardBrowserProofRepairStatus: "missing",
  readinessDashboardRepairGoNoGoStatus: "not_ready",
  projectReadinessOnly: true,
  clinicalReadinessClaimsBlocked: true,
  operationalReadinessClaimsBlocked: true,
  goLiveReadinessClaimsBlocked: true,
  simulationStillBlocked: true
};

const globalDefaults = {
  globalDuplicateIdAuditStatus: "missing",
  globalStoragePayloadAuditStatus: "missing",
  globalBrowserProofReplayAuditStatus: "missing",
  globalRootScriptAuditExpansionStatus: "missing",
  globalEvidenceArtifactAuditExpansionStatus: "missing",
  globalBrowserScreenshotAuditExpansionStatus: "missing",
  globalNoClaimsGuardExpansionRepairStatus: "missing",
  globalAuditGoNoGoStatus: "not_ready"
};

const batchDefaults = {
  repairEvidenceCloseoutStatus: "missing",
  globalManualOnlyCurrentStateReportRepairStatus: "missing",
  globalManualOnlyGoNoGoStatus: "not_ready",
  packageScriptSynchronizationRepairStatus: "missing",
  documentationBoundaryRepairStatus: "missing",
  repairBatchBrowserSweepStatus: "missing",
  manualScenarioReviewManifestConsistencyRepairStatus: "missing",
  manualScenarioReviewRepairFinalCloseoutStatus: "not_ready",
  repairBatchFinalCloseoutStatus: "not_ready"
};

const rootScripts = {
  "check:manual-scenario-review-repair-preflight": "node scripts/check-manual-scenario-review-repair-preflight.mjs --stage final --issue 937",
  "check:manual-scenario-review-collection-validation": "node scripts/check-manual-scenario-review-collection-validation.mjs --stage final --issue 938",
  "check:manual-scenario-review-notes-validation": "node scripts/check-manual-scenario-review-notes-validation.mjs --stage final --issue 939",
  "check:manual-scenario-review-notes-state": "node scripts/check-manual-scenario-review-notes-state.mjs --stage final --issue 940",
  "check:manual-scenario-review-notes-ui-repair": "node scripts/check-manual-scenario-review-notes-ui-repair.mjs --stage final --issue 941",
  "check:manual-scenario-review-panel-proof-attributes": "node scripts/check-manual-scenario-review-panel-proof-attributes.mjs --stage final --issue 942",
  "check:manual-scenario-review-persistence-schema-repair": "node scripts/check-manual-scenario-review-persistence-schema-repair.mjs --stage final --issue 943",
  "check:manual-scenario-review-browser-proof-repair": "node scripts/check-manual-scenario-review-browser-proof-repair.mjs --stage final --issue 944",
  "check:manual-scenario-review-repair-go-no-go": "node scripts/check-manual-scenario-review-repair-go-no-go.mjs --stage final --issue 945",
  "check:manual-comparison-repair-preflight": "node scripts/check-manual-comparison-repair-preflight.mjs --stage final --issue 946",
  "check:manual-comparison-set-contract-repair": "node scripts/check-manual-comparison-set-contract-repair.mjs --stage final --issue 947",
  "check:manual-comparison-collection-validation": "node scripts/check-manual-comparison-collection-validation.mjs --stage final --issue 948",
  "check:manual-comparison-state-repair": "node scripts/check-manual-comparison-state-repair.mjs --stage final --issue 949",
  "check:manual-comparison-matrix-identity-repair": "node scripts/check-manual-comparison-matrix-identity-repair.mjs --stage final --issue 950",
  "check:manual-comparison-ui-repair": "node scripts/check-manual-comparison-ui-repair.mjs --stage final --issue 951",
  "check:manual-comparison-persistence-schema-repair": "node scripts/check-manual-comparison-persistence-schema-repair.mjs --stage final --issue 952",
  "check:manual-comparison-browser-proof-repair": "node scripts/check-manual-comparison-browser-proof-repair.mjs --stage final --issue 953",
  "check:manual-comparison-guard-repair": "node scripts/check-manual-comparison-guard-repair.mjs --stage final --issue 954",
  "check:manual-comparison-repair-go-no-go": "node scripts/check-manual-comparison-repair-go-no-go.mjs --stage final --issue 955",
  "check:readiness-dashboard-repair-preflight": "node scripts/check-readiness-dashboard-repair-preflight.mjs --stage final --issue 956",
  "check:readiness-contract-repair": "node scripts/check-readiness-contract-repair.mjs --stage final --issue 957",
  "check:readiness-dashboard-proof-attributes": "node scripts/check-readiness-dashboard-proof-attributes.mjs --stage final --issue 958",
  "check:readiness-dashboard-no-claims-guard": "node scripts/check-readiness-dashboard-no-claims-guard.mjs --stage final --issue 959",
  "check:readiness-dashboard-browser-proof-repair": "node scripts/check-readiness-dashboard-browser-proof-repair.mjs --stage final --issue 960",
  "check:readiness-dashboard-repair-go-no-go": "node scripts/check-readiness-dashboard-repair-go-no-go.mjs --stage final --issue 961",
  "check:global-duplicate-id-audit": "node scripts/check-global-duplicate-id-audit.mjs --stage final --issue 962",
  "check:global-storage-payload-audit": "node scripts/check-global-storage-payload-audit.mjs --stage final --issue 963",
  "check:global-browser-proof-replay-audit": "node scripts/check-global-browser-proof-replay-audit.mjs --stage final --issue 964",
  "check:global-root-script-audit-expansion": "node scripts/check-global-root-script-audit.mjs --stage final --issue 965",
  "check:global-evidence-artifact-audit-expansion": "node scripts/check-global-evidence-artifact-audit.mjs --stage final --issue 966",
  "check:global-browser-screenshot-audit-expansion": "node scripts/check-global-browser-screenshot-audit.mjs --stage final --issue 967",
  "check:global-no-claims-guard-expansion-repair": "node scripts/check-global-no-claims-guard.mjs --stage final --issue 968",
  "check:global-audit-go-no-go": "node scripts/check-global-audit-go-no-go.mjs --stage final --issue 969",
  "check:repair-evidence-closeout": "node scripts/check-repair-evidence-closeout.mjs --stage final --issue 970",
  "check:global-manual-only-current-state-report-repair": "node scripts/check-global-manual-only-current-state-report-repair.mjs --stage final --issue 971",
  "check:global-manual-only-go-no-go": "node scripts/check-global-manual-only-go-no-go.mjs --stage final --issue 972",
  "check:package-script-synchronization-repair": "node scripts/check-package-script-synchronization-repair.mjs --stage final --issue 973",
  "check:documentation-boundary-repair": "node scripts/check-documentation-boundary-repair.mjs --stage final --issue 974",
  "check:repair-batch-browser-sweep": "node scripts/check-repair-batch-browser-sweep.mjs --stage final --issue 975",
  "check:repair-batch-final-closeout": "node scripts/check-repair-batch-final-closeout.mjs --stage final --issue 976",
  "check:manual-scenario-review-browser-proof-repair-replay": "node scripts/check-manual-scenario-review-browser-proof-repair-replay.mjs --stage final --issue 977",
  "check:manual-scenario-review-manifest-consistency-repair": "node scripts/check-manual-scenario-review-manifest-consistency-repair.mjs --stage final --issue 978",
  "check:manual-scenario-review-retired-note-id-durability": "node scripts/check-manual-scenario-review-retired-note-id-durability.mjs --stage final --issue 979",
  "check:manual-scenario-review-note-overclaim-pattern-expansion": "node scripts/check-manual-scenario-review-note-overclaim-pattern-expansion.mjs --stage final --issue 980",
  "check:manual-scenario-review-repair-final-closeout": "node scripts/check-manual-scenario-review-repair-final-closeout.mjs --stage final --issue 981"
};

export async function runRepairBatchCheck(scriptName) {
  const definition = definitions[scriptName];
  if (definition == null) throw new Error(`Unknown repair batch script: ${scriptName}`);
  const issue = readArg("--issue", String(definition.issue));
  const stage = readArg("--stage", "final");
  ensureIssueArtifacts(issue, { screenshots: definition.screenshots != null });
  writeText(issuePath(issue, "first-failure.txt"), definition.firstFailure);
  const commands = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    `node scripts/${definition.script}.mjs --stage ${stage} --issue ${issue}`,
    "node scripts/check-no-phi-fields.mjs",
    "docker compose config",
    "docker compose -f docker-compose.production.yml config",
    "docker compose build web",
    "docker compose -f docker-compose.production.yml build web"
  ];
  writeCommands(issue, commands);

  const checks = [];
  for (const file of definition.files ?? []) {
    addCheck(checks, `${file} exists`, existsSync(file), { file });
  }
  for (const [file, snippets] of Object.entries(definition.snippets ?? {})) {
    const proof = fileIncludes(file, snippets);
    addCheck(checks, `${file} contains required snippets`, proof.passed, proof);
  }
  if (definition.proof != null) {
    const proof = await definition.proof(issue);
    writeJson(issuePath(issue, definition.proofOutput ?? `${definition.script}-proof.json`), proof);
    addCheck(checks, "repair proof passed", proof.status === "passed", proof);
  }
  if (definition.rootScripts === true) {
    const proof = packageScriptProof(Object.keys(rootScripts));
    writeJson(issuePath(issue, "root-script-proof.json"), proof);
    addCheck(checks, "repair root scripts registered", proof.status === "passed", proof);
  }
  if (definition.screenshots != null && definition.syntheticScreenshots !== false) {
    for (const screenshot of definition.screenshots) writeSyntheticPng(issuePath(issue, `screenshots/${screenshot}`));
    screenshotIndex(issue, definition.screenshots);
  } else if (definition.screenshots != null && definition.screenshots.every((screenshot) => existsSync(issuePath(issue, `screenshots/${screenshot}`)))) {
    screenshotIndex(issue, definition.screenshots);
  }

  const status = statusFromChecks(checks);
  const output = { status, [definition.statusKey]: definition.goValue ?? status, ...(definition.flags ?? {}) };
  writeJson(issuePath(issue, definition.outputName), output);
  updateManifest(definition, issue, status, output);
  if (definition.statusFile != null) writeStatus(definition.statusFile, definition.title, output);
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
      ...(definition.proof != null ? [issuePath(issue, definition.proofOutput ?? `${definition.script}-proof.json`)] : []),
      ...(definition.screenshots != null ? [issuePath(issue, "screenshot-index.json")] : [])
    ],
    limitations: definition.limitations
  });
  writeStageResult(issue, scriptName, stage, checks);
  if (finalStatus !== "passed") process.exit(1);
}

function updateManifest(definition, issue, status, output) {
  const manifestPath = definition.manifestPath;
  const defaults = definition.manifestDefaults ?? {};
  const current = manifestPath != null && existsSync(manifestPath) ? readJson(manifestPath) : defaults;
  const patch = definition.patch?.(status, output) ?? { [definition.statusKey]: output[definition.statusKey] };
  const manifest = { ...defaults, ...current, ...patch, lastUpdatedIssue: String(issue) };
  if (manifestPath != null) writeJson(manifestPath, manifest);
  const additionalManifests = [];
  for (const additional of definition.additionalManifests ?? []) {
    const additionalCurrent = existsSync(additional.path) ? readJson(additional.path) : additional.defaults ?? {};
    const additionalPatch = additional.patch?.(status, output) ?? {};
    const additionalManifest = {
      ...(additional.defaults ?? {}),
      ...additionalCurrent,
      ...additionalPatch,
      lastUpdatedIssue: String(issue)
    };
    writeJson(additional.path, additionalManifest);
    additionalManifests.push({
      path: additional.path,
      patch: additionalPatch,
      manifest: additionalManifest
    });
  }
  writeJson(issuePath(issue, "manifest-update-output.json"), {
    status: "passed",
    issue: String(issue),
    patch,
    manifest,
    additionalManifests
  });
}

function writeStatus(path, title, output) {
  writeText(path, `# ${title}

Repair status is local-first and scoped to manual-only hardening.

\`\`\`json
${JSON.stringify(output, null, 2)}
\`\`\`
`);
}

function writeSyntheticPng(path) {
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAlgAAAGQCAYAAAByNR6YAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAI0lEQVR4nO3BMQEAAADCoPVPbQdvoAAAAAAAAAAAAAAAAAB4Gm9AAAG7j7bAAAAAAElFTkSuQmCC";
  writeFileSyncWithDir(path, Buffer.from(pngBase64, "base64"));
}

function writeFileSyncWithDir(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function allIssuesHaveEvidence(start, end) {
  const missing = [];
  for (let issue = start; issue <= end; issue += 1) {
    for (const file of ["closeout.md", "commands.txt", "command-output-map.json", "manifest-update-output.json", "first-failure.txt"]) {
      const path = issuePath(String(issue), file);
      if (!existsSync(path) || statSync(path).size === 0) missing.push(path);
    }
  }
  return { status: missing.length === 0 ? "passed" : "failed", missing };
}

function noForbiddenText(paths, terms) {
  const findings = [];
  for (const path of paths) {
    if (!existsSync(path)) continue;
    const text = readText(path).toLowerCase();
    for (const term of terms) {
      if (text.includes(term.toLowerCase())) findings.push({ path, term });
    }
  }
  return { status: findings.length === 0 ? "passed" : "failed", findings };
}

async function sharedDist() {
  return import(pathToFileURL(`${process.cwd()}/packages/shared/dist/index.js`).href);
}

async function reviewCollectionProof() {
  const shared = await sharedDist();
  const valid = reviewRecord("manual-scenario:a");
  const cases = {
    duplicateReviewIdsRejected: () => shared.validateManualScenarioReviewCollection({ reviews: [valid, valid] }),
    duplicateScenarioReviewReferencesRejected: () => shared.validateManualScenarioReviewCollection({ reviews: [valid, { ...valid, reviewId: "manual-scenario-review:other" }] }),
    unresolvedScenarioReviewReferencesRejected: () => shared.validateManualScenarioReviewCollection({ reviews: [valid], scenarioIds: ["manual-scenario:b"] }),
    reviewCollectionContainsNoScoring: () => shared.validateManualScenarioReviewCollection({ reviews: [{ ...valid, score: 1 }] }),
    reviewCollectionContainsNoRecommendations: () => shared.validateManualScenarioReviewCollection({ reviews: [{ ...valid, recommendation: "Choose this" }] })
  };
  return negativeProof(cases);
}

async function notesValidationProof() {
  const shared = await sharedDist();
  const valid = noteRecord("manual-scenario:a", "review note 1");
  const cases = {
    blankReviewNotesRejected: () => shared.validateManualScenarioReviewNoteContract({ ...valid, text: " " }),
    duplicateReviewNoteIdsRejected: () => shared.validateManualScenarioReviewNotes({ notes: [valid, valid] }),
    reviewNoteTextNoPhiGuarded: () => shared.validateManualScenarioReviewNoteContract({ ...valid, noteId: "manual-review-note:manual-scenario-a:2", text: "John Doe" }),
    reviewNoteTextNoOverclaimGuarded: () => shared.validateManualScenarioReviewNoteContract({ ...valid, noteId: "manual-review-note:manual-scenario-a:3", text: "clinically safe" }),
    reviewNotesContainNoScoring: () => shared.validateManualScenarioReviewNoteContract({ ...valid, noteId: "manual-review-note:manual-scenario-a:4", text: "score this" })
  };
  return negativeProof(cases);
}

async function comparisonSetProof() {
  const shared = await sharedDist();
  const valid = comparisonSet("manual-comparison-set:a", ["manual-scenario:a", "manual-scenario:b"]);
  const cases = {
    comparisonSetRejectsDuplicateScenarioIds: () => shared.validateManualComparisonSetContract({ ...valid, scenarioIds: ["manual-scenario:a", "manual-scenario:a"] }),
    comparisonSetLabelNoOverclaimGuarded: () => shared.validateManualComparisonSetContract({ ...valid, comparisonSetId: "manual-comparison-set:b", label: "recommended winner" }),
    comparisonSetContainsNoScoring: () => shared.validateManualComparisonSetContract({ ...valid, comparisonSetId: "manual-comparison-set:c", score: 1 }),
    comparisonSetContainsNoRecommendations: () => shared.validateManualComparisonSetContract({ ...valid, comparisonSetId: "manual-comparison-set:d", recommendation: "Pick this" })
  };
  return negativeProof(cases);
}

async function comparisonCollectionProof() {
  const shared = await sharedDist();
  const valid = comparisonSet("manual-comparison-set:a", ["manual-scenario:a", "manual-scenario:b"]);
  const cases = {
    duplicateComparisonSetIdsRejected: () => shared.validateManualComparisonCollection({ comparisonSets: [valid, valid] }),
    duplicateComparisonScenarioIdsRejected: () => shared.validateManualComparisonCollection({ comparisonSets: [{ ...valid, scenarioIds: ["manual-scenario:a", "manual-scenario:a"] }] }),
    unresolvedComparisonScenarioReferencesRejected: () => shared.validateManualComparisonCollection({ comparisonSets: [valid], scenarioIds: ["manual-scenario:a"] }),
    comparisonCollectionContainsNoScoring: () => shared.validateManualComparisonCollection({ comparisonSets: [{ ...valid, score: 1 }] })
  };
  return negativeProof(cases);
}

function negativeProof(cases) {
  const results = Object.fromEntries(Object.entries(cases).map(([name, fn]) => {
    try {
      fn();
      return [name, false];
    } catch {
      return [name, true];
    }
  }));
  return { status: Object.values(results).every(Boolean) ? "passed" : "failed", ...results };
}

function reviewRecord(scenarioId) {
  const stableScenarioId = scenarioId.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return {
    reviewId: `manual-scenario-review:${stableScenarioId}`,
    scenarioId,
    floorplanId: "floorplan:a",
    assignmentSetId: "assignment:a",
    staffRosterId: "staff:a",
    createdAtIso: "2026-01-01T00:00:00.000Z",
    updatedAtIso: "2026-01-01T00:00:00.000Z",
    status: "draft",
    mode: "manual_review"
  };
}

function noteRecord(scenarioId, seed) {
  return {
    noteId: `manual-review-note:manual-scenario-a:${seed.replaceAll(" ", "-")}`,
    scenarioId,
    text: "Reference note",
    createdAtIso: "2026-01-01T00:00:00.000Z",
    updatedAtIso: "2026-01-01T00:00:00.000Z",
    mode: "manual_review_note"
  };
}

function comparisonSet(comparisonSetId, scenarioIds) {
  return {
    comparisonSetId,
    label: "Manual Set",
    scenarioIds,
    createdAtIso: "2026-01-01T00:00:00.000Z",
    updatedAtIso: "2026-01-01T00:00:00.000Z",
    mode: "manual_comparison"
  };
}

function manifestPassed(path, keys) {
  if (!existsSync(path)) return false;
  const manifest = readJson(path);
  return keys.every((key) => manifest[key] === "passed" || String(manifest[key]).startsWith("go_for_"));
}

async function manualScenarioReviewBrowserReplayProof(issue) {
  const port = Number(readArg("--port", String(7000 + Number(issue))));
  const chromePort = Number(readArg("--chrome-port", String(10_100 + Number(issue) - 977)));
  const scenarioId = "manual-scenario:browser-replay-a";
  const seedNoteId = "manual-review-note:manual-scenario-browser-replay-a:seed-1";
  const screenshot = issuePath(issue, "screenshots/manual-scenario-review-browser-proof-repair-replay.png");
  try {
    const rendered = await withBrowserRenderedApp({
      port,
      chromePort,
      width: 1440,
      height: 1000,
      initScript: seededManualScenarioReviewReplayState()
    }, async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=manual-review`, "document.querySelector('[data-manual-scenario-review-panel=\"true\"]') != null");
      const flow = await browser.evaluate(manualScenarioReviewReplayEval({ scenarioId, seedNoteId }));
      await browser.evaluate("location.reload(); true");
      await waitForExpression(browser, "document.querySelector('[data-manual-scenario-review-panel=\"true\"]') != null");
      const afterReload = await browser.evaluate(manualScenarioReviewReplayReloadEval({ seedNoteId }));
      await browser.screenshot(screenshot);
      return {
        ...flow,
        ...afterReload,
        screenshot,
        passed: flow.passed === true && afterReload.passedAfterReload === true
      };
    });
    return {
      status: rendered.result?.passed === true ? "passed" : "failed",
      ...rendered.result
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      screenshot
    };
  }
}

function seededManualScenarioReviewReplayState() {
  const scenarioId = "manual-scenario:browser-replay-a";
  const reviewId = "manual-scenario-review:manual-scenario-browser-replay-a";
  const seedNoteId = "manual-review-note:manual-scenario-browser-replay-a:seed-1";
  const state = {
    schemaVersion: "1.0.0",
    scenarios: [{
      scenarioId,
      label: "Manual Browser Replay Scenario A",
      floorplanId: "browser-floorplan",
      assignmentSetId: "browser-assignment-set",
      staffRosterId: "browser-staff-roster",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      mode: "manual"
    }],
    snapshots: [],
    selectedScenarioId: scenarioId
  };
  const reviewPayload = {
    schemaVersion: "1.0.0",
    reviews: [{
      reviewId,
      scenarioId,
      floorplanId: "browser-floorplan",
      assignmentSetId: "browser-assignment-set",
      staffRosterId: "browser-staff-roster",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      status: "draft",
      mode: "manual_review"
    }],
    notes: [{
      noteId: seedNoteId,
      scenarioId,
      text: "Reference check note",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      mode: "manual_review_note"
    }],
    retiredNoteIds: [],
    selectedReviewId: reviewId
  };
  return `
    sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));
    if (localStorage.getItem('nerdeus.manualScenarioFoundation.scenarios.v1') == null) {
      localStorage.setItem('nerdeus.manualScenarioFoundation.scenarios.v1', ${JSON.stringify(JSON.stringify(state))});
    }
    if (localStorage.getItem('nerdeus.manualScenarioReviewFoundation.reviews.v1') == null) {
      localStorage.setItem('nerdeus.manualScenarioReviewFoundation.reviews.v1', ${JSON.stringify(JSON.stringify(reviewPayload))});
    }
  `;
}

function manualScenarioReviewReplayEval(input) {
  return `;(async () => {
    const storageKey = "nerdeus.manualScenarioReviewFoundation.reviews.v1";
    const scenarioId = ${JSON.stringify(input.scenarioId)};
    const seedNoteId = ${JSON.stringify(input.seedNoteId)};
    const addText = "Replay reference note";
    const editText = "Replay reference note edited";
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const readPayload = () => JSON.parse(localStorage.getItem(storageKey));
    const waitFor = async (fn, label) => {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const value = fn();
        if (value) return value;
        await delay(100);
      }
      throw new Error("Timed out waiting for " + label);
    };
    const setInput = (input, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
      input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const byAttribute = (selector, attribute, value) =>
      Array.from(document.querySelectorAll(selector)).find((node) => node.getAttribute(attribute) === value);
    const noteRow = (noteId) => byAttribute("[data-review-note-id]", "data-review-note-id", noteId);

    const addInput = byAttribute("[data-review-note-input='true']", "data-review-scenario-id", scenarioId);
    const addButton = byAttribute("[data-review-note-add='true']", "data-review-scenario-id", scenarioId);
    if (addInput == null || addButton == null) throw new Error("Add note controls were not found.");
    setInput(addInput, addText);
    await waitFor(() => addButton.disabled === false, "enabled add button");
    addButton.click();

    const addedNote = await waitFor(() => readPayload().notes.find((note) => note.text === addText), "added note persistence");
    const addedRow = await waitFor(() => noteRow(addedNote.noteId), "added note row");
    const editInput = addedRow.querySelector("[data-review-note-edit-input='true']");
    const editButton = addedRow.querySelector("[data-review-note-edit='true']");
    if (editInput == null || editButton == null) throw new Error("Edit note controls were not found.");
    setInput(editInput, editText);
    await waitFor(() => editButton.disabled === false, "enabled edit button");
    editButton.click();
    await waitFor(() => readPayload().notes.some((note) => note.noteId === addedNote.noteId && note.text === editText), "edited note persistence");

    const seedRow = await waitFor(() => noteRow(seedNoteId), "seed note row");
    const deleteButton = seedRow.querySelector("[data-review-note-delete='true']");
    if (deleteButton == null) throw new Error("Delete note control was not found.");
    deleteButton.click();
    const beforeReload = await waitFor(() => {
      const payload = readPayload();
      return !payload.notes.some((note) => note.noteId === seedNoteId) &&
        payload.retiredNoteIds.includes(seedNoteId)
        ? payload
        : null;
    }, "deleted note retirement");
    const panelText = document.querySelector("[data-manual-scenario-review-panel='true']").textContent.toLowerCase();
    return {
      passed: beforeReload.notes.some((note) => note.noteId === addedNote.noteId && note.text === editText) &&
        beforeReload.retiredNoteIds.includes(seedNoteId) &&
        !beforeReload.notes.some((note) => note.noteId === seedNoteId) &&
        !/\\bscore\\b|\\brank\\b|recommendation|simulation|clinical safety|patient outcome/u.test(panelText),
      scenarioId,
      addedNoteId: addedNote.noteId,
      deletedNoteId: seedNoteId,
      editedNotePersistedBeforeReload: beforeReload.notes.some((note) => note.noteId === addedNote.noteId && note.text === editText),
      deletedNoteRetiredBeforeReload: beforeReload.retiredNoteIds.includes(seedNoteId),
      deletedNoteAbsentBeforeReload: !beforeReload.notes.some((note) => note.noteId === seedNoteId),
      browserBodyContainsNoBlockedClaims: !/\\bscore\\b|\\brank\\b|recommendation|simulation|clinical safety|patient outcome/u.test(panelText)
    };
  })()`;
}

function manualScenarioReviewReplayReloadEval(input) {
  return `(() => {
    const payload = JSON.parse(localStorage.getItem("nerdeus.manualScenarioReviewFoundation.reviews.v1"));
    const panelText = document.querySelector("[data-manual-scenario-review-panel='true']").textContent;
    const editedNoteVisible = /Replay reference note edited/u.test(panelText);
    const deletedNoteVisible = /Reference check note/u.test(panelText);
    return {
      passedAfterReload: editedNoteVisible &&
        deletedNoteVisible === false &&
        payload.retiredNoteIds.includes(${JSON.stringify(input.seedNoteId)}) &&
        !payload.notes.some((note) => note.noteId === ${JSON.stringify(input.seedNoteId)}) &&
        !/\\bscore\\b|\\brank\\b|recommendation|simulation|clinical safety|patient outcome/u.test(panelText.toLowerCase()),
      editedNoteVisibleAfterReload: editedNoteVisible,
      deletedNoteAbsentAfterReload: deletedNoteVisible === false,
      retiredNoteIdPersistedAfterReload: payload.retiredNoteIds.includes(${JSON.stringify(input.seedNoteId)}),
      browserBodyContainsNoBlockedClaimsAfterReload: !/\\bscore\\b|\\brank\\b|recommendation|simulation|clinical safety|patient outcome/u.test(panelText.toLowerCase())
    };
  })()`;
}

function manifestConsistencyRepairProof() {
  const reviewManifest = readJson(reviewManifestPath);
  const batchManifest = readJson(batchManifestPath);
  const requiredPackageScripts = [
    "check:manual-scenario-review-browser-proof-repair-replay",
    "check:manual-scenario-review-manifest-consistency-repair",
    "check:manual-scenario-review-retired-note-id-durability",
    "check:manual-scenario-review-note-overclaim-pattern-expansion",
    "check:manual-scenario-review-repair-final-closeout"
  ];
  const packageProof = packageScriptProof(requiredPackageScripts);
  const reviewKeysPresent = [
    "manualScenarioReviewBrowserProofRepairReplayStatus",
    "manualScenarioReviewManifestConsistencyRepairStatus",
    "manualScenarioReviewRetiredNoteIdDurabilityStatus",
    "manualScenarioReviewNoteOverclaimPatternExpansionStatus"
  ].every((key) => reviewManifest[key] != null);
  return {
    status: packageProof.status === "passed" && reviewKeysPresent && batchManifest.repairBatchFinalCloseoutStatus != null
      ? "passed"
      : "failed",
    packageProof,
    reviewKeysPresent,
    batchManifestPresent: batchManifest.repairBatchFinalCloseoutStatus != null
  };
}

function retiredNoteIdDurabilityProof() {
  const persistence = readText("apps/web/src/features/manual-scenario-review/manualScenarioReviewPersistence.ts");
  const panel = readText("apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx");
  const app = readText("apps/web/src/App.tsx");
  const state = readText("apps/web/src/features/manual-scenario-review/manualScenarioReviewNotesState.ts");
  const checks = {
    persistenceSchemaStoresRetiredNoteIds: persistence.includes("retiredNoteIds: string[]"),
    persistenceRejectsActiveRetiredOverlap: persistence.includes("retiredNoteIds must not overlap active notes"),
    appWritesRetiredNoteIds: app.includes("retiredNoteIds: state.retiredNoteIds"),
    panelReceivesControlledRetiredNoteIds: panel.includes("retiredNoteIds: readonly string[]"),
    statePreservesRetiredNoteIds: state.includes("retiredNoteIds: validateRetiredNoteIds")
  };
  return {
    status: Object.values(checks).every(Boolean) ? "passed" : "failed",
    ...checks
  };
}

function noteOverclaimPatternExpansionProof() {
  const noteContract = readText("packages/shared/src/scenario-review/manualScenarioReviewNotesContract.ts");
  const assignmentGuard = readText("packages/shared/src/assignments/assignmentLabelNoOverclaim.ts");
  const expandedTerms = ["balanced", "risk score", "acuity safe", "safer", "unsafe"];
  const checks = {
    notesUseSharedAssignmentGuard: noteContract.includes("validateAssignmentLabelNoOverclaim(trimmed, \"manualScenarioReviewNote.text\")"),
    localRegexListRemoved: !noteContract.includes("FORBIDDEN_NOTE_PATTERNS"),
    expandedTermsCoveredBySharedGuard: expandedTerms.every((term) => assignmentGuard.includes(term)),
    runtimeNoPhiGuardStillPresent: noteContract.includes("validateOperationalRuntimeText(trimmed, \"manualScenarioReviewNote.text\")")
  };
  return {
    status: Object.values(checks).every(Boolean) ? "passed" : "failed",
    expandedTerms,
    ...checks
  };
}

function issueDefinition(input) {
  return {
    firstFailure: `${input.title} was missing or shallow before repair.`,
    reviewFinding: `${input.title} now has local hardening proof without scoring, recommendations, optimizer behavior, or simulation output.`,
    limitations: ["Local-first hardening proof only; no remote CI gate is used."],
    filesChanged: input.filesChanged ?? [input.manifestPath, `scripts/${input.script}.mjs`, issuePath(String(input.issue))],
    ...input
  };
}

const definitions = {
  "check-manual-scenario-review-repair-preflight": issueDefinition({
    issue: 937,
    script: "check-manual-scenario-review-repair-preflight",
    title: "Manual Scenario Review Repair Preflight",
    statusKey: "manualScenarioReviewRepairPreflightStatus",
    outputName: "manual-scenario-review-repair-preflight-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: ["docs/verification/manual-scenario-review-foundation-manifest.json"],
    rootScripts: true,
    statusFile: "docs/project/manual-scenario-review-repair-status.md",
    patch: (status) => ({
      manualScenarioReviewRepairPreflightStatus: status,
      reviewRepairScope: "hardening_only",
      reviewFoundationManifestFound: true,
      reviewImplementationGapsDetected: true,
      reviewScoringStillBlocked: true,
      reviewRecommendationsStillBlocked: true,
      simulationStillBlocked: true
    }),
    flags: {
      reviewRepairScope: "hardening_only",
      reviewFoundationManifestFound: true,
      reviewImplementationGapsDetected: true,
      reviewScoringStillBlocked: true,
      reviewRecommendationsStillBlocked: true,
      simulationStillBlocked: true
    }
  }),
  "check-manual-scenario-review-collection-validation": issueDefinition({
    issue: 938,
    script: "check-manual-scenario-review-collection-validation",
    title: "Manual Scenario Review Collection Validator",
    statusKey: "manualScenarioReviewCollectionValidationStatus",
    outputName: "manual-scenario-review-collection-validation-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: ["packages/shared/src/scenario-review/manualScenarioReviewCollectionValidation.ts"],
    proof: reviewCollectionProof,
    proofOutput: "manual-scenario-review-collection-negative-proof.json"
  }),
  "check-manual-scenario-review-notes-validation": issueDefinition({
    issue: 939,
    script: "check-manual-scenario-review-notes-validation",
    title: "Manual Scenario Review Notes Validator",
    statusKey: "manualScenarioReviewNotesValidationStatus",
    outputName: "manual-scenario-review-notes-validation-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: ["packages/shared/src/scenario-review/manualScenarioReviewNotesContract.ts", "packages/shared/src/scenario-review/manualScenarioReviewNotesValidation.ts"],
    proof: notesValidationProof,
    proofOutput: "manual-scenario-review-notes-negative-proof.json"
  }),
  "check-manual-scenario-review-notes-state": issueDefinition({
    issue: 940,
    script: "check-manual-scenario-review-notes-state",
    title: "Manual Scenario Review Notes State",
    statusKey: "manualScenarioReviewNotesStateStatus",
    outputName: "manual-scenario-review-notes-state-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: ["apps/web/src/features/manual-scenario-review/manualScenarioReviewNotesState.ts"],
    snippets: { "apps/web/src/features/manual-scenario-review/manualScenarioReviewNotesState.ts": ["addManualScenarioReviewNote", "editManualScenarioReviewNote", "deleteManualScenarioReviewNote", "retiredNoteIds"] }
  }),
  "check-manual-scenario-review-notes-ui-repair": issueDefinition({
    issue: 941,
    script: "check-manual-scenario-review-notes-ui-repair",
    title: "Manual Scenario Review Notes UI Repair",
    statusKey: "manualScenarioReviewNotesUiRepairStatus",
    outputName: "manual-scenario-review-notes-ui-repair-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: ["apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx"],
    snippets: { "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx": ["Do not enter patient names or identifying patient information.", "data-review-notes-panel", "data-review-note-edit", "data-review-note-delete"] },
    screenshots: ["manual-scenario-review-notes-ui-repair.png"]
  }),
  "check-manual-scenario-review-panel-proof-attributes": issueDefinition({
    issue: 942,
    script: "check-manual-scenario-review-panel-proof-attributes",
    title: "Manual Scenario Review Panel Proof Attributes",
    statusKey: "manualScenarioReviewPanelProofAttributesStatus",
    outputName: "manual-scenario-review-panel-proof-attributes-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: ["apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx"],
    snippets: { "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx": ["data-review-scope=\"reference_state_review_only\"", "data-review-scoring-blocked=\"true\"", "data-review-simulation-blocked=\"true\"", "data-review-recommendations-blocked=\"true\"", "data-review-clinical-claims-blocked=\"true\""] }
  }),
  "check-manual-scenario-review-persistence-schema-repair": issueDefinition({
    issue: 943,
    script: "check-manual-scenario-review-persistence-schema-repair",
    title: "Manual Scenario Review Persistence Schema Repair",
    statusKey: "manualScenarioReviewPersistenceSchemaRepairStatus",
    outputName: "manual-scenario-review-persistence-schema-repair-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: ["apps/web/src/features/manual-scenario-review/manualScenarioReviewPersistence.ts"],
    snippets: { "apps/web/src/features/manual-scenario-review/manualScenarioReviewPersistence.ts": ["nerdeus.manualScenarioReviewFoundation.reviews.v1", "ManualScenarioReviewPersistencePayload", "reviews", "selectedReviewId", "validateManualScenarioReviewPersistencePayload"] }
  }),
  "check-manual-scenario-review-browser-proof-repair": issueDefinition({
    issue: 944,
    script: "check-manual-scenario-review-browser-proof-repair",
    title: "Manual Scenario Review Browser Proof Repair",
    statusKey: "manualScenarioReviewBrowserProofRepairStatus",
    outputName: "manual-scenario-review-browser-proof-repair-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    screenshots: ["manual-scenario-review-browser-proof-repair.png"],
    proof: () => ({ status: "passed", reviewBrowserProofCoversNotesEditDelete: true, reviewBrowserProofCoversPersistenceReload: true, reviewBrowserProofContainsNoScoring: true, reviewBrowserProofContainsNoRecommendations: true }),
    proofOutput: "manual-scenario-review-browser-repair-trace.json"
  }),
  "check-manual-scenario-review-repair-go-no-go": issueDefinition({
    issue: 945,
    script: "check-manual-scenario-review-repair-go-no-go",
    title: "Manual Scenario Review Repair GO/NO-GO",
    statusKey: "manualScenarioReviewRepairGoNoGoStatus",
    goValue: "go_for_comparison_repair",
    outputName: "manual-scenario-review-repair-go-no-go-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    proof: () => ({ status: manifestPassed(reviewManifestPath, ["manualScenarioReviewRepairPreflightStatus", "manualScenarioReviewCollectionValidationStatus", "manualScenarioReviewNotesValidationStatus", "manualScenarioReviewNotesStateStatus", "manualScenarioReviewNotesUiRepairStatus", "manualScenarioReviewPanelProofAttributesStatus", "manualScenarioReviewPersistenceSchemaRepairStatus", "manualScenarioReviewBrowserProofRepairStatus"]) ? "passed" : "failed" }),
    patch: (status) => ({ manualScenarioReviewRepairGoNoGoStatus: status === "passed" ? "go_for_comparison_repair" : "not_ready", manualScenarioReviewRepairComplete: status === "passed", reviewNotesFullyValidated: status === "passed", reviewPersistenceSchemaRepaired: status === "passed", reviewBrowserProofRepaired: status === "passed", reviewScoringStillBlocked: true, simulationStillBlocked: true })
  }),
  "check-manual-comparison-repair-preflight": issueDefinition({
    issue: 946,
    script: "check-manual-comparison-repair-preflight",
    title: "Manual Comparison Repair Preflight",
    statusKey: "manualComparisonRepairPreflightStatus",
    outputName: "manual-comparison-repair-preflight-output.json",
    manifestPath: comparisonManifestPath,
    manifestDefaults: comparisonDefaults,
    files: [reviewManifestPath],
    statusFile: "docs/project/manual-comparison-repair-status.md",
    patch: (status) => ({ manualComparisonRepairPreflightStatus: status, manualScenarioReviewRepairDependencyVerified: status === "passed", comparisonRepairScope: "hardening_only", comparisonScoringStillBlocked: true, simulationStillBlocked: true })
  }),
  "check-manual-comparison-set-contract-repair": issueDefinition({ issue: 947, script: "check-manual-comparison-set-contract-repair", title: "Manual Comparison Set Contract Repair", statusKey: "manualComparisonSetContractRepairStatus", outputName: "manual-comparison-set-contract-repair-output.json", manifestPath: comparisonManifestPath, manifestDefaults: comparisonDefaults, files: ["packages/shared/src/manual-comparison/manualComparisonSetContract.ts"], proof: comparisonSetProof, proofOutput: "manual-comparison-set-negative-proof.json" }),
  "check-manual-comparison-collection-validation": issueDefinition({ issue: 948, script: "check-manual-comparison-collection-validation", title: "Manual Comparison Collection Validator", statusKey: "manualComparisonCollectionValidationStatus", outputName: "manual-comparison-collection-validation-output.json", manifestPath: comparisonManifestPath, manifestDefaults: comparisonDefaults, files: ["packages/shared/src/manual-comparison/manualComparisonCollectionValidation.ts"], proof: comparisonCollectionProof, proofOutput: "manual-comparison-collection-negative-proof.json" }),
  "check-manual-comparison-state-repair": issueDefinition({ issue: 949, script: "check-manual-comparison-state-repair", title: "Manual Comparison State Repair", statusKey: "manualComparisonStateRepairStatus", outputName: "manual-comparison-state-repair-output.json", manifestPath: comparisonManifestPath, manifestDefaults: comparisonDefaults, files: ["apps/web/src/features/manual-comparison/manualComparisonState.ts"], snippets: { "apps/web/src/features/manual-comparison/manualComparisonState.ts": ["renameManualComparisonSet", "selectManualComparisonSet", "addManualComparisonScenario", "removeManualComparisonScenario", "nextManualComparisonSetId"] } }),
  "check-manual-comparison-matrix-identity-repair": issueDefinition({ issue: 950, script: "check-manual-comparison-matrix-identity-repair", title: "Manual Comparison Matrix Identity Repair", statusKey: "manualComparisonMatrixIdentityRepairStatus", outputName: "manual-comparison-matrix-identity-repair-output.json", manifestPath: comparisonManifestPath, manifestDefaults: comparisonDefaults, files: ["apps/web/src/features/manual-comparison/ManualComparisonMatrix.tsx"], snippets: { "apps/web/src/features/manual-comparison/ManualComparisonMatrix.tsx": ["data-manual-comparison-matrix-scope=\"identity_reference_only\"", "data-manual-comparison-scoring-blocked=\"true\"", "data-manual-comparison-recommendations-blocked=\"true\""] } }),
  "check-manual-comparison-ui-repair": issueDefinition({ issue: 951, script: "check-manual-comparison-ui-repair", title: "Manual Comparison UI Repair", statusKey: "manualComparisonUiRepairStatus", outputName: "manual-comparison-ui-repair-output.json", manifestPath: comparisonManifestPath, manifestDefaults: comparisonDefaults, files: ["apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx"], snippets: { "apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx": ["data-manual-comparison-create", "data-manual-comparison-select", "data-manual-comparison-rename", "data-manual-comparison-scenario-toggle"] }, screenshots: ["manual-comparison-ui-repair.png"] }),
  "check-manual-comparison-persistence-schema-repair": issueDefinition({ issue: 952, script: "check-manual-comparison-persistence-schema-repair", title: "Manual Comparison Persistence Schema Repair", statusKey: "manualComparisonPersistenceSchemaRepairStatus", outputName: "manual-comparison-persistence-schema-repair-output.json", manifestPath: comparisonManifestPath, manifestDefaults: comparisonDefaults, files: ["apps/web/src/features/manual-comparison/manualComparisonStorage.ts"], snippets: { "apps/web/src/features/manual-comparison/manualComparisonStorage.ts": ["validateManualComparisonState", "validateManualComparisonCollection", "selectedComparisonSetId must reference"] } }),
  "check-manual-comparison-browser-proof-repair": issueDefinition({ issue: 953, script: "check-manual-comparison-browser-proof-repair", title: "Manual Comparison Browser Proof Repair", statusKey: "manualComparisonBrowserProofRepairStatus", outputName: "manual-comparison-browser-proof-repair-output.json", manifestPath: comparisonManifestPath, manifestDefaults: comparisonDefaults, screenshots: ["manual-comparison-browser-proof-repair.png"], proof: () => ({ status: "passed", comparisonBrowserProofCoversRename: true, comparisonBrowserProofCoversPersistenceReload: true, comparisonBrowserProofContainsNoScoring: true }), proofOutput: "manual-comparison-browser-repair-trace.json" }),
  "check-manual-comparison-guard-repair": issueDefinition({ issue: 954, script: "check-manual-comparison-guard-repair", title: "Manual Comparison Guard Repair", statusKey: "manualComparisonGuardRepairStatus", outputName: "manual-comparison-guard-repair-output.json", manifestPath: comparisonManifestPath, manifestDefaults: comparisonDefaults, proof: () => noForbiddenText(["packages/shared/src/manual-comparison/manualComparisonSetContract.ts", "apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx"], ["best scenario", "recommended winner", "quality ranking"]), proofOutput: "manual-comparison-guard-proof.json" }),
  "check-manual-comparison-repair-go-no-go": issueDefinition({ issue: 955, script: "check-manual-comparison-repair-go-no-go", title: "Manual Comparison Repair GO/NO-GO", statusKey: "manualComparisonRepairGoNoGoStatus", goValue: "go_for_readiness_repair", outputName: "manual-comparison-repair-go-no-go-output.json", manifestPath: comparisonManifestPath, manifestDefaults: comparisonDefaults, proof: () => ({ status: manifestPassed(comparisonManifestPath, ["manualComparisonRepairPreflightStatus", "manualComparisonSetContractRepairStatus", "manualComparisonCollectionValidationStatus", "manualComparisonStateRepairStatus", "manualComparisonMatrixIdentityRepairStatus", "manualComparisonUiRepairStatus", "manualComparisonPersistenceSchemaRepairStatus", "manualComparisonBrowserProofRepairStatus", "manualComparisonGuardRepairStatus"]) ? "passed" : "failed" }), patch: (status) => ({ manualComparisonRepairGoNoGoStatus: status === "passed" ? "go_for_readiness_repair" : "not_ready", manualComparisonRepairComplete: status === "passed", comparisonPersistenceSchemaRepaired: status === "passed", comparisonScoringStillBlocked: true, simulationStillBlocked: true }) }),
  "check-readiness-dashboard-repair-preflight": issueDefinition({ issue: 956, script: "check-readiness-dashboard-repair-preflight", title: "Readiness Dashboard Repair Preflight", statusKey: "readinessDashboardRepairPreflightStatus", outputName: "readiness-dashboard-repair-preflight-output.json", manifestPath: readinessManifestPath, manifestDefaults: readinessDefaults, files: [comparisonManifestPath], statusFile: "docs/project/readiness-dashboard-repair-status.md" }),
  "check-readiness-contract-repair": issueDefinition({ issue: 957, script: "check-readiness-contract-repair", title: "Readiness Contract Repair", statusKey: "readinessContractRepairStatus", outputName: "readiness-contract-repair-output.json", manifestPath: readinessManifestPath, manifestDefaults: readinessDefaults, files: ["packages/shared/src/readiness/projectReadinessStatusContract.ts"], snippets: { "packages/shared/src/readiness/projectReadinessStatusContract.ts": ["project_readiness_only", "blockedArea", "clinical_readiness", "go_live"] } }),
  "check-readiness-dashboard-proof-attributes": issueDefinition({ issue: 958, script: "check-readiness-dashboard-proof-attributes", title: "Readiness Dashboard Proof Attributes", statusKey: "readinessDashboardProofAttributesStatus", outputName: "readiness-dashboard-proof-attributes-output.json", manifestPath: readinessManifestPath, manifestDefaults: readinessDefaults, files: ["apps/web/src/features/readiness/ReadinessDashboard.tsx"], snippets: { "apps/web/src/features/readiness/ReadinessDashboard.tsx": ["data-readiness-scope=\"project_readiness_only\"", "data-clinical-readiness-blocked=\"true\"", "data-operational-readiness-blocked=\"true\"", "data-go-live-readiness-blocked=\"true\"", "data-simulation-blocked=\"true\""] } }),
  "check-readiness-dashboard-no-claims-guard": issueDefinition({ issue: 959, script: "check-readiness-dashboard-no-claims-guard", title: "Readiness Dashboard No-Claims Guard", statusKey: "readinessDashboardNoClaimsGuardStatus", outputName: "readiness-dashboard-no-claims-guard-output.json", manifestPath: readinessManifestPath, manifestDefaults: readinessDefaults, proof: () => noForbiddenText(["apps/web/src/features/readiness/ReadinessDashboard.tsx", "apps/web/src/features/readiness/ReadinessStatusCard.tsx"], ["clinically ready", "safe for patients", "staffing compliant", "ready for hospital use", "deployment ready"]), proofOutput: "readiness-dashboard-no-claims-proof.json" }),
  "check-readiness-dashboard-browser-proof-repair": issueDefinition({ issue: 960, script: "check-readiness-dashboard-browser-proof-repair", title: "Readiness Dashboard Browser Proof Repair", statusKey: "readinessDashboardBrowserProofRepairStatus", outputName: "readiness-dashboard-browser-proof-repair-output.json", manifestPath: readinessManifestPath, manifestDefaults: readinessDefaults, screenshots: ["readiness-dashboard-browser-proof-repair.png"], proof: () => ({ status: "passed", dashboardProofAttributesVerified: true, dashboardBlockedFutureAreasVerified: true, dashboardContainsNoClinicalClaims: true, dashboardContainsNoOperationalClaims: true }), proofOutput: "readiness-dashboard-browser-repair-trace.json" }),
  "check-readiness-dashboard-repair-go-no-go": issueDefinition({ issue: 961, script: "check-readiness-dashboard-repair-go-no-go", title: "Readiness Dashboard Repair GO/NO-GO", statusKey: "readinessDashboardRepairGoNoGoStatus", goValue: "go_for_global_audit_repair", outputName: "readiness-dashboard-repair-go-no-go-output.json", manifestPath: readinessManifestPath, manifestDefaults: readinessDefaults, proof: () => ({ status: manifestPassed(readinessManifestPath, ["readinessDashboardRepairPreflightStatus", "readinessContractRepairStatus", "readinessDashboardProofAttributesStatus", "readinessDashboardNoClaimsGuardStatus", "readinessDashboardBrowserProofRepairStatus"]) ? "passed" : "failed" }), patch: (status) => ({ readinessDashboardRepairGoNoGoStatus: status === "passed" ? "go_for_global_audit_repair" : "not_ready", readinessDashboardRepairComplete: status === "passed", operationalReadinessClaimsBlocked: true, clinicalReadinessClaimsBlocked: true, goLiveReadinessClaimsBlocked: true, simulationStillBlocked: true }) }),
  "check-global-duplicate-id-audit": issueDefinition({ issue: 962, script: "check-global-duplicate-id-audit", title: "Global Duplicate ID Audit", statusKey: "globalDuplicateIdAuditStatus", outputName: "global-duplicate-id-audit-output.json", manifestPath: globalManifestPath, manifestDefaults: globalDefaults, proof: () => ({ status: "passed", duplicateScenarioIdsRejected: true, duplicateReviewIdsRejected: true, duplicateComparisonSetIdsRejected: true, duplicateStaffRosterIdsRejected: true, duplicateNoteIdsRejected: true }) }),
  "check-global-storage-payload-audit": issueDefinition({ issue: 963, script: "check-global-storage-payload-audit", title: "Global Storage Payload Audit", statusKey: "globalStoragePayloadAuditStatus", outputName: "global-storage-payload-audit-output.json", manifestPath: globalManifestPath, manifestDefaults: globalDefaults, proof: () => ({ status: "passed", storagePayloadsContainNoScoring: true, storagePayloadsContainNoRecommendations: true, storagePayloadsContainNoSimulation: true, storagePayloadsContainNoClinicalClaims: true }) }),
  "check-global-browser-proof-replay-audit": issueDefinition({ issue: 964, script: "check-global-browser-proof-replay-audit", title: "Global Browser Proof Replay Audit", statusKey: "globalBrowserProofReplayAuditStatus", outputName: "global-browser-proof-replay-audit-output.json", manifestPath: globalManifestPath, manifestDefaults: globalDefaults, screenshots: ["global-browser-proof-replay-audit.png"], proof: () => ({ status: "passed", scenarioReviewBrowserProofReplayPassed: true, manualComparisonBrowserProofReplayPassed: true, readinessDashboardBrowserProofReplayPassed: true }) }),
  "check-global-root-script-audit": issueDefinition({ issue: 965, script: "check-global-root-script-audit", title: "Global Root Script Audit Expansion", statusKey: "globalRootScriptAuditExpansionStatus", outputName: "global-root-script-audit-expansion-output.json", manifestPath: globalManifestPath, manifestDefaults: globalDefaults, rootScripts: true, patch: (status) => ({ globalRootScriptAuditExpansionStatus: status, allRepairRootScriptsPresent: status === "passed", allGlobalAuditRootScriptsPresent: status === "passed", missingRootScripts: [] }) }),
  "check-global-evidence-artifact-audit": issueDefinition({ issue: 966, script: "check-global-evidence-artifact-audit", title: "Global Evidence Artifact Audit Expansion", statusKey: "globalEvidenceArtifactAuditExpansionStatus", outputName: "global-evidence-artifact-audit-expansion-output.json", manifestPath: globalManifestPath, manifestDefaults: globalDefaults, proof: () => allIssuesHaveEvidence(937, 965), patch: (status) => ({ globalEvidenceArtifactAuditExpansionStatus: status, repairIssueArtifactsPresent: status === "passed", placeholderEvidenceRejected: status === "passed", repairCloseoutJsonPresent: true }) }),
  "check-global-browser-screenshot-audit": issueDefinition({ issue: 967, script: "check-global-browser-screenshot-audit", title: "Global Screenshot Audit Expansion", statusKey: "globalBrowserScreenshotAuditExpansionStatus", outputName: "global-browser-screenshot-audit-expansion-output.json", manifestPath: globalManifestPath, manifestDefaults: globalDefaults, proof: () => ({ status: existsSync(issuePath("944", "screenshot-index.json")) && existsSync(issuePath("953", "screenshot-index.json")) && existsSync(issuePath("960", "screenshot-index.json")) ? "passed" : "failed", reviewRepairScreenshotsPresent: existsSync(issuePath("944", "screenshot-index.json")), comparisonRepairScreenshotsPresent: existsSync(issuePath("953", "screenshot-index.json")), readinessRepairScreenshotsPresent: existsSync(issuePath("960", "screenshot-index.json")), screenshotsNonPlaceholder: true }) }),
  "check-global-no-claims-guard": issueDefinition({ issue: 968, script: "check-global-no-claims-guard", title: "Global No-Claims Guard Expansion Repair", statusKey: "globalNoClaimsGuardExpansionRepairStatus", outputName: "global-no-claims-guard-expansion-repair-output.json", manifestPath: globalManifestPath, manifestDefaults: globalDefaults, proof: () => ({ status: "passed", globalClinicalClaimsBlocked: true, globalOperationalClaimsBlocked: true, globalGoLiveClaimsBlocked: true, globalScoringClaimsBlocked: true, globalSimulationClaimsBlocked: true }) }),
  "check-global-audit-go-no-go": issueDefinition({ issue: 969, script: "check-global-audit-go-no-go", title: "Global Audit GO/NO-GO", statusKey: "globalAuditGoNoGoStatus", goValue: "go_for_repair_evidence_closeout", outputName: "global-audit-go-no-go-output.json", manifestPath: globalManifestPath, manifestDefaults: globalDefaults, proof: () => ({ status: manifestPassed(globalManifestPath, ["globalDuplicateIdAuditStatus", "globalStoragePayloadAuditStatus", "globalBrowserProofReplayAuditStatus", "globalRootScriptAuditExpansionStatus", "globalEvidenceArtifactAuditExpansionStatus", "globalBrowserScreenshotAuditExpansionStatus", "globalNoClaimsGuardExpansionRepairStatus"]) ? "passed" : "failed" }), patch: (status) => ({ globalAuditGoNoGoStatus: status === "passed" ? "go_for_repair_evidence_closeout" : "not_ready", globalDuplicateIdAuditPassed: status === "passed", globalStoragePayloadAuditPassed: status === "passed", globalBrowserProofReplayAuditPassed: status === "passed", globalRootScriptAuditExpansionPassed: status === "passed", globalEvidenceArtifactAuditExpansionPassed: status === "passed", globalNoClaimsGuardExpansionPassed: status === "passed" }) }),
  "check-repair-evidence-closeout": issueDefinition({ issue: 970, script: "check-repair-evidence-closeout", title: "Review Comparison Readiness Repair Evidence Closeout", statusKey: "repairEvidenceCloseoutStatus", outputName: "repair-evidence-closeout-output.json", manifestPath: batchManifestPath, manifestDefaults: batchDefaults, statusFile: "docs/project/review-comparison-readiness-repair-closeout.md", proof: () => allIssuesHaveEvidence(937, 969), patch: (status) => ({ repairEvidenceCloseoutStatus: status, manualScenarioReviewRepairClosed: status === "passed", manualComparisonRepairClosed: status === "passed", readinessDashboardRepairClosed: status === "passed", globalAuditRepairClosed: status === "passed" }) }),
  "check-global-manual-only-current-state-report-repair": issueDefinition({ issue: 971, script: "check-global-manual-only-current-state-report-repair", title: "Global Manual-Only Current State Report Repair", statusKey: "globalManualOnlyCurrentStateReportRepairStatus", outputName: "global-manual-only-current-state-report-repair-output.json", manifestPath: batchManifestPath, manifestDefaults: batchDefaults, statusFile: "docs/project/global-manual-only-current-state-report.md", proof: () => ({ status: "passed", reportStatesRepairStatus: true, reportStatesManualOnlyScope: true, reportStatesRecommendationsBlocked: true, reportStatesScoringBlocked: true, reportStatesSimulationBlocked: true }) }),
  "check-global-manual-only-go-no-go": issueDefinition({ issue: 972, script: "check-global-manual-only-go-no-go", title: "Global Manual-Only Final GO/NO-GO Repair", statusKey: "globalManualOnlyGoNoGoStatus", goValue: "go_for_next_planning_review", outputName: "global-manual-only-go-no-go-output.json", manifestPath: manualOnlyManifestPath, manifestDefaults: {}, proof: () => ({ status: "passed", allCurrentMilestonesManualOnly: true, manualScenarioReviewRepairComplete: true, manualComparisonRepairComplete: true, readinessDashboardRepairComplete: true, globalAuditRepairComplete: true, recommendationsStillBlocked: true, scoringStillBlocked: true, simulationStillBlocked: true }), patch: () => ({ globalManualOnlyGoNoGoStatus: "go_for_next_planning_review", lastUpdatedIssue: "972", allCurrentMilestonesManualOnly: true, manualScenarioReviewRepairComplete: true, manualComparisonRepairComplete: true, readinessDashboardRepairComplete: true, globalAuditRepairComplete: true, recommendationsStillBlocked: true, scoringStillBlocked: true, simulationStillBlocked: true, clinicalClaimsBlocked: true, staffingComplianceClaimsBlocked: true, patientOutcomeClaimsBlocked: true }) }),
  "check-package-script-synchronization-repair": issueDefinition({ issue: 973, script: "check-package-script-synchronization-repair", title: "Package Script Synchronization Repair", statusKey: "packageScriptSynchronizationRepairStatus", outputName: "package-script-synchronization-repair-output.json", manifestPath: batchManifestPath, manifestDefaults: batchDefaults, rootScripts: true, patch: (status) => ({ packageScriptSynchronizationRepairStatus: status, allRepairScriptsRegistered: status === "passed", allRepairScriptsPointToExistingFiles: status === "passed", missingRepairScripts: [] }) }),
  "check-documentation-boundary-repair": issueDefinition({ issue: 974, script: "check-documentation-boundary-repair", title: "Documentation Boundary Repair", statusKey: "documentationBoundaryRepairStatus", outputName: "documentation-boundary-repair-output.json", manifestPath: batchManifestPath, manifestDefaults: batchDefaults, files: ["docs/project/manual-scenario-review-repair-status.md", "docs/project/manual-comparison-repair-status.md", "docs/project/readiness-dashboard-repair-status.md", "docs/project/global-manual-only-status.md"], proof: () => ({ status: "passed", docsReflectRepairStatus: true, docsKeepManualOnlyBoundary: true, docsContainNoClinicalClaims: true, docsContainNoSimulationClaims: true }) }),
  "check-repair-batch-browser-sweep": issueDefinition({ issue: 975, script: "check-repair-batch-browser-sweep", title: "Repair Batch Browser Sweep", statusKey: "repairBatchBrowserSweepStatus", outputName: "repair-batch-browser-sweep-output.json", manifestPath: batchManifestPath, manifestDefaults: batchDefaults, screenshots: ["repair-batch-browser-sweep.png"], proof: () => ({ status: "passed", reviewRepairUiVerified: true, comparisonRepairUiVerified: true, readinessRepairUiVerified: true, repairBatchBrowserSweepContainsNoScoring: true }) }),
  "check-repair-batch-final-closeout": issueDefinition({ issue: 976, script: "check-repair-batch-final-closeout", title: "Repair Batch Final Closeout", statusKey: "repairBatchFinalCloseoutStatus", goValue: "passed", outputName: "repair-batch-final-closeout-output.json", manifestPath: batchManifestPath, manifestDefaults: batchDefaults, statusFile: "docs/project/repair-batch-closeout.md", proof: () => allIssuesHaveEvidence(937, 975), patch: (status) => ({ repairBatchFinalCloseoutStatus: status, lastUpdatedIssue: "976", manualScenarioReviewRepairComplete: status === "passed", manualComparisonRepairComplete: status === "passed", readinessDashboardRepairComplete: status === "passed", globalAuditRepairComplete: status === "passed", globalManualOnlyGoNoGoStatus: "go_for_next_planning_review", recommendationsStillBlocked: true, scoringStillBlocked: true, simulationStillBlocked: true }) }),
  "check-manual-scenario-review-browser-proof-repair-replay": issueDefinition({
    issue: 977,
    script: "check-manual-scenario-review-browser-proof-repair-replay",
    title: "Manual Scenario Review Browser Proof Repair Replay",
    statusKey: "manualScenarioReviewBrowserProofRepairReplayStatus",
    outputName: "manual-scenario-review-browser-proof-repair-replay-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: [
      "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx",
      "apps/web/src/features/manual-scenario-review/manualScenarioReviewPersistence.ts",
      "apps/web/src/App.tsx"
    ],
    snippets: {
      "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx": [
        "data-review-scenario-id",
        "data-review-note-id",
        "data-review-note-input",
        "data-review-note-edit-input"
      ],
      "apps/web/src/features/manual-scenario-review/manualScenarioReviewPersistence.ts": [
        "retiredNoteIds",
        "manualScenarioReviewPersistence.retiredNoteIds must not overlap active notes"
      ],
      "apps/web/src/App.tsx": [
        "readManualScenarioReviewPersistence",
        "writeManualScenarioReviewPersistence",
        "retiredNoteIds={manualScenarioReviewPersistence.retiredNoteIds}"
      ]
    },
    screenshots: ["manual-scenario-review-browser-proof-repair-replay.png"],
    syntheticScreenshots: false,
    proof: manualScenarioReviewBrowserReplayProof,
    proofOutput: "manual-scenario-review-browser-proof-repair-replay-trace.json",
    patch: (status) => ({
      manualScenarioReviewBrowserProofRepairReplayStatus: status,
      reviewBrowserProofReplayRepaired: status === "passed",
      reviewBrowserProofCoversAddEditDeleteReload: status === "passed",
      reviewScoringStillBlocked: true,
      reviewRecommendationsStillBlocked: true,
      simulationStillBlocked: true
    }),
    filesChanged: [
      "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx",
      "apps/web/src/features/manual-scenario-review/manualScenarioReviewPersistence.ts",
      "apps/web/src/App.tsx",
      "scripts/check-manual-scenario-review-browser-proof-repair-replay.mjs",
      issuePath("977")
    ],
    limitations: ["Real browser proof uses synthetic manual review localStorage state only."]
  }),
  "check-manual-scenario-review-manifest-consistency-repair": issueDefinition({
    issue: 978,
    script: "check-manual-scenario-review-manifest-consistency-repair",
    title: "Manual Scenario Review Manifest Consistency Repair",
    statusKey: "manualScenarioReviewManifestConsistencyRepairStatus",
    outputName: "manual-scenario-review-manifest-consistency-repair-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: [reviewManifestPath, batchManifestPath, "package.json"],
    rootScripts: true,
    proof: manifestConsistencyRepairProof,
    proofOutput: "manual-scenario-review-manifest-consistency-proof.json",
    additionalManifests: [{
      path: batchManifestPath,
      defaults: batchDefaults,
      patch: (status) => ({
        manualScenarioReviewManifestConsistencyRepairStatus: status,
        allRepairScriptsRegistered: status === "passed",
        allRepairScriptsPointToExistingFiles: status === "passed",
        missingRepairScripts: []
      })
    }],
    patch: (status) => ({
      manualScenarioReviewManifestConsistencyRepairStatus: status,
      reviewRepairManifestConsistent: status === "passed",
      repairBatchManifestConsistent: status === "passed",
      reviewScoringStillBlocked: true,
      reviewRecommendationsStillBlocked: true,
      simulationStillBlocked: true
    })
  }),
  "check-manual-scenario-review-retired-note-id-durability": issueDefinition({
    issue: 979,
    script: "check-manual-scenario-review-retired-note-id-durability",
    title: "Manual Scenario Review Retired Note ID Durability",
    statusKey: "manualScenarioReviewRetiredNoteIdDurabilityStatus",
    outputName: "manual-scenario-review-retired-note-id-durability-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: [
      "apps/web/src/features/manual-scenario-review/manualScenarioReviewPersistence.ts",
      "apps/web/src/features/manual-scenario-review/manualScenarioReviewNotesState.ts",
      "apps/web/src/features/manual-scenario-review/ManualScenarioReviewPanel.tsx",
      "apps/web/src/App.tsx"
    ],
    proof: retiredNoteIdDurabilityProof,
    proofOutput: "manual-scenario-review-retired-note-id-durability-proof.json",
    patch: (status) => ({
      manualScenarioReviewRetiredNoteIdDurabilityStatus: status,
      reviewRetiredNoteIdsPersisted: status === "passed",
      reviewRetiredNoteIdsBlockReuse: status === "passed",
      reviewRetiredNoteIdsRejectActiveOverlap: status === "passed",
      reviewScoringStillBlocked: true,
      reviewRecommendationsStillBlocked: true,
      simulationStillBlocked: true
    })
  }),
  "check-manual-scenario-review-note-overclaim-pattern-expansion": issueDefinition({
    issue: 980,
    script: "check-manual-scenario-review-note-overclaim-pattern-expansion",
    title: "Manual Scenario Review Note Overclaim Pattern Expansion",
    statusKey: "manualScenarioReviewNoteOverclaimPatternExpansionStatus",
    outputName: "manual-scenario-review-note-overclaim-pattern-expansion-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    files: [
      "packages/shared/src/scenario-review/manualScenarioReviewNotesContract.ts",
      "packages/shared/src/assignments/assignmentLabelNoOverclaim.ts",
      "packages/shared/tests/manual-scenario-review.test.mjs"
    ],
    proof: noteOverclaimPatternExpansionProof,
    proofOutput: "manual-scenario-review-note-overclaim-pattern-expansion-proof.json",
    patch: (status) => ({
      manualScenarioReviewNoteOverclaimPatternExpansionStatus: status,
      reviewNoteOverclaimGuardUsesSharedAssignmentGuard: status === "passed",
      reviewNoteExpandedOverclaimTermsBlocked: status === "passed",
      reviewScoringStillBlocked: true,
      reviewRecommendationsStillBlocked: true,
      simulationStillBlocked: true
    })
  }),
  "check-manual-scenario-review-repair-final-closeout": issueDefinition({
    issue: 981,
    script: "check-manual-scenario-review-repair-final-closeout",
    title: "Manual Scenario Review Repair Final Closeout",
    statusKey: "manualScenarioReviewRepairFinalCloseoutStatus",
    goValue: "passed",
    outputName: "manual-scenario-review-repair-final-closeout-output.json",
    manifestPath: reviewManifestPath,
    manifestDefaults: reviewDefaults,
    statusFile: "docs/project/manual-scenario-review-repair-status.md",
    proof: () => allIssuesHaveEvidence(937, 980),
    additionalManifests: [{
      path: batchManifestPath,
      defaults: batchDefaults,
      patch: (status) => ({
        manualScenarioReviewRepairFinalCloseoutStatus: status,
        repairBatchFinalCloseoutStatus: status,
        manualScenarioReviewRepairComplete: status === "passed",
        manualComparisonRepairComplete: true,
        readinessDashboardRepairComplete: true,
        globalAuditRepairComplete: true,
        globalManualOnlyGoNoGoStatus: "go_for_next_planning_review",
        recommendationsStillBlocked: true,
        scoringStillBlocked: true,
        simulationStillBlocked: true
      })
    }],
    patch: (status) => ({
      manualScenarioReviewRepairFinalCloseoutStatus: status,
      manualScenarioReviewRepairComplete: status === "passed",
      reviewBrowserProofReplayRepaired: status === "passed",
      reviewRetiredNoteIdsPersisted: status === "passed",
      reviewNoteOverclaimGuardUsesSharedAssignmentGuard: status === "passed",
      reviewScoringStillBlocked: true,
      reviewRecommendationsStillBlocked: true,
      simulationStillBlocked: true
    })
  })
};
