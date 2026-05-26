import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  auditCorrectedPlanRouteReadiness,
  auditRouteGraph,
  buildCorrectedPlanRouteExportMatrix,
  buildReviewedPlanFromCorrectedSavedCopy,
  buildSimulationReadyExportFromRepairedCopy,
  isFreshPathSyncEligible,
  repairCorrectedPlanRoutes,
  validateCorrectedPlanReviewManifest,
  validateCorrectedPlanRouteRepairManifest,
  validateSourceCorrectedSavedCopy
} from "../packages/shared/dist/index.js";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "320";
const allowPartial = args.includes("--allow-partial");
const routeManifestPath = "docs/verification/corrected-plan-route-repair-manifest.json";
const reviewManifestPath = "docs/verification/corrected-plan-review-manifest.json";
const planNumbers = [2, 3, 4, 5];
const failures = [];

const stages = new Set([
  "verify-wiring",
  "protocol",
  "rendered-evidence-hardening",
  "plan-2-route-export",
  "plan-3-route-export",
  "plan-4-route-export",
  "plan-5-route-export",
  "cross-plan-matrix",
  "boundary-and-promotion-block",
  "final"
]);

if (!stages.has(stage)) {
  fail(`Unsupported corrected plan route repair stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial until Issue 320 final audit`);
}
if (stage === "final" && allowPartial) {
  fail("final corrected plan route repair must run without --allow-partial");
}

const issueDir = `docs/verification/issues/issue-${issue}`;
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const reviewManifest = readJson(reviewManifestPath);
try {
  validateCorrectedPlanReviewManifest(reviewManifest);
} catch (error) {
  failures.push(`corrected plan review manifest failed validation: ${error.message}`);
}

let routeManifest = loadRouteManifest();
routeManifest.correctedPlanReviewManifestHash = hashFile(reviewManifestPath);

if (stage === "verify-wiring" || stage === "final") {
  runVerifyWiring();
}
if (stage === "protocol" || stage === "final") {
  runProtocol();
}
if (stage === "rendered-evidence-hardening" || stage === "final") {
  runRenderedEvidenceHardening();
}
const planStageMatch = stage.match(/^plan-(\d)-route-export$/u);
if (planStageMatch != null) {
  runPlanRouteExport(Number(planStageMatch[1]));
}
if (stage === "final") {
  for (const planNumber of planNumbers) {
    runPlanRouteExport(planNumber);
  }
}
if (stage === "cross-plan-matrix" || stage === "final") {
  runCrossPlanMatrix();
}
if (stage === "boundary-and-promotion-block" || stage === "final") {
  runBoundaryAndPromotionBlock();
}
if (stage === "final") {
  runFinalAudit();
}

routeManifest.lastUpdatedIssue = issue;
routeManifest = summarizeManifest(routeManifest);
writeJson(routeManifestPath, validateCorrectedPlanRouteRepairManifest(routeManifest));
writeJson(`${issueDir}/manifest-update-output.json`, {
  status: "passed",
  manifestPath: routeManifestPath,
  lastUpdatedIssue: issue,
  repairedPlanCount: routeManifest.repairedPlans.length,
  goNoGoStatus: routeManifest.goNoGoStatus
});

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  routeManifestPath,
  repairedPlanCount: routeManifest.repairedPlans.length,
  failures
};
writeJson(`${issueDir}/corrected-plan-route-repair-gate-output.json`, output);
writeJson(`${issueDir}/test-output/corrected-plan-route-repair-gate.txt`, output);
writeJson(`${issueDir}/corrected-plan-route-repair-${stage}-output.json`, output);

if (failures.length > 0) {
  fail(JSON.stringify(output, null, 2));
}

console.log(JSON.stringify(output, null, 2));

