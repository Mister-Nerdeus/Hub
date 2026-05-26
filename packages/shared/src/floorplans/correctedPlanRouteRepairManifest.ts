import { assertNoForbiddenSourcePayload } from "./authoringDraftContract.js";
import {
  SIMULATION_READY_EXPORT_STATUSES,
  type SimulationReadyExportStatus
} from "./simulationReadyExportContract.js";
import type {
  CorrectedPlanPathSyncStatus,
  CorrectedPlanRouteAudit,
  CorrectedPlanRouteRepairStatus
} from "./correctedPlanRouteAudit.js";

export const CORRECTED_PLAN_ROUTE_REPAIR_BATCH = "311-320" as const;
export const CORRECTED_PLAN_ROUTE_REPAIR_PLAN_IDS = ["plan-2", "plan-3", "plan-4", "plan-5"] as const;

export type CorrectedPlanRouteRepairPlanId = (typeof CORRECTED_PLAN_ROUTE_REPAIR_PLAN_IDS)[number];

export type CorrectedPlanRouteRepairEntry = {
  planId: CorrectedPlanRouteRepairPlanId;
  sourceDefaultPlanId: string;
  correctedSavedCopyPath: string;
  correctedSavedCopyHashBefore: string;
  repairedSavedCopyPath: string;
  repairedSavedCopyHash: string;
  routeRepairReportPath: string;
  routeRepairReportHash: string;
  simulationReadyExportPath?: string;
  simulationReadyExportHash?: string;
  routeRepairStatus: CorrectedPlanRouteRepairStatus;
  pathSyncStatus: CorrectedPlanPathSyncStatus;
  routeAudit: CorrectedPlanRouteAudit;
  simulationReadyExportStatus: SimulationReadyExportStatus;
  privateSourcePayloadStored: false;
  exactParityClaimMade: false;
  sourceFixtureUnchanged: true;
  manualVisualReviewClaimed: false;
  promotionCandidateStatus:
    | "not_candidate"
    | "manual_review_candidate"
    | "future_promotion_review_candidate"
    | "blocked_by_route_audit"
    | "blocked_by_export_status"
    | "blocked_by_private_source_boundary";
  blockingIssues: string[];
  warningIssues: string[];
  limitations: string[];
  goNoGo: string;
};

export type CorrectedPlanRouteRepairManifest = {
  manifestVersion: string;
  batch: typeof CORRECTED_PLAN_ROUTE_REPAIR_BATCH;
  lastUpdatedIssue: string;
  correctedPlanReviewManifestPath: string;
  correctedPlanReviewManifestHash: string;
  repairedPlans: CorrectedPlanRouteRepairEntry[];
  verifyWiringStatus: "not_run" | "passed" | "failed";
  routeRepairProtocolStatus: "not_run" | "passed" | "failed";
  routeAuditExecutionStatus: "missing" | "partial" | "complete";
  routeReadinessStatus: "missing" | "partial" | "ready" | "blocked";
  simulationReadyExportExecutionStatus: "missing" | "partial" | "complete";
  simulationReadyExportReadinessStatus: "missing" | "partial" | "ready" | "blocked";
  renderedEvidenceTruthStatus: "not_run" | "passed" | "failed";
  privateSourceBoundaryStatus: "passed" | "failed";
  defaultFixtureMutationStatus: "unchanged" | "changed" | "unknown";
  promotionStatus: "not_requested" | "blocked";
  goNoGoStatus: string;
};

