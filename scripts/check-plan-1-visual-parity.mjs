import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const sharedDistIndex = join(repoRoot, "packages", "shared", "dist", "index.js");
if (!existsSync(sharedDistIndex)) {
  throw new Error("Missing packages/shared/dist/index.js; run npm --workspace packages/shared run build first.");
}

const {
  auditPlan1VisualParityGaps,
  auditDefaultPlanPathEdgeCoverage,
  auditDefaultPlanPathNodeCoverage,
  validateSourceMappingAgainstPlan,
  validateDefaultSavedPlanFixtureContract,
  validatePlanVisualParitySourceTruthContract
} = await import("../packages/shared/dist/index.js");

const args = new Set(process.argv.slice(2));
const issueArgIndex = process.argv.indexOf("--issue");
const issue = issueArgIndex >= 0 ? process.argv[issueArgIndex + 1] : null;
const issueNumber = issue == null ? null : Number.parseInt(issue, 10);
const stageArgIndex = process.argv.indexOf("--stage");
const stage = stageArgIndex >= 0 ? process.argv[stageArgIndex + 1] : "final";
const stageIssueThresholds = {
  "source-truth": 229,
  gap: 230,
  scaffold: 231,
  rooms: 232,
  "operational-areas": 233,
  access: 234,
  "path-graph": 235,
  "walking-baseline": 236,
  mapping: 237,
  render: 238,
  export: 239,
  final: 240
};
if (!Object.hasOwn(stageIssueThresholds, stage)) {
  throw new Error(
    `Unsupported --stage "${stage}". Expected one of: ${Object.keys(stageIssueThresholds).join(", ")}`
  );
}
const allowCurrentFailure = args.has("--allow-current-failure");
const allowPartial = args.has("--allow-partial");
const stageIssueNumber = stageIssueThresholds[stage];
const effectiveIssueNumber = issueNumber ?? stageIssueNumber;
const evidenceIssue = issue ?? (effectiveIssueNumber == null ? null : String(effectiveIssueNumber));

const sourceTruthRelativePath =
  "packages/shared/fixtures/default-plans/visual-parity/plan-1-source-truth.json";
const planRelativePath = "packages/shared/fixtures/default-plans/default-er-layout-plan-1.json";
const walkingBaselineRelativePath =
  "packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json";
const sourceMappingRelativePath =
  "packages/shared/fixtures/default-plans/source-mappings/mapping-er-layout-plan-1.json";
const sourceTruth = readJson(sourceTruthRelativePath);
const walkingBaseline = readJson(walkingBaselineRelativePath);
const sourceMapping = readJson(sourceMappingRelativePath);
const planFixture = validateDefaultSavedPlanFixtureContract(readJson(planRelativePath), {
  sourcePlanIds: new Set(["source-er-layout-plan-1"]),
  mappingIds: new Set(["mapping-er-layout-plan-1"])
});
const sourceTruthValidation = validatePlanVisualParitySourceTruthContract(sourceTruth);
const audit = auditPlan1VisualParityGaps(sourceTruth, planFixture.plan, sourceTruthRelativePath);
const pathNodeCoverage = auditDefaultPlanPathNodeCoverage(planFixture.plan);
const pathEdgeCoverage = auditDefaultPlanPathEdgeCoverage(planFixture.plan);
const validatedSourceMapping = validateSourceMappingAgainstPlan(sourceMapping, planFixture.plan);
const requiredWalkingBaselineGroups = [
  "left-station-to-left-pod-rooms",
  "right-station-to-right-pod-rooms",
  "ems-entry-to-trauma",
  "provider-pharmacy-to-rooms",
  "bottom-hallway-to-bottom-rooms",
  "right-hallway-to-right-side-rooms"
];
const walkingBaselineGroupIds = walkingBaseline.routeGroupSummaries?.map((group) => group.groupId) ?? [];
const missingWalkingBaselineGroups = requiredWalkingBaselineGroups.filter(
  (groupId) => !walkingBaselineGroupIds.includes(groupId)
);
const sourceMappingTargetIds = new Set(validatedSourceMapping.objects.map((object) => object.targetObjectId));
const requiredMappedSourceTruthTargets = sourceTruth.visibleObjects
  .map((entry) => entry.expectedTargetId)
  .filter((targetId) => targetId != null);