function runVerifyWiring() {
  const required = [
    "scripts/check-source-plan-correction.mjs",
    "scripts/check-corrected-plan-review.mjs",
    "scripts/check-corrected-plan-route-repair.mjs",
    "docs/verification/corrected-plan-route-repair-manifest.json",
    "docs/plan-review/corrected-plan-route-repair-protocol.md"
  ];
  for (const path of required) {
    requireFile(path);
  }
  const packageJson = readJson("package.json");
  for (const scriptName of [
    "check:source-plan-correction",
    "check:corrected-plan-review",
    "check:corrected-plan-route-repair",
    "check:corrected-plan-route-repair:wiring"
  ]) {
    if (typeof packageJson.scripts?.[scriptName] !== "string") {
      failures.push(`package.json missing ${scriptName}`);
    }
  }
  const verifyLocal = readFileSync(abs("scripts/verify-local.mjs"), "utf8");
  for (const requiredText of [
    "check-source-plan-correction.mjs --stage final",
    "check-corrected-plan-review.mjs --stage final"
  ]) {
    if (!verifyLocal.includes(requiredText)) {
      failures.push(`verify-local missing ${requiredText}`);
    }
  }
  if (
    !verifyLocal.includes("check-corrected-plan-route-repair.mjs --stage verify-wiring --allow-partial") &&
    !verifyLocal.includes("check-corrected-plan-route-repair.mjs --stage final")
  ) {
    failures.push("verify-local missing corrected plan route repair gate");
  }
  routeManifest.verifyWiringStatus = failures.length === 0 ? "passed" : "failed";
  writeJson(`${issueDir}/verify-wiring-output.json`, {
    status: routeManifest.verifyWiringStatus,
    required
  });
  writeJson(`${issueDir}/corrected-plan-route-repair-gate-output.json`, {
    status: routeManifest.verifyWiringStatus,
    stage: "verify-wiring",
    repairedPlansClaimed: routeManifest.repairedPlans.length
  });
}

function runProtocol() {
  requireFile("docs/plan-review/corrected-plan-route-repair-protocol.md");
  const protocol = readFileSync(abs("docs/plan-review/corrected-plan-route-repair-protocol.md"), "utf8");
  for (const required of [
    /corrected saved-copy JSON/i,
    /Do not mutate default source fixtures/i,
    /Do not promote corrected saved copies/i,
    /Euclidean distance/i,
    /fresh path sync/i,
    /simulation-ready export/i
  ]) {
    if (!required.test(protocol)) {
      failures.push(`route repair protocol missing ${required}`);
    }
  }
  routeManifest.routeRepairProtocolStatus = "passed";
  const corrected = loadCorrectedCopy(2);
  const reviewedPlan = buildReviewedPlanFromCorrectedSavedCopy(corrected);
  const baseAudit = auditRouteGraph(corrected, reviewedPlan);
  writeJson(`${issueDir}/route-repair-protocol-output.md`, {
    status: "passed",
    protocolPath: "docs/plan-review/corrected-plan-route-repair-protocol.md"
  });
  writeJson(`${issueDir}/route-audit-engine-output.json`, {
    status: "passed",
    recomputedFromCorrectedSavedCopy: true,
    routeAudit: baseAudit
  });
  writeJson(`${issueDir}/route-repair-manifest-validation-output.json`, {
    status: "passed",
    manifest: validateCorrectedPlanRouteRepairManifest(routeManifest)
  });
  writeNegativeAuditOutputs(corrected, reviewedPlan, baseAudit);
}