export function validateCorrectedPlanRouteRepairManifest(value: unknown): CorrectedPlanRouteRepairManifest {
  assertNoForbiddenSourcePayload(value, "correctedPlanRouteRepairManifest");
  const manifest = requireRecord(value, "correctedPlanRouteRepairManifest");
  requireExactKeys(manifest, "correctedPlanRouteRepairManifest", [
    "manifestVersion",
    "batch",
    "lastUpdatedIssue",
    "correctedPlanReviewManifestPath",
    "correctedPlanReviewManifestHash",
    "repairedPlans",
    "verifyWiringStatus",
    "routeRepairProtocolStatus",
    "routeAuditExecutionStatus",
    "routeReadinessStatus",
    "simulationReadyExportExecutionStatus",
    "simulationReadyExportReadinessStatus",
    "renderedEvidenceTruthStatus",
    "privateSourceBoundaryStatus",
    "defaultFixtureMutationStatus",
    "promotionStatus",
    "goNoGoStatus"
  ]);
  const repairedPlans = requireArray(manifest.repairedPlans, "repairedPlans").map(validateRepairEntry);
  const planIds = repairedPlans.map((entry) => entry.planId);
  if (new Set(planIds).size !== planIds.length) {
    throw new Error("repairedPlans planId values must be unique");
  }
  if (repairedPlans.some((entry) => entry.privateSourcePayloadStored !== false)) {
    throw new Error("route repair manifest must not store private source payload");
  }
  if (repairedPlans.some((entry) => entry.exactParityClaimMade !== false)) {
    throw new Error("route repair manifest must not claim exact CAD or DOCX parity");
  }
  if (repairedPlans.some((entry) => entry.manualVisualReviewClaimed !== false)) {
    throw new Error("route repair manifest must not claim manual visual review");
  }

  return {
    manifestVersion: requireString(manifest.manifestVersion, "manifestVersion"),
    batch: requireLiteral(manifest.batch, CORRECTED_PLAN_ROUTE_REPAIR_BATCH, "batch"),
    lastUpdatedIssue: requireString(manifest.lastUpdatedIssue, "lastUpdatedIssue"),
    correctedPlanReviewManifestPath: requireRelativePath(
      manifest.correctedPlanReviewManifestPath,
      "correctedPlanReviewManifestPath"
    ),
    correctedPlanReviewManifestHash: requireSha256(
      manifest.correctedPlanReviewManifestHash,
      "correctedPlanReviewManifestHash"
    ),
    repairedPlans,
    verifyWiringStatus: requireEnum(manifest.verifyWiringStatus, ["not_run", "passed", "failed"] as const, "verifyWiringStatus"),
    routeRepairProtocolStatus: requireEnum(manifest.routeRepairProtocolStatus, ["not_run", "passed", "failed"] as const, "routeRepairProtocolStatus"),
    routeAuditExecutionStatus: requireEnum(manifest.routeAuditExecutionStatus, ["missing", "partial", "complete"] as const, "routeAuditExecutionStatus"),
    routeReadinessStatus: requireEnum(manifest.routeReadinessStatus, ["missing", "partial", "ready", "blocked"] as const, "routeReadinessStatus"),
    simulationReadyExportExecutionStatus: requireEnum(manifest.simulationReadyExportExecutionStatus, ["missing", "partial", "complete"] as const, "simulationReadyExportExecutionStatus"),
    simulationReadyExportReadinessStatus: requireEnum(manifest.simulationReadyExportReadinessStatus, ["missing", "partial", "ready", "blocked"] as const, "simulationReadyExportReadinessStatus"),
    renderedEvidenceTruthStatus: requireEnum(manifest.renderedEvidenceTruthStatus, ["not_run", "passed", "failed"] as const, "renderedEvidenceTruthStatus"),
    privateSourceBoundaryStatus: requireEnum(manifest.privateSourceBoundaryStatus, ["passed", "failed"] as const, "privateSourceBoundaryStatus"),
    defaultFixtureMutationStatus: requireEnum(manifest.defaultFixtureMutationStatus, ["unchanged", "changed", "unknown"] as const, "defaultFixtureMutationStatus"),
    promotionStatus: requireEnum(manifest.promotionStatus, ["not_requested", "blocked"] as const, "promotionStatus"),
    goNoGoStatus: requireString(manifest.goNoGoStatus, "goNoGoStatus")
  };
}