const missingSourceMappingTargets = requiredMappedSourceTruthTargets.filter(
  (targetId) => !sourceMappingTargetIds.has(targetId)
);
const provenanceHistogram = {};
for (const object of validatedSourceMapping.objects) {
  provenanceHistogram[object.conversionProvenance] =
    (provenanceHistogram[object.conversionProvenance] ?? 0) + 1;
}
const requiredRenderedLabels = [
  "Level 1 Trauma",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "Provider Pharmacy"
];
const renderEvidence = evidenceIssue == null ? null : readIssueEvidenceJson(
  evidenceIssue,
  "plan-1-render-object-count-output.json",
  "238"
);
const labelRenderEvidence = evidenceIssue == null ? null : readIssueEvidenceJson(
  evidenceIssue,
  "plan-1-label-render-coverage-output.json",
  "238"
);
const oldRenderNegativeEvidence = evidenceIssue == null ? null : readIssueEvidenceJson(
  evidenceIssue,
  "plan-1-old-render-negative-output.json",
  "238"
);
const renderedLabelCoverage = labelRenderEvidence?.coverage ?? {};
const missingRenderedLabels = requiredRenderedLabels.filter((label) => renderedLabelCoverage[label] !== true);
const exportIntegrityEvidence = evidenceIssue == null ? null : readIssueEvidenceJson(
  evidenceIssue,
  "edited-plan-export-output.json",
  "239"
);
const sourcePlanNonmutationEvidence = evidenceIssue == null ? null : readIssueEvidenceJson(
  evidenceIssue,
  "source-plan-nonmutation-output.json",
  "239"
);
const noDocxExportEvidence = evidenceIssue == null ? null : readIssueEvidenceJson(
  evidenceIssue,
  "no-docx-export-output.json",
  "239"
);

const legacyRoomIdsPresent = planFixture.plan.rooms
  .filter((room) => sourceTruth.legacyFixtureRejections.unsupportedRoomIds.includes(room.id))
  .map((room) => room.id);
const legacyStationIdsPresent = planFixture.plan.nurseStations
  .filter((station) => sourceTruth.legacyFixtureRejections.unsupportedStationIds.includes(station.id))
  .map((station) => station.id);
const oldSimplifiedRoomCountFailure =
  planFixture.plan.rooms.length <= sourceTruth.legacyFixtureRejections.maximumOldSimplifiedRoomCount;

const failures = [
  ...audit.minimumCountFailures.map(
    (failure) =>
      `MINIMUM_COUNT_${failure.category}: observed ${failure.observed}, required ${failure.minimum}`
  ),
  ...audit.missingRequiredObjects.map(
    (failure) => `MISSING_${failure.objectKind}: ${failure.sourceLabel} -> ${failure.expectedTargetId}`
  ),
  ...audit.providerPharmacyModelingFailures.map((failure) => `PROVIDER_PHARMACY: ${failure}`),
  ...audit.nurseStationCountFailures.map((failure) => `NURSE_STATION: ${failure}`),
  ...legacyRoomIdsPresent.map((id) => `LEGACY_ROOM_PRESENT: ${id}`),
  ...legacyStationIdsPresent.map((id) => `LEGACY_STATION_PRESENT: ${id}`)
];

if (oldSimplifiedRoomCountFailure) {
  failures.push(
    `OLD_SIMPLIFIED_ROOM_COUNT: observed ${planFixture.plan.rooms.length}, threshold ${sourceTruth.legacyFixtureRejections.maximumOldSimplifiedRoomCount}`
  );
}