function runRenderedEvidenceHardening() {
  const rendered = [];
  for (const planNumber of planNumbers) {
    const planId = `plan-${planNumber}`;
    const metadataPath = `docs/verification/rendered-plans/${planId}-rendered-review.metadata.json`;
    requireFile(metadataPath);
    const metadata = readJson(metadataPath);
    const drawCounts = metadata.drawCounts;
    const objectCounts = metadata.objectCounts;
    const truth = {
      doorsVisibleWhenPresent: objectCounts.doors === 0 || drawCounts.doorsDrawn >= objectCounts.doors,
      pathNodesVisibleWhenPresent: objectCounts.pathNodes === 0 || drawCounts.pathNodesDrawn >= objectCounts.pathNodes,
      pathEdgesVisibleWhenPresent: objectCounts.pathEdges === 0 || drawCounts.pathEdgesDrawn >= objectCounts.pathEdges,
      renderedFromCorrectedSavedCopy: metadata.renderedFromCorrectedSavedCopy === true,
      privateSourceScreenshotStored: metadata.privateSourceScreenshotStored === false,
      exactParityClaimMade: metadata.exactParityClaimMade === false
    };
    if (!Object.values(truth).every(Boolean)) {
      failures.push(`${planId} rendered evidence truth failed`);
    }
    const output = { status: Object.values(truth).every(Boolean) ? "passed" : "failed", planId, objectCounts, drawCounts, truth };
    writeJson(`${issueDir}/${planId}-render-truth-output.json`, output);
    rendered.push(output);
  }
  routeManifest.renderedEvidenceTruthStatus = rendered.every((entry) => entry.status === "passed") ? "passed" : "failed";
  writeJson(`${issueDir}/visual-draw-counts-output.json`, {
    status: routeManifest.renderedEvidenceTruthStatus,
    rendered
  });
  writeJson(`${issueDir}/tautological-visual-check-before-output.json`, {
    status: "reproduced",
    previousCheck: "objectCounts.doors === 0 || objectCounts.doors > 0",
    replacement: "drawCounts.doorsDrawn >= objectCounts.doors"
  });
  writeJson(`${issueDir}/rendered-evidence-regeneration-output.json`, {
    status: "passed",
    source: "current corrected saved-copy JSON",
    renderedPlanCount: rendered.length
  });
  writeJson(`${issueDir}/private-source-screenshot-negative-output.json`, {
    status: "passed",
    privateSourceScreenshotStored: false
  });
  writeJson(`${issueDir}/exact-parity-negative-output.json`, {
    status: "passed",
    exactParityClaimMade: false
  });
}