function validateRepairEntry(value: unknown, index: number): CorrectedPlanRouteRepairEntry {
  const label = `repairedPlans[${index}]`;
  const entry = requireRecord(value, label);
  const requiredKeys = [
    "planId",
    "sourceDefaultPlanId",
    "correctedSavedCopyPath",
    "correctedSavedCopyHashBefore",
    "repairedSavedCopyPath",
    "repairedSavedCopyHash",
    "routeRepairReportPath",
    "routeRepairReportHash",
    "routeRepairStatus",
    "pathSyncStatus",
    "routeAudit",
    "simulationReadyExportStatus",
    "privateSourcePayloadStored",
    "exactParityClaimMade",
    "sourceFixtureUnchanged",
    "manualVisualReviewClaimed",
    "promotionCandidateStatus",
    "blockingIssues",
    "warningIssues",
    "limitations",
    "goNoGo"
  ];
  requireOnlyKeys(entry, label, [...requiredKeys, "simulationReadyExportPath", "simulationReadyExportHash"]);
  const simulationReadyExportPath = entry.simulationReadyExportPath == null
    ? undefined
    : requireRelativePath(entry.simulationReadyExportPath, `${label}.simulationReadyExportPath`);
  const simulationReadyExportHash = entry.simulationReadyExportHash == null
    ? undefined
    : requireSha256(entry.simulationReadyExportHash, `${label}.simulationReadyExportHash`);
  if ((simulationReadyExportPath == null) !== (simulationReadyExportHash == null)) {
    throw new Error(`${label}.simulationReadyExportPath and simulationReadyExportHash must be provided together`);
  }

  return {
    planId: requireEnum(entry.planId, CORRECTED_PLAN_ROUTE_REPAIR_PLAN_IDS, `${label}.planId`),
    sourceDefaultPlanId: requireString(entry.sourceDefaultPlanId, `${label}.sourceDefaultPlanId`),
    correctedSavedCopyPath: requireRelativePath(entry.correctedSavedCopyPath, `${label}.correctedSavedCopyPath`),
    correctedSavedCopyHashBefore: requireSha256(entry.correctedSavedCopyHashBefore, `${label}.correctedSavedCopyHashBefore`),
    repairedSavedCopyPath: requireRelativePath(entry.repairedSavedCopyPath, `${label}.repairedSavedCopyPath`),
    repairedSavedCopyHash: requireSha256(entry.repairedSavedCopyHash, `${label}.repairedSavedCopyHash`),
    routeRepairReportPath: requireRelativePath(entry.routeRepairReportPath, `${label}.routeRepairReportPath`),
    routeRepairReportHash: requireSha256(entry.routeRepairReportHash, `${label}.routeRepairReportHash`),
    simulationReadyExportPath,
    simulationReadyExportHash,
    routeRepairStatus: requireEnum(
      entry.routeRepairStatus,
      ["repaired", "blocked_needs_manual_layout_review", "blocked_invalid_geometry", "blocked_no_safe_route_target"] as const,
      `${label}.routeRepairStatus`
    ),
    pathSyncStatus: requireEnum(entry.pathSyncStatus, ["fresh", "stale_warning", "blocked"] as const, `${label}.pathSyncStatus`),
    routeAudit: validateRouteAudit(entry.routeAudit, `${label}.routeAudit`),
    simulationReadyExportStatus: requireEnum(entry.simulationReadyExportStatus, SIMULATION_READY_EXPORT_STATUSES, `${label}.simulationReadyExportStatus`),
    privateSourcePayloadStored: requireLiteral(entry.privateSourcePayloadStored, false, `${label}.privateSourcePayloadStored`),
    exactParityClaimMade: requireLiteral(entry.exactParityClaimMade, false, `${label}.exactParityClaimMade`),
    sourceFixtureUnchanged: requireLiteral(entry.sourceFixtureUnchanged, true, `${label}.sourceFixtureUnchanged`),
    manualVisualReviewClaimed: requireLiteral(entry.manualVisualReviewClaimed, false, `${label}.manualVisualReviewClaimed`),
    promotionCandidateStatus: requireEnum(
      entry.promotionCandidateStatus,
      [
        "not_candidate",
        "manual_review_candidate",
        "future_promotion_review_candidate",
        "blocked_by_route_audit",
        "blocked_by_export_status",
        "blocked_by_private_source_boundary"
      ] as const,
      `${label}.promotionCandidateStatus`
    ),
    blockingIssues: requireStringArray(entry.blockingIssues, `${label}.blockingIssues`),
    warningIssues: requireStringArray(entry.warningIssues, `${label}.warningIssues`),
    limitations: requireStringArray(entry.limitations, `${label}.limitations`),
    goNoGo: requireString(entry.goNoGo, `${label}.goNoGo`)
  };
}