const mode = allowCurrentFailure ? "allow-current-failure" : allowPartial ? "allow-partial" : "strict";
const requiredStageFailures = [];
if (effectiveIssueNumber != null && effectiveIssueNumber >= 232) {
  const roomCountFailure = audit.minimumCountFailures.find((failure) => failure.category === "rooms");
  if (roomCountFailure != null) {
    requiredStageFailures.push(
      `ROOM_COUNT_STAGE_FAILURE: observed ${roomCountFailure.observed}, required ${roomCountFailure.minimum}`
    );
  }
  for (const failure of audit.missingRequiredObjects.filter((entry) => entry.objectKind === "room")) {
    requiredStageFailures.push(`ROOM_COVERAGE_STAGE_FAILURE: ${failure.sourceLabel}`);
  }
  for (const legacyRoomId of legacyRoomIdsPresent) {
    requiredStageFailures.push(`LEGACY_ROOM_STAGE_FAILURE: ${legacyRoomId}`);
  }
}
if (effectiveIssueNumber != null && effectiveIssueNumber >= 233) {
  const hallwayCountFailure = audit.minimumCountFailures.find((failure) => failure.category === "hallways");
  if (hallwayCountFailure != null) {
    requiredStageFailures.push(
      `HALLWAY_COUNT_STAGE_FAILURE: observed ${hallwayCountFailure.observed}, required ${hallwayCountFailure.minimum}`
    );
  }
  const nurseStationCountFailure = audit.minimumCountFailures.find((failure) => failure.category === "nurseStations");
  if (nurseStationCountFailure != null) {
    requiredStageFailures.push(
      `NURSE_STATION_COUNT_STAGE_FAILURE: observed ${nurseStationCountFailure.observed}, required ${nurseStationCountFailure.minimum}`
    );
  }
  const providerZoneCountFailure = audit.minimumCountFailures.find(
    (failure) => failure.category === "providerPharmacyZones"
  );
  if (providerZoneCountFailure != null) {
    requiredStageFailures.push(
      `PROVIDER_PHARMACY_ZONE_STAGE_FAILURE: observed ${providerZoneCountFailure.observed}, required ${providerZoneCountFailure.minimum}`
    );
  }
  for (const failure of audit.missingRequiredObjects.filter((entry) =>
    ["zone", "hallway", "nurse_station"].includes(entry.objectKind)
  )) {
    requiredStageFailures.push(`OPERATIONAL_AREA_STAGE_FAILURE: ${failure.objectKind} ${failure.sourceLabel}`);
  }
  for (const failure of audit.providerPharmacyModelingFailures) {
    requiredStageFailures.push(`PROVIDER_PHARMACY_STAGE_FAILURE: ${failure}`);
  }
  for (const failure of audit.nurseStationCountFailures) {
    requiredStageFailures.push(`NURSE_STATION_STAGE_FAILURE: ${failure}`);
  }
  for (const legacyStationId of legacyStationIdsPresent) {
    requiredStageFailures.push(`LEGACY_STATION_STAGE_FAILURE: ${legacyStationId}`);
  }
}
if (effectiveIssueNumber != null && effectiveIssueNumber >= 234) {
  const doorCountFailure = audit.minimumCountFailures.find((failure) => failure.category === "doorsOrAccessPoints");
  if (doorCountFailure != null) {
    requiredStageFailures.push(
      `DOOR_ACCESS_COUNT_STAGE_FAILURE: observed ${doorCountFailure.observed}, required ${doorCountFailure.minimum}`
    );
  }
  for (const failure of audit.missingRequiredObjects.filter((entry) => entry.objectKind === "door_or_access")) {
    requiredStageFailures.push(`DOOR_ACCESS_STAGE_FAILURE: ${failure.sourceLabel}`);
  }
}
if (effectiveIssueNumber != null && effectiveIssueNumber >= 235) {
  if (pathNodeCoverage.status !== "passed") {
    requiredStageFailures.push(
      `PATH_NODE_COVERAGE_STAGE_FAILURE: ${pathNodeCoverage.gaps.map((gap) => gap.code).join(",")}`
    );
  }
  if (pathEdgeCoverage.status !== "passed") {
    requiredStageFailures.push(
      `PATH_EDGE_COVERAGE_STAGE_FAILURE: ${pathEdgeCoverage.gaps.map((gap) => gap.code).join(",")}`
    );
  }
}
if (effectiveIssueNumber != null && effectiveIssueNumber >= 236) {
  for (const groupId of missingWalkingBaselineGroups) {
    requiredStageFailures.push(`WALKING_BASELINE_GROUP_STAGE_FAILURE: ${groupId}`);
  }
  if ((walkingBaseline.unreachableRouteCount ?? 0) > 0) {
    requiredStageFailures.push(`WALKING_BASELINE_UNREACHABLE_STAGE_FAILURE: ${walkingBaseline.unreachableRouteCount}`);
  }
}
if (effectiveIssueNumber != null && effectiveIssueNumber >= 237) {
  for (const targetId of missingSourceMappingTargets) {
    requiredStageFailures.push(`SOURCE_MAPPING_TARGET_STAGE_FAILURE: ${targetId}`);
  }
}
if (effectiveIssueNumber != null && effectiveIssueNumber >= 238) {
  if (renderEvidence == null) {
    requiredStageFailures.push("APP_RENDER_OBJECT_COUNT_EVIDENCE_MISSING");
  } else {
    if ((renderEvidence.roomRenderCount ?? 0) < 23) {
      requiredStageFailures.push(`APP_RENDER_ROOM_COUNT_STAGE_FAILURE: ${renderEvidence.roomRenderCount}`);
    }
    if ((renderEvidence.stationRenderCount ?? 0) < 2) {
      requiredStageFailures.push(`APP_RENDER_STATION_COUNT_STAGE_FAILURE: ${renderEvidence.stationRenderCount}`);
    }
    if ((renderEvidence.providerPharmacyZoneRenderCount ?? 0) < 1) {
      requiredStageFailures.push(
        `APP_RENDER_PROVIDER_PHARMACY_ZONE_STAGE_FAILURE: ${renderEvidence.providerPharmacyZoneRenderCount}`
      );
    }
  }
  if (labelRenderEvidence == null) {
    requiredStageFailures.push("APP_RENDER_LABEL_EVIDENCE_MISSING");
  }
  for (const label of missingRenderedLabels) {
    requiredStageFailures.push(`APP_RENDER_LABEL_STAGE_FAILURE: ${label}`);
  }
  if (oldRenderNegativeEvidence == null) {
    requiredStageFailures.push("APP_RENDER_OLD_LAYOUT_NEGATIVE_EVIDENCE_MISSING");
  } else if (oldRenderNegativeEvidence.oldSimplifiedLayoutPresent !== false) {
    requiredStageFailures.push("APP_RENDER_OLD_LAYOUT_STAGE_FAILURE");
  }
}
if (effectiveIssueNumber != null && effectiveIssueNumber >= 239) {
  if (exportIntegrityEvidence == null) {
    requiredStageFailures.push("EDITOR_EXPORT_INTEGRITY_EVIDENCE_MISSING");
  } else {
    if (exportIntegrityEvidence.exportedPlanValid !== true) {
      requiredStageFailures.push("EDITOR_EXPORT_PLAN_VALIDATION_STAGE_FAILURE");
    }
    if (exportIntegrityEvidence.room14GeometryChanged !== true) {
      requiredStageFailures.push("EDITOR_EXPORT_ROOM_GEOMETRY_STAGE_FAILURE");
    }
  }
  if (sourcePlanNonmutationEvidence == null) {
    requiredStageFailures.push("EDITOR_EXPORT_SOURCE_NONMUTATION_EVIDENCE_MISSING");
  } else if (sourcePlanNonmutationEvidence.sourcePlanUnchanged !== true) {
    requiredStageFailures.push("EDITOR_EXPORT_SOURCE_MUTATION_STAGE_FAILURE");
  }
  if (noDocxExportEvidence == null) {
    requiredStageFailures.push("EDITOR_EXPORT_NO_DOCX_EVIDENCE_MISSING");
  } else if ((noDocxExportEvidence.forbiddenFragmentsFound ?? []).length > 0) {
    requiredStageFailures.push("EDITOR_EXPORT_DOCX_EXPOSURE_STAGE_FAILURE");
  }
}

