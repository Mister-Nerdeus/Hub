import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const issue = readArg("--issue") ?? "331";
const manualManifestPath = "docs/verification/manual-visual-review-manifest.json";
const routeRepairManifestPath = "docs/verification/corrected-plan-route-repair-manifest.json";
const snapshotJsonPath = "apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json";
const snapshotTsPath = "apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.ts";
const uxManifestPath = "docs/verification/plan-builder-ux-review-flow-manifest.json";
const issueDir = `docs/verification/issues/issue-${issue}`;

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const manualManifest = readJson(manualManifestPath);
const routeRepairManifest = readJson(routeRepairManifestPath);
const routeEntries = new Map(routeRepairManifest.repairedPlans.map((entry) => [entry.planId, entry]));

const plans = manualManifest.reviewedPlans.map((entry) => {
  const routeEntry = routeEntries.get(entry.planId);
  const metadata = readJson(entry.renderedEvidenceMetadataPath);
  return {
    planId: entry.planId,
    displayName: displayNameForPlan(entry.planId),
    safeReviewPacketLabel: `${displayNameForPlan(entry.planId)} manual review packet`,
    safeReviewTemplateLabel: `${displayNameForPlan(entry.planId)} review record template`,
    safeRenderedEvidenceLabel: `${displayNameForPlan(entry.planId)} rendered operational review evidence`,
    reviewPacketPath: entry.reviewPacketPath,
    reviewPacketHash: hashFile(entry.reviewPacketPath),
    reviewRecordTemplatePath: entry.reviewRecordTemplatePath,
    reviewRecordTemplateHash: hashFile(entry.reviewRecordTemplatePath),
    renderedEvidencePath: entry.renderedEvidencePath,
    renderedEvidenceHash: hashFile(entry.renderedEvidencePath),
    renderedEvidenceMetadataPath: entry.renderedEvidenceMetadataPath,
    renderedEvidenceMetadataHash: hashFile(entry.renderedEvidenceMetadataPath),
    correctedSavedCopyPath: routeEntry?.correctedSavedCopyPath ?? "",
    correctedSavedCopyHash: routeEntry?.correctedSavedCopyPath == null ? "" : hashFile(routeEntry.correctedSavedCopyPath),
    repairedSavedCopyPath: entry.repairedSavedCopyPath,
    repairedSavedCopyHash: hashFile(entry.repairedSavedCopyPath),
    simulationReadyExportPath: entry.simulationReadyExportPath,
    simulationReadyExportHash: hashFile(entry.simulationReadyExportPath),
    routeRepairReportPath: routeEntry?.routeRepairReportPath ?? "",
    routeRepairReportHash: routeEntry?.routeRepairReportPath == null ? "" : hashFile(routeEntry.routeRepairReportPath),
    routeReadinessStatus: entry.routeReadinessStatus,
    simulationReadyExportStatus: entry.simulationReadyExportStatus,
    manualReviewStatus: "manual_review_required",
    promotionStatus: "blocked",
    reviewerDecisionSource: "none",
    renderedEvidenceMetadataSummary: {
      widthPx: metadata.widthPx,
      heightPx: metadata.heightPx,
      objectCounts: metadata.objectCounts,
      drawCounts: metadata.drawCounts,
      renderedFromCorrectedSavedCopy: metadata.renderedFromCorrectedSavedCopy === true,
      privateSourceScreenshotStored: metadata.privateSourceScreenshotStored === true,
      exactParityClaimMade: metadata.exactParityClaimMade === true
    },
    visibleInPlanLibrary: true,
    hasStatusBadge: true,
    hasRenderedPreview: true,
    hasReviewPacketReference: true,
    hasReviewTemplateReference: true,
    hasReviewHelperEntry: true,
    hasPromotionBlockedNotice: true,
    canPromote: false,
    codexClaimedApproval: false,
    sampleRecordCountsAsApproval: false,
    exactParityClaimMade: false,
    privateSourcePayloadStored: false,
    limitations: [
      "Manual review is required before promotion.",
      "Promotion is blocked.",
      "Route and export readiness are operational readiness signals only.",
      "Rendered evidence is operational review evidence only.",
      "No exact source-document parity is claimed.",
      "No clinical or staffing compliance certification is produced."
    ]
  };
});