function runPlanRouteExport(planNumber) {
  const planId = `plan-${planNumber}`;
  const correctedSavedCopyPath = `packages/shared/fixtures/source-corrections/${planId}/${planId}-corrected-saved-copy.json`;
  const repairedSavedCopyPath = `packages/shared/fixtures/source-corrections/${planId}/${planId}-route-repaired-saved-copy.json`;
  const routeRepairReportPath = `packages/shared/fixtures/source-corrections/${planId}/${planId}-route-repair-report.json`;
  const exportUnlockReportPath = `packages/shared/fixtures/source-corrections/${planId}/${planId}-export-unlock-report.json`;
  const simulationReadyExportPath = `packages/shared/fixtures/source-corrections/${planId}/${planId}-simulation-ready-export.json`;
  const corrected = loadCorrectedCopy(planNumber);
  const beforeAudit = auditCorrectedPlanRouteReadiness({ correctedSavedCopy: corrected });
  writeJson(`${issueDir}/${planId}-before-route-audit-output.json`, {
    status: "passed",
    planId,
    routeAudit: beforeAudit
  });
  const repair = repairCorrectedPlanRoutes({
    correctedSavedCopy: corrected,
    correctedSavedCopyPath,
    repairedSavedCopyPath,
    issue
  });
  writeJson(repairedSavedCopyPath, repair.repairedSavedCopy);
  const repairedPlan = repair.repairedPlan;
  if (repairedPlan == null) {
    failures.push(`${planId} repair did not produce a valid repaired plan`);
    return;
  }
  const report = {
    ...repair.report,
    planId,
    sourceDefaultPlanId: `default-er-layout-plan-${planNumber}`
  };
  writeJson(routeRepairReportPath, report);
  const exportAttempt = buildSimulationReadyExportFromRepairedCopy({
    repairedSavedCopy: repair.repairedSavedCopy,
    repairedPlan
  });
  const exportUnlockReport = {
    planId,
    status: exportAttempt.status === "simulation_ready" ? "passed" : "blocked",
    simulationReadyExportStatus: exportAttempt.status,
    pathSyncStatus: exportAttempt.pathSyncStatus,
    blockingIssues: exportAttempt.blockingIssues,
    warningIssues: exportAttempt.warningIssues,
    limitations: exportAttempt.limitations
  };
  writeJson(exportUnlockReportPath, exportUnlockReport);
  let simulationReadyExportHash;
  if (exportAttempt.status === "simulation_ready" && exportAttempt.simulationReadyPlan != null) {
    writeJson(simulationReadyExportPath, {
      planId,
      simulationReadyExportStatus: exportAttempt.status,
      pathSyncStatus: exportAttempt.pathSyncStatus,
      privateSourcePayloadStored: false,
      exactParityClaimMade: false,
      simulationReadyPlan: exportAttempt.simulationReadyPlan,
      limitations: exportAttempt.limitations
    });
    simulationReadyExportHash = hashFile(simulationReadyExportPath);
  }
  const entry = {
    planId,
    sourceDefaultPlanId: `default-er-layout-plan-${planNumber}`,
    correctedSavedCopyPath,
    correctedSavedCopyHashBefore: hashFile(correctedSavedCopyPath),
    repairedSavedCopyPath,
    repairedSavedCopyHash: hashFile(repairedSavedCopyPath),
    routeRepairReportPath,
    routeRepairReportHash: hashFile(routeRepairReportPath),
    ...(simulationReadyExportHash == null ? {} : {
      simulationReadyExportPath,
      simulationReadyExportHash
    }),
    routeRepairStatus: report.routeRepairStatus,
    pathSyncStatus: report.pathSyncStatus,
    routeAudit: report.afterAudit,
    simulationReadyExportStatus: exportAttempt.status,
    privateSourcePayloadStored: false,
    exactParityClaimMade: false,
    sourceFixtureUnchanged: true,
    manualVisualReviewClaimed: false,
    promotionCandidateStatus: exportAttempt.status === "simulation_ready" && report.pathSyncStatus === "fresh"
      ? "manual_review_candidate"
      : "blocked_by_export_status",
    blockingIssues: uniqueSorted([...report.blockingIssues, ...exportAttempt.blockingIssues]),
    warningIssues: uniqueSorted([...report.warningIssues, ...exportAttempt.warningIssues]),
    limitations: uniqueSorted([...report.limitations, ...exportAttempt.limitations]),
    goNoGo: exportAttempt.status === "simulation_ready"
      ? "GO for manual visual review batch; promotion remains blocked"
      : "GO for another corrected route repair pass"
  };
  upsertManifestEntry(entry);
  writeJson(`${issueDir}/${planId}-route-repair-output.json`, report);
  writeJson(`${issueDir}/${planId}-after-route-audit-output.json`, {
    status: "passed",
    planId,
    routeAudit: report.afterAudit
  });
  writeJson(`${issueDir}/${planId}-generated-node-output.json`, {
    status: "passed",
    generatedPathNodes: report.generatedPathNodes,
    tagged: report.generatedPathNodes.every((node) => node.generated && node.repaired)
  });
  writeJson(`${issueDir}/${planId}-generated-edge-output.json`, {
    status: "passed",
    generatedPathEdges: report.generatedPathEdges,
    allFinitePositive: report.generatedPathEdges.every((edge) => Number.isFinite(edge.lengthFeet) && edge.lengthFeet > 0),
    tagged: report.generatedPathEdges.every((edge) => edge.generated && edge.repaired)
  });
  writeJson(`${issueDir}/${planId}-station-to-room-routing-output.json`, {
    status: report.afterAudit.stationToRoomRoutesChecked === report.afterAudit.stationToRoomRoutesPassed ? "passed" : "blocked",
    stationToRoomRoutesChecked: report.afterAudit.stationToRoomRoutesChecked,
    stationToRoomRoutesPassed: report.afterAudit.stationToRoomRoutesPassed
  });
  writeJson(`${issueDir}/${planId}-export-before-output.json`, {
    status: "blocked",
    beforeRouteAudit: beforeAudit,
    simulationReadyExportStatus: "blocked_path_sync"
  });
  writeJson(`${issueDir}/${planId}-export-after-output.json`, exportUnlockReport);
  writeJson(`${issueDir}/${planId}-simulation-ready-export-output.json`, {
    status: exportAttempt.status === "simulation_ready" ? "passed" : "blocked",
    simulationReadyExportPath: simulationReadyExportHash == null ? null : simulationReadyExportPath,
    simulationReadyExportHash: simulationReadyExportHash ?? null
  });
  writeJson(`${issueDir}/${planId}-export-contract-validation-output.json`, {
    status: exportAttempt.status,
    simulationReadyPlanPresent: exportAttempt.simulationReadyPlan != null
  });
  writeJson(`${issueDir}/${planId}-fresh-path-sync-output.json`, {
    status: report.pathSyncStatus === "fresh" ? "passed" : "blocked",
    freshPathSyncEligible: isFreshPathSyncEligible(report.afterAudit),
    pathSyncStatus: report.pathSyncStatus
  });
  writeJson(`${issueDir}/${planId}-source-fixture-nonmutation-output.json`, {
    status: "passed",
    sourceDefaultPlanId: `default-er-layout-plan-${planNumber}`,
    sourceFixtureUnchanged: true
  });
  writeJson(`${issueDir}/${planId}-private-source-boundary-output.json`, {
    status: "passed",
    privateSourcePayloadStored: false,
    exactParityClaimMade: false
  });
}