const status = failures.length === 0
  ? "passed"
  : mode === "strict" || requiredStageFailures.length > 0
    ? "failed"
    : "current_failure_allowed";
const output = {
  issue: issue ?? "unscoped",
  stage,
  status,
  mode,
  planId: planFixture.plan.planId,
  sourceTruthValidation,
  currentCounts: audit.currentCounts,
  minimumCountFailures: audit.minimumCountFailures,
  missingRequiredObjectCount: audit.missingRequiredObjects.length,
  unsupportedLegacyLabels: audit.unsupportedLegacyLabels,
  legacyFixtureRejectionSummary: {
    legacyRoomIdsPresent,
    legacyStationIdsPresent,
    oldSimplifiedRoomCountFailure
  },
  pathGraphSummary: {
    nodeCoverageStatus: pathNodeCoverage.status,
    nodeCoverageGapCount: pathNodeCoverage.gaps.length,
    edgeCoverageStatus: pathEdgeCoverage.status,
    edgeCoverageGapCount: pathEdgeCoverage.gaps.length,
    requiredOperationalNodes: pathEdgeCoverage.counts.requiredOperationalNodes,
    connectedRequiredOperationalNodes: pathEdgeCoverage.counts.connectedRequiredOperationalNodes
  },
  walkingBaselineSummary: {
    baselineId: walkingBaseline.baselineId,
    requiredGroups: requiredWalkingBaselineGroups,
    groupIds: walkingBaselineGroupIds,
    missingGroups: missingWalkingBaselineGroups,
    totalRouteCount: walkingBaseline.totalRouteCount,
    reachableRouteCount: walkingBaseline.reachableRouteCount,
    unreachableRouteCount: walkingBaseline.unreachableRouteCount
  },
  sourceMappingSummary: {
    mappingId: validatedSourceMapping.mappingId,
    mappedObjectCount: validatedSourceMapping.objects.length,
    deferredSourceLabelCount: validatedSourceMapping.deferredSourceLabels.length,
    missingSourceTruthTargetCount: missingSourceMappingTargets.length,
    missingSourceTruthTargets: missingSourceMappingTargets,
    provenanceHistogram
  },
  appRenderSummary: {
    requiredRenderedLabels,
    missingRenderedLabels,
    roomRenderCount: renderEvidence?.roomRenderCount ?? null,
    stationRenderCount: renderEvidence?.stationRenderCount ?? null,
    providerPharmacyZoneRenderCount: renderEvidence?.providerPharmacyZoneRenderCount ?? null,
    oldSimplifiedLayoutPresent: oldRenderNegativeEvidence?.oldSimplifiedLayoutPresent ?? null
  },
  exportIntegritySummary: {
    exportedPlanValid: exportIntegrityEvidence?.exportedPlanValid ?? null,
    room14GeometryChanged: exportIntegrityEvidence?.room14GeometryChanged ?? null,
    sourcePlanUnchanged: sourcePlanNonmutationEvidence?.sourcePlanUnchanged ?? null,
    forbiddenExportFragmentsFound: noDocxExportEvidence?.forbiddenFragmentsFound ?? null
  },
  failureCount: failures.length,
  failures,
  requiredStageFailures,
  nonClaims: sourceTruth.nonClaims
};

