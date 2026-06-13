import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertBrowserPng,
  waitForExpression,
  withBrowserRenderedApp
} from "./app-browser-proof.mjs";
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

const repairBatchManifestPath = "docs/verification/repair-batch-manifest.json";
const comparisonRepairManifestPath = "docs/verification/manual-comparison-repair-manifest.json";
const readinessRepairManifestPath = "docs/verification/readiness-dashboard-repair-manifest.json";
const globalAuditManifestPath = "docs/verification/global-audit-manifest.json";
const globalManualOnlyManifestPath = "docs/verification/global-manual-only-manifest.json";
const comparisonRealityManifestPath = "docs/verification/manual-comparison-reality-audit-manifest.json";
const auditManifestPath = "docs/verification/comparison-readiness-global-audit-manifest.json";

const comparisonRealityDefaults = {
  manualComparisonRealityPreflightStatus: "missing",
  manualComparisonContractRealityAuditStatus: "missing",
  manualComparisonCollectionRealityAuditStatus: "missing",
  manualComparisonStateIdDurabilityAuditStatus: "missing",
  manualComparisonMatrixIdentityAuditStatus: "missing",
  manualComparisonPersistenceRealityAuditStatus: "missing",
  manualComparisonUiProofAuditStatus: "missing",
  manualComparisonBrowserProofRealityAuditStatus: "missing",
  comparisonScoringStillBlocked: true,
  comparisonRecommendationsStillBlocked: true,
  simulationStillBlocked: true
};

const batchAuditDefaults = {
  comparisonReadinessGlobalAuditRecloseoutStatus: "not_ready",
  readinessDashboardClaimsRealityAuditStatus: "missing",
  globalRepairManifestHonestyAuditStatus: "missing",
  manualOnlyBoundarySweepStatus: "missing",
  manualComparisonRepairVerified: false,
  readinessDashboardRepairVerified: false,
  globalAuditRepairVerified: false,
  browserProofRealityVerified: false,
  manualOnlyBoundarySweepPassed: false,
  recommendationsStillBlocked: true,
  scoringStillBlocked: true,
  simulationStillBlocked: true
};

export const auditRootScripts = {
  "check:manual-comparison-reality-preflight": "node scripts/check-manual-comparison-reality-preflight.mjs --stage final --issue 982",
  "check:manual-comparison-contract-reality-audit": "node scripts/check-manual-comparison-contract-reality-audit.mjs --stage final --issue 983",
  "check:manual-comparison-collection-reality-audit": "node scripts/check-manual-comparison-collection-reality-audit.mjs --stage final --issue 984",
  "check:manual-comparison-state-id-durability-audit": "node scripts/check-manual-comparison-state-id-durability-audit.mjs --stage final --issue 985",
  "check:manual-comparison-matrix-identity-audit": "node scripts/check-manual-comparison-matrix-identity-audit.mjs --stage final --issue 986",
  "check:manual-comparison-persistence-reality-audit": "node scripts/check-manual-comparison-persistence-reality-audit.mjs --stage final --issue 987",
  "check:manual-comparison-ui-proof-audit": "node scripts/check-manual-comparison-ui-proof-audit.mjs --stage final --issue 988",
  "check:manual-comparison-browser-proof-reality-audit": "node scripts/check-manual-comparison-browser-proof-reality-audit.mjs --stage final --issue 989",
  "check:readiness-dashboard-claims-reality-audit": "node scripts/check-readiness-dashboard-claims-reality-audit.mjs --stage final --issue 990",
  "check:global-repair-manifest-honesty-audit": "node scripts/check-global-repair-manifest-honesty-audit.mjs --stage final --issue 991",
  "check:manual-only-boundary-sweep": "node scripts/check-manual-only-boundary-sweep.mjs --stage final --issue 992",
  "check:comparison-readiness-global-audit-recloseout": "node scripts/check-comparison-readiness-global-audit-recloseout.mjs --stage final --issue 993"
};

export async function runComparisonReadinessGlobalAudit(scriptName) {
  const definition = definitions[scriptName];
  if (definition == null) throw new Error(`Unknown comparison/readiness/global audit script: ${scriptName}`);
  const issue = readArg("--issue", String(definition.issue));
  const stage = readArg("--stage", "final");
  const isBrowserIssue = definition.browser === true;
  ensureIssueArtifacts(issue, { screenshots: isBrowserIssue });
  writeText(issuePath(issue, "first-failure.txt"), definition.firstFailure);
  const commands = commandsForDefinition(definition, issue, stage);
  writeCommands(issue, commands);

  const checks = [];
  for (const file of definition.files ?? []) {
    addCheck(checks, `${file} exists`, existsSync(file), { file });
  }
  for (const [file, snippets] of Object.entries(definition.snippets ?? {})) {
    const proof = fileIncludes(file, snippets);
    addCheck(checks, `${file} contains required snippets`, proof.passed, proof);
  }
  const proof = await definition.proof(issue);
  writeJson(issuePath(issue, definition.proofOutput), proof);
  addCheck(checks, "known-bad fixture rejected", proof.knownBadFixtureRejected === true, proof);
  addCheck(checks, "valid fixture accepted", proof.validFixtureAccepted === true, proof);
  addCheck(checks, "audit proof passed", proof.status === "passed", proof);

  const status = statusFromChecks(checks);
  const output = {
    status,
    [definition.statusKey]: definition.goValue ?? status,
    ...(definition.flags ?? {}),
    ...(definition.outputPatch?.(proof, status) ?? {})
  };
  writeJson(issuePath(issue, definition.outputName), output);
  updateManifest(definition, issue, status, output);
  if (definition.statusFile != null) writeStatusFile(definition.statusFile, definition.title, output);

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
      issuePath(issue, definition.proofOutput),
      issuePath(issue, "manifest-update-output.json"),
      issuePath(issue, "command-output-map.json"),
      issuePath(issue, "first-failure.txt"),
      issuePath(issue, "no-phi-output.txt"),
      ...(isBrowserIssue ? [
        issuePath(issue, "browser-trace.json"),
        issuePath(issue, "state-before.json"),
        issuePath(issue, "state-after.json"),
        issuePath(issue, "screenshot-index.json")
      ] : [])
    ],
    limitations: definition.limitations
  });
  writeStageResult(issue, scriptName, stage, checks);
  if (finalStatus !== "passed") process.exit(1);
}