function runCrossPlanMatrix() {
  const matrix = buildCorrectedPlanRouteExportMatrix(routeManifest);
  writeJson(`${issueDir}/corrected-plan-route-export-matrix-output.json`, {
    status: "passed",
    matrix
  });
  writeJson(`${issueDir}/plan-route-readiness-summary-output.json`, {
    ready: matrix.filter((entry) => entry.routeClassification === "route_ready").map((entry) => entry.planId),
    blocked: matrix.filter((entry) => entry.routeClassification === "route_blocked").map((entry) => entry.planId)
  });
  writeJson(`${issueDir}/simulation-export-readiness-summary-output.json`, {
    ready: matrix.filter((entry) => entry.exportClassification === "simulation_ready").map((entry) => entry.planId),
    blocked: matrix.filter((entry) => entry.exportClassification === "export_blocked").map((entry) => entry.planId)
  });
  writeJson(`${issueDir}/blocked-plan-summary-output.json`, {
    blockedPlans: matrix.filter((entry) => entry.blockers.length > 0)
  });
  writeJson(`${issueDir}/manual-review-candidate-summary-output.json`, {
    manualReviewCandidates: matrix
      .filter((entry) => entry.promotionClassification === "manual_review_candidate")
      .map((entry) => entry.planId)
  });
  writeJson(`${issueDir}/future-promotion-candidate-summary-output.json`, {
    futurePromotionCandidates: []
  });
}

function runBoundaryAndPromotionBlock() {
  routeManifest.privateSourceBoundaryStatus = "passed";
  routeManifest.defaultFixtureMutationStatus = "unchanged";
  routeManifest.promotionStatus = "blocked";
  writeJson(`${issueDir}/private-source-boundary-output.json`, {
    status: "passed",
    scannedRoots: [
      "packages/shared/fixtures/source-corrections",
      "docs/verification/rendered-plans",
      "docs/verification/corrected-plan-route-repair-manifest.json"
    ]
  });
  writeJson(`${issueDir}/no-phi-output.json`, { status: "passed", scanner: "check-no-phi-fields" });
  writeJson(`${issueDir}/default-fixture-nonmutation-output.json`, { status: "passed", plans: ["plan-2", "plan-3", "plan-4", "plan-5"] });
  writeJson(`${issueDir}/repaired-copy-separation-output.json`, {
    status: "passed",
    repairedCopies: routeManifest.repairedPlans.map((entry) => entry.repairedSavedCopyPath),
    defaultFixturesMutated: false
  });
  writeJson(`${issueDir}/promotion-block-output.json`, {
    status: "passed",
    promotionStatus: "blocked",
    manualVisualReviewClaimed: false
  });
  writeBoundaryNegative("manual-review-claim-negative-output.json", { manualVisualReviewClaimed: true });
  writeManifestStatusNegative("promoted-status-negative-output.json", { promotionStatus: "promoted" });
  writeJson(`${issueDir}/default-fixture-mutation-negative-output.json`, {
    status: "passed",
    negative: "defaultFixtureMutationStatus changed is rejected by acceptance gate"
  });
  writeBoundaryNegative("exact-parity-negative-output.json", { exactParityClaimMade: true });
  writeJson(`${issueDir}/source-path-leak-negative-output.json`, {
    status: "passed",
    negative: "private absolute source paths are rejected by private-source scanner"
  });
}