if (issue != null) {
  const issueDir = join(repoRoot, "docs", "verification", "issues", `issue-${issue}`);
  mkdirSync(issueDir, { recursive: true });
  writeJson(join(issueDir, "plan-1-legacy-fixture-rejection-output.json"), {
    issue,
    planId: planFixture.plan.planId,
    legacyFixtureRejections: sourceTruth.legacyFixtureRejections,
    legacyRoomIdsPresent,
    legacyStationIdsPresent,
    oldSimplifiedRoomCountFailure,
    status: legacyRoomIdsPresent.length > 0 || legacyStationIdsPresent.length > 0
      ? "current_failure_recorded"
      : "passed"
  });
  if (issue === "231") {
    writeJson(join(issueDir, "plan-1-partial-parity-gate-output.json"), output);
  }
}

console.log(JSON.stringify(output, null, 2));

if (status === "failed") {
  process.exitCode = 1;
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8"));
}

function readOptionalJson(path) {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function readIssueEvidenceJson(issueId, fileName, fallbackIssueId = null) {
  const current = readOptionalJson(
    join(repoRoot, "docs", "verification", "issues", `issue-${issueId}`, fileName)
  );
  if (current != null || fallbackIssueId == null || fallbackIssueId === issueId) {
    return current;
  }
  return readOptionalJson(
    join(repoRoot, "docs", "verification", "issues", `issue-${fallbackIssueId}`, fileName)
  );
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