const snapshot = {
  snapshotVersion: "1.0.0",
  batch: "331-340",
  lastUpdatedIssue: issue,
  generatedFrom: {
    manualVisualReviewManifestPath: manualManifestPath,
    manualVisualReviewManifestHash: hashFile(manualManifestPath),
    routeRepairManifestPath,
    routeRepairManifestHash: hashFile(routeRepairManifestPath)
  },
  governance: {
    manualReviewRequired: true,
    promotionStatus: "blocked",
    defaultFixturesUnchanged: true,
    routeExportReadinessIsApproval: false,
    renderedEvidenceIsOperationalOnly: true,
    exactParityClaimMade: false,
    clinicalOrStaffingCertificationClaimed: false
  },
  plans
};

assertSafeSnapshot(snapshot);
writeJson(snapshotJsonPath, snapshot);
writeText(snapshotTsPath, buildSnapshotTs(snapshot));
updateUxManifest();

const output = {
  issue,
  status: "passed",
  snapshotJsonPath,
  snapshotJsonHash: hashFile(snapshotJsonPath),
  snapshotTsPath,
  snapshotTsHash: hashFile(snapshotTsPath),
  uxManifestPath,
  uxManifestHash: hashFile(uxManifestPath),
  planCount: plans.length,
  manualReviewStatuses: plans.map((plan) => [plan.planId, plan.manualReviewStatus]),
  promotionStatuses: plans.map((plan) => [plan.planId, plan.promotionStatus])
};
writeJson(`${issueDir}/ui-snapshot-builder-output.json`, output);
writeJson(`${issueDir}/ui-snapshot-output.json`, snapshot);
writeJson(`${issueDir}/ui-snapshot-safe-fields-output.json`, {
  status: "passed",
  forbiddenFieldsAbsent: [
    "sourceSavedCopyPath",
    "sourceFilename",
    "sourceDocumentPath",
    "rawSourceText",
    "ocrDump",
    "privateSourceScreenshot"
  ],
  safePlanFields: Object.keys(plans[0] ?? {}).sort()
});
console.log(JSON.stringify(output, null, 2));

function updateUxManifest() {
  if (!existsSync(abs(uxManifestPath))) {
    return;
  }
  const uxManifest = readJson(uxManifestPath);
  writeJson(uxManifestPath, {
    ...uxManifest,
    lastUpdatedIssue: issue,
    manualVisualReviewManifestHash: hashFile(manualManifestPath),
    routeRepairManifestHash: hashFile(routeRepairManifestPath),
    uiSnapshotHash: hashFile(snapshotJsonPath)
  });
}

function buildSnapshotTs(value) {
  return `export const planBuilderReviewFlowSnapshot = ${JSON.stringify(value, null, 2)} as const;

export type PlanBuilderReviewFlowSnapshot = typeof planBuilderReviewFlowSnapshot;
export type PlanBuilderReviewFlowSnapshotPlan = PlanBuilderReviewFlowSnapshot["plans"][number];
`;
}

function assertSafeSnapshot(value) {
  const serialized = JSON.stringify(value);
  const forbidden = [
    /sourceSavedCopyPath/u,
    /sourceFilename/u,
    /sourceDocumentPath/u,
    /rawSourceText/u,
    /ocrDump/u,
    /privateSourceScreenshot(?!Stored)/u,
    /\.docx\b/iu,
    /[A-Za-z]:[\\/]/u,
    /\bapproved for promotion\b/iu,
    /\bpromotion ready\b/iu,
    /\bexact (?:CAD|DOCX)\b/iu
  ];
  for (const pattern of forbidden) {
    if (pattern.test(serialized)) {
      throw new Error(`unsafe plan builder review-flow snapshot content: ${pattern}`);
    }
  }
  for (const plan of value.plans) {
    if (plan.manualReviewStatus !== "manual_review_required") {
      throw new Error(`${plan.planId} must remain manual_review_required`);
    }
    if (plan.promotionStatus !== "blocked" || plan.canPromote !== false) {
      throw new Error(`${plan.planId} promotion must remain blocked`);
    }
    if (plan.codexClaimedApproval || plan.sampleRecordCountsAsApproval || plan.privateSourcePayloadStored) {
      throw new Error(`${plan.planId} contains approval/private-source drift`);
    }
  }
}

function displayNameForPlan(planId) {
  return `Plan ${planId.replace("plan-", "")}`;
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function readJson(path) {
  return JSON.parse(readFileSync(abs(path), "utf8"));
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function hashFile(path) {
  if (!existsSync(abs(path)) || !statSync(abs(path)).isFile()) {
    throw new Error(`missing required file for hash: ${path}`);
  }
  return createHash("sha256").update(readFileSync(abs(path))).digest("hex");
}

function abs(path) {
  return join(repoRoot, path);
}