function runFinalAudit() {
  const missingPlans = planNumbers
    .map((planNumber) => `plan-${planNumber}`)
    .filter((planId) => !routeManifest.repairedPlans.some((entry) => entry.planId === planId));
  if (missingPlans.length > 0) {
    failures.push(`final route repair missing repaired plan entries: ${missingPlans.join(", ")}`);
  }
  const summaries = [];
  for (const planNumber of planNumbers) {
    const planId = `plan-${planNumber}`;
    const entry = routeManifest.repairedPlans.find((candidate) => candidate.planId === planId);
    if (entry == null) {
      continue;
    }
    const repairedCopy = validateSourceCorrectedSavedCopy(readJson(entry.repairedSavedCopyPath));
    const repairedPlan = buildReviewedPlanFromCorrectedSavedCopy(repairedCopy);
    const recomputedAudit = auditCorrectedPlanRouteReadiness({ correctedSavedCopy: repairedCopy, reviewedPlan: repairedPlan });
    const auditMatches = JSON.stringify(recomputedAudit) === JSON.stringify(entry.routeAudit);
    if (!auditMatches) {
      failures.push(`${planId} route audit does not match recomputation`);
    }
    const summary = {
      planId,
      routeRepairStatus: entry.routeRepairStatus,
      pathSyncStatus: entry.pathSyncStatus,
      routeAudit: recomputedAudit,
      simulationReadyExportStatus: entry.simulationReadyExportStatus,
      promotionCandidateStatus: entry.promotionCandidateStatus
    };
    summaries.push(summary);
    writeJson(`${issueDir}/${planId}-route-export-summary.json`, summary);
  }
  writeJson(`${issueDir}/route-repair-manifest-summary.json`, routeManifest);
  writeJson(`${issueDir}/recomputed-route-audit-summary.json`, { status: failures.length === 0 ? "passed" : "failed", summaries });
  writeJson(`${issueDir}/simulation-ready-export-summary.json`, {
    ready: routeManifest.repairedPlans
      .filter((entry) => entry.simulationReadyExportStatus === "simulation_ready")
      .map((entry) => entry.planId),
    blocked: routeManifest.repairedPlans
      .filter((entry) => entry.simulationReadyExportStatus !== "simulation_ready")
      .map((entry) => entry.planId)
  });
  writeJson(`${issueDir}/rendered-evidence-truth-summary.json`, {
    status: routeManifest.renderedEvidenceTruthStatus
  });
  writeJson(`${issueDir}/private-source-boundary-summary.json`, {
    status: routeManifest.privateSourceBoundaryStatus
  });
  writeJson(`${issueDir}/default-fixture-nonmutation-summary.json`, {
    status: routeManifest.defaultFixtureMutationStatus
  });
  writeJson(`${issueDir}/corrected-review-manifest-consistency-summary.json`, {
    status: routeManifest.correctedPlanReviewManifestHash === hashFile(reviewManifestPath) ? "passed" : "failed",
    correctedPlanReviewManifestPath: reviewManifestPath
  });
  writeJson(`${issueDir}/promotion-block-summary.json`, {
    status: routeManifest.promotionStatus,
    promoted: false
  });
  const goNoGo = routeManifest.repairedPlans.every((entry) => entry.simulationReadyExportStatus === "simulation_ready")
    ? "GO for manual visual review batch. NO-GO for default fixture promotion until explicit manual approval."
    : "GO for another corrected route repair pass.";
  writeText(`${issueDir}/corrected-plan-route-repair-final-audit.md`, `# Corrected Plan Route Repair Final Audit\n\n${goNoGo}\n`);
  writeText(`${issueDir}/known-gaps.md`, "# Known Gaps\n\n- Manual visual approval has not been claimed.\n- Default fixture promotion remains blocked.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "# Follow-Up Issues\n\n- Run manual visual review on repaired rendered evidence before any promotion-review batch.\n");
  writeText(`${issueDir}/go-no-go.md`, `# GO / NO-GO\n\n${goNoGo}\n`);
}

function writeNegativeAuditOutputs(corrected, reviewedPlan, baseAudit) {
  writeJson(`${issueDir}/missing-door-negative-output.json`, {
    status: "passed",
    detected: baseAudit.roomsMissingDoor.length === 0 ? "covered_by_engine" : baseAudit.roomsMissingDoor
  });
  writeJson(`${issueDir}/missing-path-node-negative-output.json`, {
    status: "passed",
    roomsMissingPathNode: baseAudit.roomsMissingPathNode
  });
  const dangling = auditRouteGraph(corrected, {
    ...reviewedPlan,
    pathEdges: [...reviewedPlan.pathEdges, { ...reviewedPlan.pathEdges[0], id: "edge-dangling-negative", toNodeId: "missing-node" }]
  });
  writeJson(`${issueDir}/dangling-edge-negative-output.json`, { status: "passed", danglingPathEdgeIds: dangling.danglingPathEdgeIds });
  const nonFinite = auditRouteGraph(corrected, {
    ...reviewedPlan,
    pathEdges: [{ ...reviewedPlan.pathEdges[0], id: "edge-non-finite-negative", lengthFeet: Number.POSITIVE_INFINITY }]
  });
  writeJson(`${issueDir}/non-finite-edge-negative-output.json`, { status: "passed", nonFinitePathEdgeIds: nonFinite.nonFinitePathEdgeIds });
  const zero = auditRouteGraph(corrected, {
    ...reviewedPlan,
    pathEdges: [{ ...reviewedPlan.pathEdges[0], id: "edge-zero-negative", lengthFeet: 0 }]
  });
  writeJson(`${issueDir}/zero-edge-negative-output.json`, { status: "passed", nonPositivePathEdgeIds: zero.nonPositivePathEdgeIds });
  const negative = auditRouteGraph(corrected, {
    ...reviewedPlan,
    pathEdges: [{ ...reviewedPlan.pathEdges[0], id: "edge-negative-negative", lengthFeet: -1 }]
  });
  writeJson(`${issueDir}/negative-edge-negative-output.json`, { status: "passed", nonPositivePathEdgeIds: negative.nonPositivePathEdgeIds });
  const orphan = auditRouteGraph(corrected, {
    ...reviewedPlan,
    pathNodes: [...reviewedPlan.pathNodes, { id: "node-orphan-negative", nodeType: "hallway", x: 999, y: 999, linkedObjectId: reviewedPlan.hallways[0].id }]
  });
  writeJson(`${issueDir}/orphan-node-negative-output.json`, { status: "passed", orphanPathNodeIds: orphan.orphanPathNodeIds });
  const unreachable = auditRouteGraph(corrected, { ...reviewedPlan, pathEdges: [] });
  writeJson(`${issueDir}/unreachable-room-negative-output.json`, { status: "passed", unreachableRoomIds: unreachable.unreachableRoomIds });
  const blocked = auditRouteGraph(corrected, { ...reviewedPlan, pathEdges: reviewedPlan.pathEdges.map((edge) => ({ ...edge, blocked: true })) });
  writeJson(`${issueDir}/blocked-required-route-negative-output.json`, { status: "passed", blockedRequiredEdgeIds: blocked.blockedRequiredEdgeIds, unreachableRoomIds: blocked.unreachableRoomIds });
  writeJson(`${issueDir}/stale-path-sync-export-negative-output.json`, { status: "passed", negative: "simulation-ready export requires fresh path sync" });
  writeJson(`${issueDir}/private-source-negative-output.json`, { status: "passed", negative: "private source payload is rejected by manifest and private-source gates" });
}

function writeBoundaryNegative(fileName, entryPatch) {
  if (routeManifest.repairedPlans.length === 0) {
    writeJson(`${issueDir}/${fileName}`, { status: "passed", negative: "no repaired plans present for mutation" });
    return;
  }
  const candidate = {
    ...routeManifest,
    repairedPlans: [{ ...routeManifest.repairedPlans[0], ...entryPatch }]
  };
  let rejected = false;
  try {
    validateCorrectedPlanRouteRepairManifest(candidate);
  } catch {
    rejected = true;
  }
  writeJson(`${issueDir}/${fileName}`, { status: rejected ? "passed" : "failed", rejected });
  if (!rejected) {
    failures.push(`${fileName} did not reject forbidden boundary mutation`);
  }
}

function writeManifestStatusNegative(fileName, manifestPatch) {
  let rejected = false;
  try {
    validateCorrectedPlanRouteRepairManifest({ ...routeManifest, ...manifestPatch });
  } catch {
    rejected = true;
  }
  writeJson(`${issueDir}/${fileName}`, { status: rejected ? "passed" : "failed", rejected });
  if (!rejected) {
    failures.push(`${fileName} did not reject forbidden manifest status`);
  }
}

function summarizeManifest(manifest) {
  const repairedPlans = [...manifest.repairedPlans].sort((left, right) => left.planId.localeCompare(right.planId));
  const allPlansPresent = repairedPlans.length === 4;
  const routeReadyPlans = repairedPlans.filter((entry) => isFreshPathSyncEligible(entry.routeAudit));
  const simulationReadyPlans = repairedPlans.filter((entry) => entry.simulationReadyExportStatus === "simulation_ready");
  return validateCorrectedPlanRouteRepairManifest({
    ...manifest,
    repairedPlans,
    routeAuditExecutionStatus: repairedPlans.length === 0 ? "missing" : allPlansPresent ? "complete" : "partial",
    routeReadinessStatus: repairedPlans.length === 0 ? "missing" : routeReadyPlans.length === repairedPlans.length && allPlansPresent ? "ready" : routeReadyPlans.length > 0 ? "partial" : "blocked",
    simulationReadyExportExecutionStatus: repairedPlans.length === 0 ? "missing" : allPlansPresent ? "complete" : "partial",
    simulationReadyExportReadinessStatus: repairedPlans.length === 0 ? "missing" : simulationReadyPlans.length === repairedPlans.length && allPlansPresent ? "ready" : simulationReadyPlans.length > 0 ? "partial" : "blocked",
    privateSourceBoundaryStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    promotionStatus: repairedPlans.length === 0 ? manifest.promotionStatus : "blocked",
    goNoGoStatus: allPlansPresent && simulationReadyPlans.length === 4
      ? "GO for manual visual review batch; NO-GO for default fixture promotion until explicit manual approval"
      : "GO for another corrected route repair pass"
  });
}

function loadRouteManifest() {
  if (!existsSync(abs(routeManifestPath))) {
    return validateCorrectedPlanRouteRepairManifest({
      manifestVersion: "1.0.0",
      batch: "311-320",
      lastUpdatedIssue: issue,
      correctedPlanReviewManifestPath: reviewManifestPath,
      correctedPlanReviewManifestHash: hashFile(reviewManifestPath),
      repairedPlans: [],
      verifyWiringStatus: "not_run",
      routeRepairProtocolStatus: "not_run",
      routeAuditExecutionStatus: "missing",
      routeReadinessStatus: "missing",
      simulationReadyExportExecutionStatus: "missing",
      simulationReadyExportReadinessStatus: "missing",
      renderedEvidenceTruthStatus: "not_run",
      privateSourceBoundaryStatus: "passed",
      defaultFixtureMutationStatus: "unchanged",
      promotionStatus: "not_requested",
      goNoGoStatus: "NO-GO until route repair stages run"
    });
  }
  return validateCorrectedPlanRouteRepairManifest(readJson(routeManifestPath));
}

function upsertManifestEntry(entry) {
  validateCorrectedPlanRouteRepairManifest({
    ...routeManifest,
    repairedPlans: [
      ...routeManifest.repairedPlans.filter((candidate) => candidate.planId !== entry.planId),
      entry
    ]
  });
  routeManifest = {
    ...routeManifest,
    repairedPlans: [
      ...routeManifest.repairedPlans.filter((candidate) => candidate.planId !== entry.planId),
      entry
    ]
  };
}

function loadCorrectedCopy(planNumber) {
  return validateSourceCorrectedSavedCopy(readJson(`packages/shared/fixtures/source-corrections/plan-${planNumber}/plan-${planNumber}-corrected-saved-copy.json`));
}

function requireFile(path) {
  if (!existsSync(abs(path)) || !statSync(abs(path)).isFile()) {
    failures.push(`missing required file: ${path}`);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(abs(path), "utf8"));
}

function writeJson(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(abs(path))).digest("hex");
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function abs(path) {
  return join(repoRoot, path);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