function validateRouteAudit(value: unknown, label: string): CorrectedPlanRouteAudit {
  const audit = requireRecord(value, label);
  requireExactKeys(audit, label, [
    "roomsChecked",
    "roomsMissingDoor",
    "roomsMissingPathNode",
    "unreachableRoomIds",
    "orphanPathNodeIds",
    "danglingPathEdgeIds",
    "invalidPathEdgeIds",
    "nonFinitePathEdgeIds",
    "nonPositivePathEdgeIds",
    "blockedRequiredEdgeIds",
    "stationToRoomRoutesChecked",
    "stationToRoomRoutesPassed"
  ]);
  return {
    roomsChecked: requireNonNegativeInteger(audit.roomsChecked, `${label}.roomsChecked`),
    roomsMissingDoor: requireStringArray(audit.roomsMissingDoor, `${label}.roomsMissingDoor`),
    roomsMissingPathNode: requireStringArray(audit.roomsMissingPathNode, `${label}.roomsMissingPathNode`),
    unreachableRoomIds: requireStringArray(audit.unreachableRoomIds, `${label}.unreachableRoomIds`),
    orphanPathNodeIds: requireStringArray(audit.orphanPathNodeIds, `${label}.orphanPathNodeIds`),
    danglingPathEdgeIds: requireStringArray(audit.danglingPathEdgeIds, `${label}.danglingPathEdgeIds`),
    invalidPathEdgeIds: requireStringArray(audit.invalidPathEdgeIds, `${label}.invalidPathEdgeIds`),
    nonFinitePathEdgeIds: requireStringArray(audit.nonFinitePathEdgeIds, `${label}.nonFinitePathEdgeIds`),
    nonPositivePathEdgeIds: requireStringArray(audit.nonPositivePathEdgeIds, `${label}.nonPositivePathEdgeIds`),
    blockedRequiredEdgeIds: requireStringArray(audit.blockedRequiredEdgeIds, `${label}.blockedRequiredEdgeIds`),
    stationToRoomRoutesChecked: requireNonNegativeInteger(
      audit.stationToRoomRoutesChecked,
      `${label}.stationToRoomRoutesChecked`
    ),
    stationToRoomRoutesPassed: requireNonNegativeInteger(
      audit.stationToRoomRoutesPassed,
      `${label}.stationToRoomRoutesPassed`
    )
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  requireOnlyKeys(value, label, allowedKeys);
  for (const key of allowedKeys) {
    if (!(key in value)) {
      throw new Error(`${label}.${key} is required`);
    }
  }
}

function requireOnlyKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireRelativePath(value: unknown, label: string): string {
  const text = requireString(value, label).replaceAll("\\", "/");
  if (/^[a-zA-Z]:[\\/]/.test(text) || text.startsWith("/") || text.includes("..")) {
    throw new Error(`${label} must be a repo-relative path`);
  }
  return text;
}

function requireSha256(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (!/^[a-f0-9]{64}$/u.test(text)) {
    throw new Error(`${label} must be a SHA-256 hex digest`);
  }
  return text;
}

function requireStringArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((entry, index) => requireString(entry, `${label}[${index}]`));
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value as number;
}

function requireLiteral<T extends string | boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}