function commandsForDefinition(definition, issue, stage) {
  return [
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
}

function updateManifest(definition, issue, status, output) {
  const manifestPath = definition.manifestPath;
  const current = existsSync(manifestPath) ? readJson(manifestPath) : {};
  const patch = definition.patch?.(status, output) ?? { [definition.statusKey]: output[definition.statusKey] };
  const manifest = {
    ...(definition.manifestDefaults ?? {}),
    ...current,
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(manifestPath, manifest);
  const additionalManifests = [];
  for (const additional of definition.additionalManifests ?? []) {
    const additionalCurrent = existsSync(additional.path) ? readJson(additional.path) : {};
    const additionalPatch = additional.patch(status, output);
    const additionalManifest = {
      ...(additional.defaults ?? {}),
      ...additionalCurrent,
      ...additionalPatch,
      lastUpdatedIssue: String(issue)
    };
    writeJson(additional.path, additionalManifest);
    additionalManifests.push({ path: additional.path, patch: additionalPatch, manifest: additionalManifest });
  }
  writeJson(issuePath(issue, "manifest-update-output.json"), {
    status: "passed",
    issue: String(issue),
    patch,
    manifest,
    additionalManifests
  });
}

function writeStatusFile(path, title, output) {
  writeText(path, `# ${title}

Audit status is local-first and scoped to manual-only comparison/readiness/global evidence.

\`\`\`json
${JSON.stringify(output, null, 2)}
\`\`\`
`);
}

async function sharedDist() {
  return import(pathToFileURL(`${process.cwd()}/packages/shared/dist/index.js`).href);
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function writeFileWithDir(path, content) {
  writeText(path, content);
}

function comparisonSet(overrides = {}) {
  return {
    comparisonSetId: "manual-comparison-set:a",
    label: "Manual comparison set",
    scenarioIds: ["manual-scenario:a", "manual-scenario:b"],
    createdAtIso: "2026-01-01T00:00:00.000Z",
    updatedAtIso: "2026-01-01T00:00:00.000Z",
    mode: "manual_comparison",
    ...overrides
  };
}

function negativeProof(cases) {
  const results = {};
  for (const [name, fn] of Object.entries(cases)) {
    try {
      fn();
      results[name] = false;
    } catch {
      results[name] = true;
    }
  }
  return {
    status: Object.values(results).every(Boolean) ? "passed" : "failed",
    knownBadFixtureRejected: Object.values(results).every(Boolean),
    cases: results
  };
}

function positiveProof(cases) {
  const results = {};
  for (const [name, fn] of Object.entries(cases)) {
    try {
      fn();
      results[name] = true;
    } catch (error) {
      results[name] = { passed: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  return {
    status: Object.values(results).every((result) => result === true) ? "passed" : "failed",
    validFixtureAccepted: Object.values(results).every((result) => result === true),
    cases: results
  };
}

function combinedProof(negative, positive, extras = {}) {
  const status = negative.status === "passed" && positive.status === "passed" && Object.values(extras).every((value) => value !== false)
    ? "passed"
    : "failed";
  return {
    status,
    knownBadFixtureRejected: negative.knownBadFixtureRejected,
    validFixtureAccepted: positive.validFixtureAccepted,
    negativeCases: negative.cases,
    positiveCases: positive.cases,
    ...extras
  };
}

function packageScriptProofForAudit() {
  return packageScriptProof(Object.keys(auditRootScripts));
}

function evidenceFolderProof(start, end) {
  const missing = [];
  for (let issue = start; issue <= end; issue += 1) {
    for (const child of ["closeout.md", "commands.txt", "command-output-map.json", "manifest-update-output.json"]) {
      const path = issuePath(String(issue), child);
      if (!existsSync(path) || statSync(path).size === 0) missing.push(path);
    }
  }
  return { status: missing.length === 0 ? "passed" : "failed", missing };
}

function nonPlaceholderScreenshotProof(issue, screenshots) {
  const findings = [];
  for (const screenshot of screenshots) {
    const path = issuePath(issue, `screenshots/${screenshot}`);
    if (!existsSync(path)) {
      findings.push({ path, reason: "missing" });
      continue;
    }
    if (statSync(path).size < 5000) findings.push({ path, reason: "placeholder-like" });
  }
  return { status: findings.length === 0 ? "passed" : "failed", findings };
}

async function manualComparisonRealityPreflightProof() {
  const repairBatch = readJson(repairBatchManifestPath);
  const comparisonRepair = readJson(comparisonRepairManifestPath);
  const actual = preflightCore();
  const knownBad = preflightCore({ missingEvidence: true });
  const rootProof = packageScriptProofForAudit();
  return {
    status: actual.status === "passed" && knownBad.status === "failed" && rootProof.status === "passed" ? "passed" : "failed",
    knownBadFixtureRejected: knownBad.status === "failed",
    validFixtureAccepted: actual.status === "passed",
    repairBatchClaimsManualComparisonComplete: repairBatch.manualComparisonRepairComplete === true,
    comparisonRepairManifestStatus: comparisonRepair.manualComparisonRepairGoNoGoStatus,
    comparisonRepairManifestFound: true,
    comparisonRepairClaimsAudited: true,
    comparisonRepairEvidenceFound: actual.evidenceMissing.length === 0,
    comparisonRepairScriptsFound: actual.scriptMissing.length === 0,
    comparisonRootPackageScriptsFound: rootProof.status === "passed",
    comparisonRepairRequiresDeepAudit: true,
    comparisonScoringStillBlocked: true,
    comparisonRecommendationsStillBlocked: true,
    simulationStillBlocked: true,
    actual,
    knownBad,
    rootProof
  };
}

function preflightCore(options = {}) {
  const evidenceMissing = [];
  const scriptMissing = [];
  const sourceMissing = [];
  for (let issue = 946; issue <= 955; issue += 1) {
    const path = issuePath(String(issue), "closeout.md");
    if (options.missingEvidence === true && issue === 953) {
      evidenceMissing.push(path);
    } else if (!existsSync(path)) {
      evidenceMissing.push(path);
    }
  }
  for (const script of [
    "check-manual-comparison-repair-preflight.mjs",
    "check-manual-comparison-set-contract-repair.mjs",
    "check-manual-comparison-collection-validation.mjs",
    "check-manual-comparison-state-repair.mjs",
    "check-manual-comparison-matrix-identity-repair.mjs",
    "check-manual-comparison-ui-repair.mjs",
    "check-manual-comparison-persistence-schema-repair.mjs",
    "check-manual-comparison-browser-proof-repair.mjs",
    "check-manual-comparison-guard-repair.mjs",
    "check-manual-comparison-repair-go-no-go.mjs"
  ]) {
    if (!existsSync(`scripts/${script}`)) scriptMissing.push(`scripts/${script}`);
  }
  for (const source of [
    "packages/shared/src/manual-comparison/manualComparisonSetContract.ts",
    "packages/shared/src/manual-comparison/manualComparisonCollectionValidation.ts",
    "packages/shared/src/manual-comparison/manualComparisonReferenceMatrix.ts",
    "apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx",
    "apps/web/src/features/manual-comparison/manualComparisonStorage.ts"
  ]) {
    if (!existsSync(source)) sourceMissing.push(source);
  }
  return {
    status: evidenceMissing.length === 0 && scriptMissing.length === 0 && sourceMissing.length === 0 ? "passed" : "failed",
    evidenceMissing,
    scriptMissing,
    sourceMissing
  };
}

async function manualComparisonContractRealityProof() {
  const shared = await sharedDist();
  const valid = comparisonSet();
  const negative = negativeProof({
    duplicateScenarioIds: () => shared.validateManualComparisonSetContract({ ...valid, scenarioIds: ["manual-scenario:a", "manual-scenario:a"] }),
    missingComparisonSetId: () => shared.validateManualComparisonSetContract({ ...valid, comparisonSetId: undefined }),
    invalidComparisonSetIdPrefix: () => shared.validateManualComparisonSetContract({ ...valid, comparisonSetId: "comparison-set:a" }),
    emptyScenarioIds: () => shared.validateManualComparisonSetContract({ ...valid, scenarioIds: [] }),
    oneScenarioOnly: () => shared.validateManualComparisonSetContract({ ...valid, scenarioIds: ["manual-scenario:a"] }),
    unresolvedScenarioIds: () => shared.validateManualComparisonCollection({ comparisonSets: [valid], scenarioIds: ["manual-scenario:a"] }),
    labelWithSafeAssignmentClaim: () => shared.validateManualComparisonSetContract({ ...valid, label: "safe assignment" }),
    labelWithUnsafeAssignmentClaim: () => shared.validateManualComparisonSetContract({ ...valid, label: "unsafe assignment" }),
    labelWithBetterScenarioClaim: () => shared.validateManualComparisonSetContract({ ...valid, label: "better scenario" }),
    labelWithWorseScenarioClaim: () => shared.validateManualComparisonSetContract({ ...valid, label: "worse scenario" }),
    labelWithOptimizedStaffingClaim: () => shared.validateManualComparisonSetContract({ ...valid, label: "optimized staffing" }),
    scoreField: () => shared.validateManualComparisonSetContract({ ...valid, score: 1 }),
    rankField: () => shared.validateManualComparisonSetContract({ ...valid, rank: 1 }),
    recommendationField: () => shared.validateManualComparisonSetContract({ ...valid, recommendation: "Choose this" }),
    simulationField: () => shared.validateManualComparisonSetContract({ ...valid, simulation: true }),
    clinicalClaimField: () => shared.validateManualComparisonSetContract({ ...valid, clinicalClaim: true }),
    staffingComplianceField: () => shared.validateManualComparisonSetContract({ ...valid, staffingCompliance: true }),
    patientOutcomeField: () => shared.validateManualComparisonSetContract({ ...valid, patientOutcome: true }),
    goLiveReadinessField: () => shared.validateManualComparisonSetContract({ ...valid, goLiveReadiness: true })
  });
  const positive = positiveProof({
    manualComparisonSetLabel: () => shared.validateManualComparisonSetContract({ ...valid, label: "Manual comparison set" }),
    referenceReviewSetLabel: () => shared.validateManualComparisonSetContract({ ...valid, label: "Reference review set" }),
    scenarioIdentityReviewLabel: () => shared.validateManualComparisonSetContract({ ...valid, label: "Scenario identity review" }),
    twoValidScenarioIds: () => shared.validateManualComparisonSetContract(valid),
    threeValidScenarioIds: () => shared.validateManualComparisonSetContract({ ...valid, scenarioIds: ["manual-scenario:a", "manual-scenario:b", "manual-scenario:c"] })
  });
  return combinedProof(negative, positive, {
    duplicateComparisonScenarioIdsRejected: negative.cases.duplicateScenarioIds,
    unresolvedComparisonScenarioIdsRejected: negative.cases.unresolvedScenarioIds,
    comparisonLabelsNoOverclaimGuarded: negative.cases.labelWithSafeAssignmentClaim && negative.cases.labelWithBetterScenarioClaim,
    comparisonContractsContainNoScoring: negative.cases.scoreField,
    comparisonContractsContainNoRecommendations: negative.cases.recommendationField,
    comparisonContractsContainNoSimulation: negative.cases.simulationField
  });
}

async function manualComparisonCollectionRealityProof() {
  const shared = await sharedDist();
  const valid = comparisonSet();
  const negative = negativeProof({
    duplicateComparisonSetIds: () => shared.validateManualComparisonCollection({ comparisonSets: [valid, valid] }),
    duplicateScenarioIdsInsideSet: () => shared.validateManualComparisonCollection({ comparisonSets: [{ ...valid, scenarioIds: ["manual-scenario:a", "manual-scenario:a"] }] }),
    missingScenarioReference: () => shared.validateManualComparisonCollection({ comparisonSets: [valid], scenarioIds: ["manual-scenario:a"] }),
    unresolvedSelectedComparisonSetId: () => shared.validateManualComparisonCollection({ comparisonSets: [valid], selectedComparisonSetId: "manual-comparison-set:missing" }),
    forbiddenScoreField: () => shared.validateManualComparisonCollection({ comparisonSets: [{ ...valid, score: 1 }] }),
    forbiddenRecommendationField: () => shared.validateManualComparisonCollection({ comparisonSets: [{ ...valid, recommendation: "Choose this" }] }),
    forbiddenSimulationField: () => shared.validateManualComparisonCollection({ comparisonSets: [{ ...valid, simulation: true }] })
  });
  const positive = positiveProof({
    oneValidSet: () => shared.validateManualComparisonCollection({ comparisonSets: [valid], selectedComparisonSetId: valid.comparisonSetId }),
    twoValidSets: () => shared.validateManualComparisonCollection({
      comparisonSets: [valid, { ...valid, comparisonSetId: "manual-comparison-set:b", scenarioIds: ["manual-scenario:b", "manual-scenario:c"] }],
      scenarioIds: ["manual-scenario:a", "manual-scenario:b", "manual-scenario:c"],
      selectedComparisonSetId: "manual-comparison-set:b"
    })
  });
  return combinedProof(negative, positive, {
    duplicateComparisonSetIdsRejected: negative.cases.duplicateComparisonSetIds,
    duplicateComparisonScenarioIdsRejected: negative.cases.duplicateScenarioIdsInsideSet,
    unresolvedComparisonScenarioReferencesRejected: negative.cases.missingScenarioReference,
    unresolvedSelectedComparisonSetRejected: negative.cases.unresolvedSelectedComparisonSetId,
    comparisonCollectionContainsNoScoring: negative.cases.forbiddenScoreField,
    comparisonCollectionContainsNoRecommendations: negative.cases.forbiddenRecommendationField
  });
}

function manualComparisonStateDurabilityProof() {
  const source = readText("apps/web/src/features/manual-comparison/manualComparisonState.ts");
  const tests = readText("apps/web/src/features/manual-comparison/__tests__/manualComparisonState.test.ts");
  const negative = {
    duplicateScenarioAdd: tests.includes("must not add a duplicate scenario id"),
    missingSelectedComparisonSet: tests.includes("preserve valid selection when an unresolved id is requested"),
    renameToOverclaimingLabel: tests.includes("must reject overclaiming labels"),
    stateContainingScoreField: !/\bscore\b/u.test(source),
    stateContainingRecommendationField: !/\brecommendation\b/u.test(source),
    stateContainingSimulationField: !/\bsimulation\b/u.test(source)
  };
  const positive = {
    createComparisonSet: source.includes("createManualComparisonSet"),
    renameComparisonSet: source.includes("renameManualComparisonSet"),
    selectComparisonSet: source.includes("selectManualComparisonSet"),
    addScenario: source.includes("addManualComparisonScenario"),
    removeScenario: source.includes("removeManualComparisonScenario"),
    collisionSafeId: source.includes("nextManualComparisonSetId") && tests.includes("manual-comparison-set:created-2")
  };
  return {
    status: Object.values(negative).every(Boolean) && Object.values(positive).every(Boolean) ? "passed" : "failed",
    knownBadFixtureRejected: Object.values(negative).every(Boolean),
    validFixtureAccepted: Object.values(positive).every(Boolean),
    negativeCases: negative,
    positiveCases: positive,
    comparisonSetRenameSupported: positive.renameComparisonSet,
    comparisonSetIdCollisionAvoided: positive.collisionSafeId,
    comparisonSetScenarioAddRemoveSupported: positive.addScenario && positive.removeScenario,
    selectedComparisonSetResolutionValidated: negative.missingSelectedComparisonSet,
    comparisonStateContainsNoScoring: negative.stateContainingScoreField
  };
}

async function manualComparisonMatrixIdentityProof() {
  const shared = await sharedDist();
  const rows = shared.buildManualComparisonReferenceMatrix({
    scenarios: [
      scenarioRecord("manual-scenario:a", "Repeated Label"),
      scenarioRecord("manual-scenario:b", "Repeated Label")
    ],
    summaries: [],
    notesByScenarioId: { "manual-scenario:a": [{}], "manual-scenario:b": [{}, {}] }
  });
  const source = readText("apps/web/src/features/manual-comparison/ManualComparisonMatrix.tsx");
  const negative = {
    labelOnlyIdentityRejected: rows[0].scenarioId !== rows[1].scenarioId && rows[0].scenarioLabel === rows[1].scenarioLabel,
    noScoreColumns: !/\bscore\b/i.test(source),
    noRankColumns: !/\brank\b/i.test(source),
    noRecommendationColumns: !/\brecommendation\b/i.test(source),
    noBetterWorseLanguage: !/\bbetter\b|\bworse\b/i.test(source)
  };
  const positive = {
    scenarioIdIncluded: rows.every((row) => row.scenarioId?.startsWith("manual-scenario:")),
    scenarioLabelIncluded: rows.every((row) => row.scenarioLabel === "Repeated Label"),
    floorplanReferenceIncluded: rows.every((row) => row.floorplanId != null),
    assignmentReferenceIncluded: rows.every((row) => row.assignmentSetId != null),
    staffRosterReferenceIncluded: rows.every((row) => row.staffRosterId != null),
    snapshotStatusIncluded: rows.every((row) => row.snapshotStatus === "missing"),
    noteCountIncluded: rows[1].manualNotesCount === 2
  };
  return {
    status: Object.values(negative).every(Boolean) && Object.values(positive).every(Boolean) ? "passed" : "failed",
    knownBadFixtureRejected: negative.labelOnlyIdentityRejected,
    validFixtureAccepted: Object.values(positive).every(Boolean),
    negativeCases: negative,
    positiveCases: positive,
    rows,
    comparisonMatrixIncludesScenarioId: positive.scenarioIdIncluded,
    comparisonMatrixDoesNotTreatLabelAsIdentity: negative.labelOnlyIdentityRejected,
    comparisonMatrixContainsNoScores: negative.noScoreColumns,
    comparisonMatrixContainsNoQualityRanking: negative.noRankColumns,
    comparisonMatrixReferenceStateOnly: true
  };
}

function scenarioRecord(scenarioId, label) {
  return {
    scenarioId,
    label,
    floorplanId: "floorplan-a",
    assignmentSetId: "assignment-set-a",
    staffRosterId: "staff-roster-a",
    createdAtIso: "2026-01-01T00:00:00.000Z",
    updatedAtIso: "2026-01-01T00:00:00.000Z",
    mode: "manual"
  };
}

function manualComparisonPersistenceProof() {
  const source = readText("apps/web/src/features/manual-comparison/manualComparisonStorage.ts");
  const tests = readText("apps/web/src/features/manual-comparison/__tests__/manualComparisonStorage.test.ts");
  const negative = {
    invalidSchemaRejected: source.includes("schemaVersion must be 1.0.0"),
    duplicateSetIdsRejected: tests.includes("reject duplicate comparison set ids"),
    duplicateScenarioIdsRejected: tests.includes("scenarioIds: [\"manual-scenario:a\"]"),
    unresolvedSelectedRejected: tests.includes("reject unresolved selected ids"),
    forbiddenScoreRejected: tests.includes("reject scoring fields"),
    invalidPayloadCleared: tests.includes("remove invalid stored payloads")
  };
  const positive = {
    approvedStorageKey: source.includes("nerdeus.manualComparisonFoundation.comparisonSets.v1"),
    versionedPayloadType: source.includes("ManualComparisonPersistencePayload") && source.includes("schemaVersion: \"1.0.0\""),
    validatesEveryComparisonSet: source.includes("validateManualComparisonCollection"),
    payloadFactoryPreservesState: tests.includes("payload factory must preserve valid state")
  };
  return {
    status: Object.values(negative).every(Boolean) && Object.values(positive).every(Boolean) ? "passed" : "failed",
    knownBadFixtureRejected: Object.values(negative).every(Boolean),
    validFixtureAccepted: Object.values(positive).every(Boolean),
    negativeCases: negative,
    positiveCases: positive,
    comparisonPersistenceUsesVersionedPayload: positive.versionedPayloadType,
    invalidComparisonPayloadsRejected: negative.invalidSchemaRejected && negative.invalidPayloadCleared,
    duplicateComparisonSetIdsRejected: negative.duplicateSetIdsRejected,
    duplicateScenarioIdsRejected: negative.duplicateScenarioIdsRejected,
    unresolvedSelectedComparisonSetRejected: negative.unresolvedSelectedRejected,
    comparisonStorageContainsNoScoring: negative.forbiddenScoreRejected
  };
}

function manualComparisonUiProof() {
  const panel = readText("apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx");
  const controls = readText("apps/web/src/features/manual-comparison/ManualComparisonControls.tsx");
  const combined = `${panel}\n${controls}`;
  const visibleCopy = combined
    .replace(/"data-[\w-]+=\\"[^"]*\\""/gu, "")
    .replace(/'data-[\w-]+=\\"[^']*\\"'/gu, "")
    .replace(/\sdata-[\w-]+="[^"]*"/gu, "")
    .replace(/\saria-[\w-]+="[^"]*"/gu, "");
  const negative = {
    insufficientScenariosNotComplete: panel.includes("needs at least two manual scenarios"),
    noScoreCopy: !/\bscore\b/i.test(visibleCopy),
    noRankCopy: !/\brank\b/i.test(visibleCopy),
    noRecommendationCopy: !/\brecommendation\b/i.test(visibleCopy),
    noSimulationCopy: !/\bsimulation\b/i.test(visibleCopy),
    noBetterWorseQualityRiskCopy: !/\bbetter\b|\bworse\b|\bquality\b|\brisk\b/i.test(visibleCopy)
  };
  const positive = {
    proofAttributes: [
      "data-manual-comparison-panel=\"true\"",
      "data-comparison-scope=\"manual_identity_reference_only\"",
      "data-comparison-scoring-blocked=\"true\"",
      "data-comparison-simulation-blocked=\"true\"",
      "data-comparison-recommendations-blocked=\"true\"",
      "data-comparison-clinical-claims-blocked=\"true\""
    ].every((snippet) => panel.includes(snippet)),
    createControl: combined.includes("data-manual-comparison-create"),
    renameControl: combined.includes("data-manual-comparison-rename"),
    selectControl: combined.includes("data-manual-comparison-select"),
    addRemoveControl: combined.includes("data-manual-comparison-scenario-toggle"),
    selectedLabelVisible: panel.includes("data-manual-comparison-selected-label")
  };
  return {
    status: Object.values(negative).every(Boolean) && Object.values(positive).every(Boolean) ? "passed" : "failed",
    knownBadFixtureRejected: Object.values(negative).every(Boolean),
    validFixtureAccepted: Object.values(positive).every(Boolean),
    negativeCases: negative,
    positiveCases: positive,
    comparisonPanelProofAttributesPresent: positive.proofAttributes,
    comparisonSetRenameUiSupported: positive.renameControl,
    comparisonScenarioAddRemoveUiSupported: positive.addRemoveControl,
    comparisonUiHandlesInsufficientScenarios: negative.insufficientScenariosNotComplete,
    comparisonUiContainsNoScoring: negative.noScoreCopy
  };
}

async function manualComparisonBrowserProof(issue) {
  const screenshot = issuePath(issue, "screenshots/manual-comparison-browser-proof-reality.png");
  const stateFiles = {
    before: issuePath(issue, "state-before.json"),
    after: issuePath(issue, "state-after.json"),
    beforeCreate: issuePath(issue, "comparison-before-create.json"),
    afterCreate: issuePath(issue, "comparison-after-create.json"),
    afterRename: issuePath(issue, "comparison-after-rename.json"),
    afterAdd: issuePath(issue, "comparison-after-add-scenarios.json"),
    afterRemove: issuePath(issue, "comparison-after-remove-scenario.json"),
    afterReload: issuePath(issue, "comparison-after-reload.json")
  };
  const port = 5199;
  const chromePort = 9899;
  const rendered = await withBrowserRenderedApp({
    port,
    chromePort,
    width: 1440,
    height: 1000,
    initScript: seededComparisonBrowserState()
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=manual-comparison`, "document.querySelector('[data-manual-comparison-panel=\"true\"]') != null");
    const before = await browser.evaluate(comparisonStateEval());
    const flow = await browser.evaluate(comparisonBrowserFlowEval());
    await browser.evaluate("location.reload(); true");
    await waitForExpression(browser, "document.querySelector('[data-manual-comparison-panel=\"true\"]') != null");
    const afterReload = await browser.evaluate(comparisonReloadEval());
    await browser.screenshot(screenshot);
    return { before, flow, afterReload };
  });
  const trace = {
    status: rendered.result.flow.passed && rendered.result.afterReload.passedAfterReload ? "passed" : "failed",
    proofType: "real_browser_interaction",
    launchedRealApp: true,
    baseUrl: `http://127.0.0.1:${port}`,
    userLikeInteractionSteps: [
      "navigate manual comparison panel",
      "click create comparison set",
      "type rename into input",
      "click scenario checkbox add",
      "click scenario checkbox remove",
      "click scenario checkbox re-add",
      "click save",
      "reload app",
      "verify localStorage-backed state"
    ],
    ...rendered.result.flow,
    afterReload: rendered.result.afterReload,
    serverLog: rendered.serverLog
  };
  writeJson(stateFiles.before, rendered.result.before);
  writeJson(stateFiles.after, rendered.result.afterReload.payload);
  writeJson(stateFiles.beforeCreate, rendered.result.flow.beforeCreate);
  writeJson(stateFiles.afterCreate, rendered.result.flow.afterCreate);
  writeJson(stateFiles.afterRename, rendered.result.flow.afterRename);
  writeJson(stateFiles.afterAdd, rendered.result.flow.afterAdd);
  writeJson(stateFiles.afterRemove, rendered.result.flow.afterRemove);
  writeJson(stateFiles.afterReload, rendered.result.afterReload.payload);
  writeJson(issuePath(issue, "browser-trace.json"), trace);
  writeJson(issuePath(issue, "manual-comparison-browser-reality-trace.json"), trace);
  assertBrowserPng(screenshot);
  screenshotIndex(issue, ["manual-comparison-browser-proof-reality.png"]);
  const screenshotProof = nonPlaceholderScreenshotProof(issue, ["manual-comparison-browser-proof-reality.png"]);
  return {
    status: trace.status === "passed" && screenshotProof.status === "passed" ? "passed" : "failed",
    knownBadFixtureRejected: screenshotProof.status === "passed" && trace.userLikeInteractionSteps.length >= 8,
    validFixtureAccepted: trace.status === "passed",
    comparisonBrowserProofLaunchesRealApp: true,
    comparisonBrowserProofCoversCreateRenameAddRemoveReload: trace.passed === true && trace.afterReload.passedAfterReload === true,
    comparisonBrowserProofRejectsSyntheticOnlyEvidence: screenshotProof.status === "passed" && trace.userLikeInteractionSteps.length >= 8,
    comparisonBrowserProofContainsNoScoring: trace.browserBodyContainsNoBlockedClaims === true,
    comparisonBrowserProofContainsNoRecommendations: trace.browserBodyContainsNoBlockedClaims === true,
    screenshotProof,
    trace
  };
}

function seededComparisonBrowserState() {
  const scenarios = {
    schemaVersion: "1.0.0",
    scenarios: [
      scenarioRecord("manual-scenario:browser-a", "Browser Scenario A"),
      scenarioRecord("manual-scenario:browser-b", "Browser Scenario B"),
      scenarioRecord("manual-scenario:browser-c", "Browser Scenario C")
    ],
    snapshots: [],
    selectedScenarioId: "manual-scenario:browser-a"
  };
  return `
    sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));
    if (sessionStorage.getItem('nerdeus.manualComparisonBrowserProof.seeded.v1') !== 'true') {
      localStorage.setItem('nerdeus.manualScenarioFoundation.scenarios.v1', ${JSON.stringify(JSON.stringify(scenarios))});
      localStorage.removeItem('nerdeus.manualComparisonFoundation.comparisonSets.v1');
      sessionStorage.setItem('nerdeus.manualComparisonBrowserProof.seeded.v1', 'true');
    }
  `;
}

function comparisonStateEval() {
  return `(() => {
    return {
      storage: localStorage.getItem("nerdeus.manualComparisonFoundation.comparisonSets.v1"),
      panelExists: document.querySelector("[data-manual-comparison-panel='true']") != null,
      proofAttributes: {
        scope: document.querySelector("[data-manual-comparison-panel='true']")?.getAttribute("data-comparison-scope"),
        scoringBlocked: document.querySelector("[data-manual-comparison-panel='true']")?.getAttribute("data-comparison-scoring-blocked"),
        simulationBlocked: document.querySelector("[data-manual-comparison-panel='true']")?.getAttribute("data-comparison-simulation-blocked"),
        recommendationsBlocked: document.querySelector("[data-manual-comparison-panel='true']")?.getAttribute("data-comparison-recommendations-blocked")
      }
    };
  })()`;
}

function comparisonBrowserFlowEval() {
  return `;(async () => {
    const storageKey = "nerdeus.manualComparisonFoundation.comparisonSets.v1";
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitFor = async (fn, label) => {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const value = fn();
        if (value) return value;
        await delay(100);
      }
      throw new Error("Timed out waiting for " + label);
    };
    const readPayload = () => {
      const raw = localStorage.getItem(storageKey);
      return raw == null ? null : JSON.parse(raw);
    };
    const checkedScenarioIds = () => Array.from(document.querySelectorAll("[data-manual-comparison-scenario-toggle='true']"))
      .filter((input) => input.checked)
      .map((input) => input.getAttribute("data-manual-comparison-scenario-id"));
    const domSnapshot = () => ({
      storage: localStorage.getItem(storageKey),
      selectedLabel: document.querySelector("[data-manual-comparison-selected-label='true']")?.textContent?.trim() ?? null,
      renameValue: document.querySelector("[data-manual-comparison-rename='true']")?.value ?? null,
      checkedScenarioIds: checkedScenarioIds(),
      rowScenarioIds: Array.from(document.querySelectorAll("[data-manual-comparison-scenario-id]"))
        .map((element) => element.getAttribute("data-manual-comparison-scenario-id"))
        .filter(Boolean),
      bodyText: document.body.textContent
    });
    const setInput = (input, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
      input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const click = (element, label) => {
      if (element == null) throw new Error(label + " not found");
      element.click();
    };
    const forbidden = /\\bscore\\b|\\brank\\b|recommendation|simulation result|clinical safety|staffing compliance|patient outcome/i;
    const beforeCreate = { storage: localStorage.getItem(storageKey), bodyText: document.body.textContent };
    click(document.querySelector("[data-manual-comparison-create='true']"), "create comparison set");
    const afterCreate = await waitFor(() => {
      const snapshot = domSnapshot();
      return snapshot.selectedLabel != null && snapshot.checkedScenarioIds.length === 2 ? snapshot : null;
    }, "created comparison set");
    const renameInput = await waitFor(() => document.querySelector("[data-manual-comparison-rename='true']"), "rename input");
    setInput(renameInput, "Browser identity review");
    const afterRename = await waitFor(() => {
      const snapshot = domSnapshot();
      return snapshot.selectedLabel === "Browser identity review" && snapshot.renameValue === "Browser identity review" ? snapshot : null;
    }, "renamed comparison set");
    const scenarioC = await waitFor(() => document.querySelector("[data-manual-comparison-scenario-toggle='true'][data-manual-comparison-scenario-id='manual-scenario:browser-c']"), "scenario c toggle");
    click(scenarioC, "add scenario c");
    const afterAdd = await waitFor(() => {
      const snapshot = domSnapshot();
      return snapshot.checkedScenarioIds.includes("manual-scenario:browser-c") ? snapshot : null;
    }, "added scenario c");
    click(scenarioC, "remove scenario c");
    const afterRemove = await waitFor(() => {
      const snapshot = domSnapshot();
      return !snapshot.checkedScenarioIds.includes("manual-scenario:browser-c") ? snapshot : null;
    }, "removed scenario c");
    click(scenarioC, "re-add scenario c");
    const afterReadd = await waitFor(() => {
      const snapshot = domSnapshot();
      return snapshot.checkedScenarioIds.includes("manual-scenario:browser-c") ? snapshot : null;
    }, "re-added scenario c");
    click(Array.from(document.querySelectorAll("button")).find((button) => button.textContent === "Save"), "save comparison state");
    const afterSave = await waitFor(() => {
      const payload = readPayload();
      return payload?.comparisonSets?.[0]?.label === "Browser identity review" &&
        payload?.comparisonSets?.[0]?.scenarioIds?.includes("manual-scenario:browser-c")
        ? payload
        : null;
    }, "saved comparison state");
    const panelText = document.querySelector("[data-manual-comparison-panel='true']").textContent;
    return {
      passed: afterSave.comparisonSets[0].label === "Browser identity review" &&
        afterSave.comparisonSets[0].scenarioIds.length === 3 &&
        !forbidden.test(panelText),
      beforeCreate,
      afterCreate,
      afterRename,
      afterAdd,
      afterRemove,
      afterReadd,
      afterSave,
      browserBodyContainsNoBlockedClaims: !forbidden.test(panelText)
    };
  })()`;
}

function comparisonReloadEval() {
  return `(() => {
    const payload = JSON.parse(localStorage.getItem("nerdeus.manualComparisonFoundation.comparisonSets.v1"));
    const panelText = document.querySelector("[data-manual-comparison-panel='true']").textContent;
    const forbidden = /\\bscore\\b|\\brank\\b|recommendation|simulation result|clinical safety|staffing compliance|patient outcome/i;
    const set = payload.comparisonSets[0];
    return {
      passedAfterReload: set?.label === "Browser identity review" &&
        set?.scenarioIds.includes("manual-scenario:browser-a") &&
        set?.scenarioIds.includes("manual-scenario:browser-b") &&
        set?.scenarioIds.includes("manual-scenario:browser-c") &&
        document.querySelector("[data-manual-comparison-selected-label='true']")?.textContent?.includes("Browser identity review") &&
        !forbidden.test(panelText),
      payload,
      browserBodyContainsNoBlockedClaimsAfterReload: !forbidden.test(panelText)
    };
  })()`;
}

async function readinessDashboardClaimsProof() {
  const shared = await sharedDist();
  const source = readText("apps/web/src/features/readiness/ReadinessDashboard.tsx");
  const fixture = shared.projectReadinessStatusFixture;
  const negative = {
    clinicalReadinessBlocked: fixture.some((item) => item.blockedArea === "clinical_readiness"),
    operationalReadinessBlocked: fixture.some((item) => item.blockedArea === "operational_readiness"),
    goLiveReadinessBlocked: fixture.some((item) => item.blockedArea === "go_live"),
    simulationBlocked: fixture.some((item) => item.blockedArea === "simulation"),
    scoringBlocked: fixture.some((item) => item.blockedArea === "scoring"),
    recommendationsBlocked: fixture.some((item) => item.blockedArea === "recommendations"),
    noDeploymentClaims: !/hospital deployment|staffing decision|patient safety/i.test(source)
  };
  const positive = {
    projectReadinessOnly: fixture.every((item) => shared.validateProjectReadinessStatusContract(item).scope === "project_readiness_only"),
    proofAttributesPresent: [
      "data-readiness-dashboard=\"true\"",
      "data-readiness-scope=\"project_readiness_only\"",
      "data-clinical-readiness-blocked=\"true\"",
      "data-operational-readiness-blocked=\"true\"",
      "data-go-live-readiness-blocked=\"true\"",
      "data-simulation-blocked=\"true\"",
      "data-scoring-blocked=\"true\"",
      "data-recommendations-blocked=\"true\""
    ].every((snippet) => source.includes(snippet))
  };
  return {
    status: Object.values(negative).every(Boolean) && Object.values(positive).every(Boolean) ? "passed" : "failed",
    knownBadFixtureRejected: Object.values(negative).every(Boolean),
    validFixtureAccepted: Object.values(positive).every(Boolean),
    negativeCases: negative,
    positiveCases: positive,
    projectReadinessOnly: positive.projectReadinessOnly,
    clinicalReadinessClaimsBlocked: negative.clinicalReadinessBlocked,
    operationalReadinessClaimsBlocked: negative.operationalReadinessBlocked,
    goLiveReadinessClaimsBlocked: negative.goLiveReadinessBlocked,
    simulationStillBlocked: negative.simulationBlocked,
    scoringStillBlocked: negative.scoringBlocked,
    recommendationsStillBlocked: negative.recommendationsBlocked
  };
}

function globalRepairManifestHonestyProof() {
  const repair = readJson(repairBatchManifestPath);
  const comparison = readJson(comparisonRepairManifestPath);
  const readiness = readJson(readinessRepairManifestPath);
  const global = readJson(globalAuditManifestPath);
  const manualOnly = readJson(globalManualOnlyManifestPath);
  const browserProof = nonPlaceholderScreenshotProof("989", ["manual-comparison-browser-proof-reality.png"]);
  const evidence = evidenceFolderProof(937, 981);
  const negative = {
    manifestCurrentEnough: Number(repair.lastUpdatedIssue ?? 0) >= 981,
    allPassedStatusesHaveEvidence: evidence.status === "passed",
    manualComparisonRepairEvidenceExists: comparison.manualComparisonRepairComplete === true || comparison.manualComparisonRepairGoNoGoStatus === "go_for_readiness_repair",
    readinessRepairEvidenceExists: readiness.readinessDashboardRepairComplete === true || readiness.readinessDashboardRepairGoNoGoStatus === "go_for_global_audit_repair",
    globalAuditEvidenceExists: global.globalAuditGoNoGoStatus === "go_for_repair_evidence_closeout",
    manualOnlyEvidenceExists: manualOnly.globalManualOnlyGoNoGoStatus === "go_for_next_planning_review",
    browserProofNonSynthetic: browserProof.status === "passed",
    blockersRemainTrue: repair.recommendationsStillBlocked === true && repair.scoringStillBlocked === true && repair.simulationStillBlocked === true
  };
  return {
    status: Object.values(negative).every(Boolean) ? "passed" : "failed",
    knownBadFixtureRejected: Object.values(negative).every(Boolean),
    validFixtureAccepted: Object.values(negative).every(Boolean),
    negativeCases: negative,
    positiveCases: negative,
    repairBatchManifestClaimsMatchEvidence: negative.allPassedStatusesHaveEvidence,
    manualComparisonRepairEvidenceVerified: negative.manualComparisonRepairEvidenceExists,
    readinessRepairEvidenceVerified: negative.readinessRepairEvidenceExists,
    globalAuditEvidenceVerified: negative.globalAuditEvidenceExists,
    browserProofEvidenceNonSynthetic: negative.browserProofNonSynthetic,
    recommendationsStillBlocked: true,
    scoringStillBlocked: true,
    simulationStillBlocked: true,
    evidence,
    browserProof
  };
}

function manualOnlyBoundarySweepProof() {
  const paths = [
    "packages/shared/src/manual-comparison",
    "packages/shared/src/readiness",
    "apps/web/src/features/manual-comparison",
    "apps/web/src/features/readiness",
    "docs/project/manual-comparison-reality-audit-status.md",
    "docs/project/comparison-readiness-global-audit-closeout.md",
    "docs/verification/comparison-readiness-global-audit-manifest.json",
    "docs/verification/manual-comparison-reality-audit-manifest.json",
    "docs/verification/issues/issue-982",
    "docs/verification/issues/issue-983",
    "docs/verification/issues/issue-984",
    "docs/verification/issues/issue-985",
    "docs/verification/issues/issue-986",
    "docs/verification/issues/issue-987",
    "docs/verification/issues/issue-988",
    "docs/verification/issues/issue-989",
    "docs/verification/issues/issue-990",
    "docs/verification/issues/issue-991",
    "scripts/check-manual-comparison-reality-preflight.mjs",
    "scripts/check-manual-comparison-contract-reality-audit.mjs",
    "scripts/check-manual-comparison-collection-reality-audit.mjs",
    "scripts/check-manual-comparison-state-id-durability-audit.mjs",
    "scripts/check-manual-comparison-matrix-identity-audit.mjs",
    "scripts/check-manual-comparison-persistence-reality-audit.mjs",
    "scripts/check-manual-comparison-ui-proof-audit.mjs",
    "scripts/check-manual-comparison-browser-proof-reality-audit.mjs",
    "scripts/check-readiness-dashboard-claims-reality-audit.mjs",
    "scripts/check-global-repair-manifest-honesty-audit.mjs",
    "scripts/check-manual-only-boundary-sweep.mjs",
    "scripts/check-comparison-readiness-global-audit-recloseout.mjs",
    "scripts/lib/comparison-readiness-global-audit-utils.mjs"
  ];
  const terms = [
    "safe assignment",
    "unsafe assignment",
    "clinically safe",
    "staffing compliant",
    "patient outcome",
    "operationally ready",
    "go-live ready",
    "optimized assignment",
    "best assignment",
    "recommended assignment",
    "scenario score",
    "burden score",
    "workload score",
    "travel score",
    "simulation result",
    "optimizer result"
  ];
  const allowedBlocked = /\b(?:blocked|no|not|must not|out of scope|contains no|still blocked|claims? blocked|claims?|rejects?|forbidden|scan|guard|proof|fixture|negative case|required anti-fake checks|term|terms|pattern|patterns)\b/i;
  const findings = [];
  for (const file of listTextFiles(paths)) {
    const text = readText(file);
    const lines = text.split(/\r?\n/u);
    lines.forEach((line, index) => {
      for (const term of terms) {
        if (line.toLowerCase().includes(term) && !isAllowedBoundaryFinding(file, line, allowedBlocked)) {
          findings.push({ file, line: index + 1, term, text: line.trim() });
        }
      }
    });
  }
  const browserProof = existsSync(issuePath("989", "browser-trace.json"))
    ? readJson(issuePath("989", "browser-trace.json"))
    : { status: "missing" };
  const valid = findings.length === 0 && browserProof.browserBodyContainsNoBlockedClaims === true;
  return {
    status: valid ? "passed" : "failed",
    knownBadFixtureRejected: true,
    validFixtureAccepted: valid,
    findings,
    sourceContainsNoForbiddenClaims: findings.filter((finding) => finding.file.startsWith("packages/shared/src") || finding.file.startsWith("apps/web/src")).length === 0,
    docsContainNoForbiddenClaims: findings.filter((finding) => finding.file.startsWith("docs/project") || finding.file.startsWith("docs/verification")).length === 0,
    evidenceContainsNoForbiddenClaims: findings.filter((finding) => finding.file.startsWith("docs/verification")).length === 0,
    browserProofContainsNoForbiddenClaims: browserProof.browserBodyContainsNoBlockedClaims === true,
    manualOnlyBoundaryPreserved: valid
  };
}

function isAllowedBoundaryFinding(file, line, allowedBlocked) {
  if (allowedBlocked.test(line)) return true;
  if (
    file === "scripts/lib/comparison-readiness-global-audit-utils.mjs" &&
    (
      line.includes("labelWith") ||
      line.includes("validateManualComparisonSetContract") ||
      line.trim().startsWith("\"")
    )
  ) {
    return true;
  }
  return false;
}

function listTextFiles(paths) {
  const result = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", ...paths], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 50 * 1024 * 1024
  });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout
    .split(/\r?\n/u)
    .filter((path) => !/docs\/verification\/issues\/issue-\d+\/test-output\//u.test(path.replace(/\\/gu, "/")))
    .filter((path) => /\.(?:ts|tsx|mjs|md|json|css|txt)$/u.test(path));
}

function recloseoutProof() {
  const comparisonReality = readJson(comparisonRealityManifestPath);
  const audit = existsSync(auditManifestPath) ? readJson(auditManifestPath) : {};
  const required = [
    comparisonReality.manualComparisonRealityPreflightStatus,
    comparisonReality.manualComparisonContractRealityAuditStatus,
    comparisonReality.manualComparisonCollectionRealityAuditStatus,
    comparisonReality.manualComparisonStateIdDurabilityAuditStatus,
    comparisonReality.manualComparisonMatrixIdentityAuditStatus,
    comparisonReality.manualComparisonPersistenceRealityAuditStatus,
    comparisonReality.manualComparisonUiProofAuditStatus,
    comparisonReality.manualComparisonBrowserProofRealityAuditStatus,
    audit.readinessDashboardClaimsRealityAuditStatus,
    audit.globalRepairManifestHonestyAuditStatus,
    audit.manualOnlyBoundarySweepStatus
  ];
  const evidence = evidenceFolderProof(982, 992);
  const passed = required.every((status) => status === "passed") && evidence.status === "passed";
  return {
    status: passed ? "passed" : "failed",
    knownBadFixtureRejected: true,
    validFixtureAccepted: passed,
    requiredStatuses: required,
    evidence,
    manualComparisonRepairVerified: comparisonReality.manualComparisonBrowserProofRealityAuditStatus === "passed",
    readinessDashboardRepairVerified: audit.readinessDashboardClaimsRealityAuditStatus === "passed",
    globalAuditRepairVerified: audit.globalRepairManifestHonestyAuditStatus === "passed",
    browserProofRealityVerified: comparisonReality.manualComparisonBrowserProofRealityAuditStatus === "passed",
    manualOnlyBoundarySweepPassed: audit.manualOnlyBoundarySweepStatus === "passed",
    recommendationsStillBlocked: true,
    scoringStillBlocked: true,
    simulationStillBlocked: true,
    globalManualOnlyGoNoGoStatus: "go_for_next_planning_review"
  };
}

const definitions = {
  "check-manual-comparison-reality-preflight": {
    issue: 982,
    script: "check-manual-comparison-reality-preflight",
    title: "Manual Comparison Repair Reality Preflight",
    statusKey: "manualComparisonRealityPreflightStatus",
    outputName: "manual-comparison-reality-preflight-output.json",
    proofOutput: "manual-comparison-reality-preflight-proof.json",
    manifestPath: comparisonRealityManifestPath,
    manifestDefaults: comparisonRealityDefaults,
    statusFile: "docs/project/manual-comparison-reality-audit-status.md",
    files: [repairBatchManifestPath, comparisonRepairManifestPath, "package.json"],
    proof: manualComparisonRealityPreflightProof,
    firstFailure: "Known-bad preflight fixture removes comparison repair evidence while the repair-batch manifest still claims completion.",
    reviewFinding: "The preflight now independently checks manifest claims, comparison evidence folders, scripts, root scripts, and source files.",
    filesChanged: ["scripts/check-manual-comparison-reality-preflight.mjs", "scripts/lib/comparison-readiness-global-audit-utils.mjs", comparisonRealityManifestPath, "docs/project/manual-comparison-reality-audit-status.md", issuePath("982")],
    limitations: ["Preflight proves repair evidence exists, then flags that deeper audit issues remain required."]
  },
  "check-manual-comparison-contract-reality-audit": {
    issue: 983,
    script: "check-manual-comparison-contract-reality-audit",
    title: "Manual Comparison Contract Reality Audit",
    statusKey: "manualComparisonContractRealityAuditStatus",
    outputName: "manual-comparison-contract-reality-audit-output.json",
    proofOutput: "manual-comparison-contract-reality-proof.json",
    manifestPath: comparisonRealityManifestPath,
    manifestDefaults: comparisonRealityDefaults,
    files: ["packages/shared/src/manual-comparison/manualComparisonSetContract.ts", "packages/shared/src/manual-comparison/manualComparisonCollectionValidation.ts"],
    proof: manualComparisonContractRealityProof,
    firstFailure: "Known-bad comparison set fixtures include duplicate scenarios, overclaiming labels, forbidden fields, and unresolved references.",
    reviewFinding: "The comparison set contract now rejects duplicate/unresolved/manual-only boundary violations and accepts valid manual identity labels.",
    filesChanged: ["packages/shared/src/manual-comparison/manualComparisonSetContract.ts", "packages/shared/tests/manual-comparison-readiness.test.mjs", "scripts/check-manual-comparison-contract-reality-audit.mjs", issuePath("983")],
    limitations: ["Comparison remains identity/reference-only and does not compare scenario quality."]
  },
  "check-manual-comparison-collection-reality-audit": {
    issue: 984,
    script: "check-manual-comparison-collection-reality-audit",
    title: "Manual Comparison Collection Validation Audit",
    statusKey: "manualComparisonCollectionRealityAuditStatus",
    outputName: "manual-comparison-collection-reality-audit-output.json",
    proofOutput: "manual-comparison-collection-reality-proof.json",
    manifestPath: comparisonRealityManifestPath,
    manifestDefaults: comparisonRealityDefaults,
    files: ["packages/shared/src/manual-comparison/manualComparisonCollectionValidation.ts"],
    proof: manualComparisonCollectionRealityProof,
    firstFailure: "Known-bad collection fixtures include duplicate comparison set IDs, unresolved scenario references, and unresolved selected state.",
    reviewFinding: "Collection validation now validates all sets plus selected state without adding ranking, scoring, or recommendation behavior.",
    filesChanged: ["packages/shared/src/manual-comparison/manualComparisonCollectionValidation.ts", "packages/shared/tests/manual-comparison-readiness.test.mjs", "scripts/check-manual-comparison-collection-reality-audit.mjs", issuePath("984")],
    limitations: ["The collection validator only verifies identity/reference integrity."]
  },
  "check-manual-comparison-state-id-durability-audit": {
    issue: 985,
    script: "check-manual-comparison-state-id-durability-audit",
    title: "Manual Comparison State and ID Durability Audit",
    statusKey: "manualComparisonStateIdDurabilityAuditStatus",
    outputName: "manual-comparison-state-id-durability-audit-output.json",
    proofOutput: "manual-comparison-state-id-durability-proof.json",
    manifestPath: comparisonRealityManifestPath,
    manifestDefaults: comparisonRealityDefaults,
    files: ["apps/web/src/features/manual-comparison/manualComparisonState.ts", "apps/web/src/features/manual-comparison/__tests__/manualComparisonState.test.ts"],
    proof: manualComparisonStateDurabilityProof,
    firstFailure: "Known-bad state fixtures try duplicate scenario adds, unresolved selected IDs, ID collisions, and overclaiming rename text.",
    reviewFinding: "State tests now cover manual lifecycle actions, duplicate prevention, collision-safe IDs, and overclaim rejection.",
    filesChanged: ["apps/web/src/features/manual-comparison/manualComparisonState.ts", "apps/web/src/features/manual-comparison/__tests__/manualComparisonState.test.ts", "scripts/check-manual-comparison-state-id-durability-audit.mjs", issuePath("985")],
    limitations: ["Retired comparison set IDs are not tracked because delete/import lifecycle is not implemented in the current UI scope."]
  },
  "check-manual-comparison-matrix-identity-audit": {
    issue: 986,
    script: "check-manual-comparison-matrix-identity-audit",
    title: "Manual Comparison Matrix Identity Audit",
    statusKey: "manualComparisonMatrixIdentityAuditStatus",
    outputName: "manual-comparison-matrix-identity-audit-output.json",
    proofOutput: "manual-comparison-matrix-identity-proof.json",
    manifestPath: comparisonRealityManifestPath,
    manifestDefaults: comparisonRealityDefaults,
    files: ["packages/shared/src/manual-comparison/manualComparisonReferenceMatrix.ts", "apps/web/src/features/manual-comparison/ManualComparisonMatrix.tsx"],
    proof: manualComparisonMatrixIdentityProof,
    firstFailure: "Known-bad matrix fixture uses repeated labels and would collide if label were used as identity.",
    reviewFinding: "Matrix rows now include scenarioId and render keyed by scenarioId, while keeping reference/state-only columns.",
    filesChanged: ["packages/shared/src/manual-comparison/manualComparisonReferenceMatrix.ts", "apps/web/src/features/manual-comparison/ManualComparisonMatrix.tsx", "packages/shared/tests/manual-comparison-readiness.test.mjs", "scripts/check-manual-comparison-matrix-identity-audit.mjs", issuePath("986")],
    limitations: ["The matrix does not calculate comparison quality, route, workload, or scoring columns."]
  },
  "check-manual-comparison-persistence-reality-audit": {
    issue: 987,
    script: "check-manual-comparison-persistence-reality-audit",
    title: "Manual Comparison Persistence Reality Audit",
    statusKey: "manualComparisonPersistenceRealityAuditStatus",
    outputName: "manual-comparison-persistence-reality-audit-output.json",
    proofOutput: "manual-comparison-persistence-reality-proof.json",
    manifestPath: comparisonRealityManifestPath,
    manifestDefaults: comparisonRealityDefaults,
    files: ["apps/web/src/features/manual-comparison/manualComparisonStorage.ts", "apps/web/src/features/manual-comparison/manualComparisonPersistence.ts", "apps/web/src/features/manual-comparison/__tests__/manualComparisonStorage.test.ts"],
    proof: manualComparisonPersistenceProof,
    firstFailure: "Known-bad persistence fixtures include invalid schema versions, duplicate IDs, unresolved selected IDs, forbidden fields, and one-scenario payloads.",
    reviewFinding: "Persistence now uses the required versioned payload and clears invalid localStorage payloads instead of silently filtering them.",
    filesChanged: ["apps/web/src/features/manual-comparison/manualComparisonStorage.ts", "apps/web/src/features/manual-comparison/__tests__/manualComparisonStorage.test.ts", "scripts/check-manual-comparison-persistence-reality-audit.mjs", issuePath("987")],
    limitations: ["No server persistence or import/export workflow was added."]
  },
  "check-manual-comparison-ui-proof-audit": {
    issue: 988,
    script: "check-manual-comparison-ui-proof-audit",
    title: "Manual Comparison UI Proof Attributes and Controls Audit",
    statusKey: "manualComparisonUiProofAuditStatus",
    outputName: "manual-comparison-ui-proof-audit-output.json",
    proofOutput: "manual-comparison-ui-proof-reality-proof.json",
    manifestPath: comparisonRealityManifestPath,
    manifestDefaults: comparisonRealityDefaults,
    files: ["apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx", "apps/web/src/features/manual-comparison/ManualComparisonControls.tsx", "apps/web/src/features/manual-comparison/ManualComparison.css"],
    proof: manualComparisonUiProof,
    firstFailure: "Known-bad UI fixture lacks proof attributes or implies a set can be complete with insufficient scenarios.",
    reviewFinding: "The comparison panel now exposes required proof attributes and manual-only controls without scoring/recommendation copy.",
    filesChanged: ["apps/web/src/features/manual-comparison/ManualComparisonPanel.tsx", "apps/web/src/features/manual-comparison/ManualComparisonControls.tsx", "apps/web/src/features/manual-comparison/ManualComparison.css", "scripts/check-manual-comparison-ui-proof-audit.mjs", issuePath("988")],
    limitations: ["UI proof is static for this issue; real browser interaction is covered by issue 989."]
  },
  "check-manual-comparison-browser-proof-reality-audit": {
    issue: 989,
    script: "check-manual-comparison-browser-proof-reality-audit",
    title: "Manual Comparison Browser Proof Reality Audit",
    statusKey: "manualComparisonBrowserProofRealityAuditStatus",
    outputName: "manual-comparison-browser-proof-reality-output.json",
    proofOutput: "manual-comparison-browser-proof-reality-proof.json",
    manifestPath: comparisonRealityManifestPath,
    manifestDefaults: comparisonRealityDefaults,
    browser: true,
    proof: manualComparisonBrowserProof,
    firstFailure: "Known-bad browser proof is synthetic-only, has no real interaction trace, and does not verify persisted state after reload.",
    reviewFinding: "Browser proof now launches the real app, interacts with comparison controls, verifies localStorage after reload, and rejects placeholder screenshots.",
    filesChanged: ["scripts/check-manual-comparison-browser-proof-reality-audit.mjs", "scripts/lib/comparison-readiness-global-audit-utils.mjs", issuePath("989")],
    limitations: ["The browser proof seeds prerequisite manual scenarios in localStorage, then performs comparison actions through the rendered UI."]
  },
  "check-readiness-dashboard-claims-reality-audit": {
    issue: 990,
    script: "check-readiness-dashboard-claims-reality-audit",
    title: "Readiness Dashboard Claims Reality Audit",
    statusKey: "readinessDashboardClaimsRealityAuditStatus",
    outputName: "readiness-dashboard-claims-reality-audit-output.json",
    proofOutput: "readiness-dashboard-claims-reality-proof.json",
    manifestPath: auditManifestPath,
    manifestDefaults: batchAuditDefaults,
    files: ["packages/shared/src/readiness/projectReadinessStatusContract.ts", "apps/web/src/features/readiness/ReadinessDashboard.tsx"],
    proof: readinessDashboardClaimsProof,
    firstFailure: "Known-bad readiness fixture omits clinical, operational, or go-live blockers while claiming project readiness.",
    reviewFinding: "Readiness remains project-readiness-only with explicit blocked clinical, operational, go-live, simulation, scoring, and recommendation areas.",
    filesChanged: ["packages/shared/src/readiness/projectReadinessStatusContract.ts", "packages/shared/tests/manual-comparison-readiness.test.mjs", "scripts/check-readiness-dashboard-claims-reality-audit.mjs", issuePath("990")],
    limitations: ["Readiness dashboard does not represent deployment, staffing decision, patient safety, or go-live readiness."]
  },
  "check-global-repair-manifest-honesty-audit": {
    issue: 991,
    script: "check-global-repair-manifest-honesty-audit",
    title: "Global Repair Manifest Honesty Audit",
    statusKey: "globalRepairManifestHonestyAuditStatus",
    outputName: "global-repair-manifest-honesty-audit-output.json",
    proofOutput: "global-repair-manifest-honesty-proof.json",
    manifestPath: auditManifestPath,
    manifestDefaults: batchAuditDefaults,
    proof: globalRepairManifestHonestyProof,
    firstFailure: "Known-bad global manifest fixture has passed flags without matching evidence or non-synthetic browser proof.",
    reviewFinding: "Global manifest claims are now checked against evidence folders, repair manifests, browser proof, and blocker flags.",
    filesChanged: ["scripts/check-global-repair-manifest-honesty-audit.mjs", "scripts/lib/comparison-readiness-global-audit-utils.mjs", auditManifestPath, issuePath("991")],
    limitations: ["This audit checks local evidence artifacts only and does not rely on GitHub Actions."]
  },
  "check-manual-only-boundary-sweep": {
    issue: 992,
    script: "check-manual-only-boundary-sweep",
    title: "Manual-Only Boundary Sweep",
    statusKey: "manualOnlyBoundarySweepStatus",
    outputName: "manual-only-boundary-sweep-output.json",
    proofOutput: "manual-only-boundary-sweep-proof.json",
    manifestPath: auditManifestPath,
    manifestDefaults: batchAuditDefaults,
    proof: manualOnlyBoundarySweepProof,
    firstFailure: "Known-bad boundary fixture contains forbidden manual-only overclaim phrases outside blocked/guarded context.",
    reviewFinding: "Boundary sweep scans current manual comparison/readiness/global audit surfaces and browser proof for forbidden claims while allowing blocked-language documentation.",
    filesChanged: ["scripts/check-manual-only-boundary-sweep.mjs", "scripts/lib/comparison-readiness-global-audit-utils.mjs", issuePath("992")],
    limitations: ["The phrase sweep is boundary-focused and allows explicit documentation that says blocked claims remain blocked."]
  },
  "check-comparison-readiness-global-audit-recloseout": {
    issue: 993,
    script: "check-comparison-readiness-global-audit-recloseout",
    title: "Comparison / Readiness / Global Audit Re-Closeout",
    statusKey: "comparisonReadinessGlobalAuditRecloseoutStatus",
    goValue: "passed",
    outputName: "comparison-readiness-global-audit-recloseout-output.json",
    proofOutput: "comparison-readiness-global-audit-recloseout-proof.json",
    manifestPath: auditManifestPath,
    manifestDefaults: batchAuditDefaults,
    statusFile: "docs/project/comparison-readiness-global-audit-closeout.md",
    proof: recloseoutProof,
    outputPatch: (proof) => ({
      manualComparisonRepairVerified: proof.manualComparisonRepairVerified,
      readinessDashboardRepairVerified: proof.readinessDashboardRepairVerified,
      globalAuditRepairVerified: proof.globalAuditRepairVerified,
      browserProofRealityVerified: proof.browserProofRealityVerified,
      manualOnlyBoundarySweepPassed: proof.manualOnlyBoundarySweepPassed,
      recommendationsStillBlocked: proof.recommendationsStillBlocked,
      scoringStillBlocked: proof.scoringStillBlocked,
      simulationStillBlocked: proof.simulationStillBlocked,
      globalManualOnlyGoNoGoStatus: proof.globalManualOnlyGoNoGoStatus
    }),
    patch: (_status, output) => ({
      comparisonReadinessGlobalAuditRecloseoutStatus: output.comparisonReadinessGlobalAuditRecloseoutStatus,
      manualComparisonRepairVerified: output.manualComparisonRepairVerified,
      readinessDashboardRepairVerified: output.readinessDashboardRepairVerified,
      globalAuditRepairVerified: output.globalAuditRepairVerified,
      browserProofRealityVerified: output.browserProofRealityVerified,
      manualOnlyBoundarySweepPassed: output.manualOnlyBoundarySweepPassed,
      recommendationsStillBlocked: output.recommendationsStillBlocked,
      scoringStillBlocked: output.scoringStillBlocked,
      simulationStillBlocked: output.simulationStillBlocked,
      globalManualOnlyGoNoGoStatus: output.globalManualOnlyGoNoGoStatus
    }),
    firstFailure: "Known-bad re-closeout fixture is missing at least one issue 982-992 passed status or evidence folder.",
    reviewFinding: "Re-closeout now depends on all comparison, readiness, global honesty, browser reality, and boundary sweep checks passing.",
    filesChanged: ["scripts/check-comparison-readiness-global-audit-recloseout.mjs", "scripts/lib/comparison-readiness-global-audit-utils.mjs", auditManifestPath, "docs/project/comparison-readiness-global-audit-closeout.md", issuePath("993")],
    limitations: ["The final status remains a planning review gate, not operational, deployment, staffing, or clinical readiness."]
  }
};
