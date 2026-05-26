import {
  assertNoForbiddenSourcePayload,
  validateAuthoringDraftContract,
  type AuthoringDraftContract,
  type SourceProvenance
} from "./authoringDraftContract.js";

export const SOURCE_CORRECTION_STAGES = [
  "not_started",
  "saved_copy_created",
  "source_correction_in_progress",
  "visual_audit_ready",
  "route_audit_ready",
  "simulation_export_ready",
  "manual_visual_review_ready",
  "blocked_needs_authoring_refinement"
] as const;

export const PROMOTION_STATUSES = [
  "not_requested",
  "blocked",
  "ready_for_future_promotion_review",
  "promoted"
] as const;

export const PROMOTION_CANDIDATE_STATUSES = [
  "not_candidate",
  "manual_review_candidate",
  "blocked_by_visual_audit",
  "blocked_by_route_audit",
  "blocked_by_export_status",
  "blocked_by_private_source_boundary"
] as const;

export const SOURCE_REVIEW_MODES = [
  "private_visual_reference",
  "private_layout_reference",
  "manual_operator_review"
] as const;

export type SourceCorrectionStage = (typeof SOURCE_CORRECTION_STAGES)[number];
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];
export type PromotionCandidateStatus = (typeof PROMOTION_CANDIDATE_STATUSES)[number];
export type SourceReviewMode = (typeof SOURCE_REVIEW_MODES)[number];

export type SourcePlanCorrectionMetadata = {
  correctionIssue: string;
  sourceReviewMode: SourceReviewMode;
  correctedObjectCounts: {
    rooms: number;
    doors: number;
    hallways: number;
    stations: number;
    zones: number;
  };
  changedRoomIds: string[];
  changedDoorIds: string[];
  addedRoomIds: string[];
  addedDoorIds: string[];
  generatedHallwayIds: string[];
  generatedBorderId: string | null;
  renderedVisualEvidencePath: string;
  exactParityClaimMade: false;
  limitations: string[];
};

export type SourceCorrectedSavedCopy = {
  savedPlanId: string;
  sourceDefaultPlanId: string;
  planId: string;
  displayName: string;
  versionLabel: string;
  authoringDraft: AuthoringDraftContract;
  sourceProvenance: SourceProvenance;
  correctionMetadata: SourcePlanCorrectionMetadata;
  syntheticDataOnly: true;
};

export type SourceCorrectionAudit = {
  planId: string;
  correctedSavedCopyPath: string;
  sourceFixtureUnchanged: true;
  privateSourcePayloadStored: false;
  exactParityClaimMade: false;
  visualAuditStatus: string;
  visualEvidencePath: string;
  routeAuditStatus: string;
  roomsMissingDoor: string[];
  roomsMissingPathNode: string[];
  unreachableRoomIds: string[];
  pathSyncStatus: string;
  simulationReadyExportStatus: string;
  blockingIssues: string[];
  warningIssues: string[];
  promotionRecommendation:
    | "not_ready"
    | "ready_for_manual_visual_review"
    | "ready_for_future_promotion_review"
    | "blocked_needs_authoring_fix";
  promotionCandidateStatus: PromotionCandidateStatus;
  limitations: string[];
};

export type SourcePlanCorrectionManifestEntry = {
  planId: string;
  sourceDefaultPlanId: string;
  correctedSavedCopyPath: string;
  correctionNotesPath: string;
  correctionAuditPath: string;
  visualEvidencePath: string;
  correctionStage: SourceCorrectionStage;
  privateSourcePayloadStored: false;
  sourceFixtureUnchanged: true;
  routeAuditStatus: string;
  simulationReadyExportStatus: string;
  promotionStatus: PromotionStatus;
  promotionCandidateStatus: PromotionCandidateStatus;
  limitations: string[];
  goNoGo: string;
};

export type SourcePlanCorrectionManifest = {
  manifestVersion: string;
  batch: "291-300";
  lastUpdatedIssue: string;
  correctionScope: string;
  sourcePrivacyStatus: string;
  defaultFixtureMutationStatus: string;
  planCorrections: SourcePlanCorrectionManifestEntry[];
  visualEvidence: Record<string, string>;
  routeAuditStatus: Record<string, string>;
  simulationReadyExportStatus: Record<string, string>;
  promotionStatus: Record<string, PromotionStatus>;
  goNoGoStatus: string;
};

export function validateSourceCorrectedSavedCopy(value: unknown): SourceCorrectedSavedCopy {
  assertNoForbiddenSourcePayload(value, "sourceCorrectedSavedCopy");
  const record = requireRecord(value, "sourceCorrectedSavedCopy");
  requireExactKeys(record, "sourceCorrectedSavedCopy", [
    "savedPlanId",
    "sourceDefaultPlanId",
    "planId",
    "displayName",
    "versionLabel",
    "authoringDraft",
    "sourceProvenance",
    "correctionMetadata",
    "syntheticDataOnly"
  ]);

  const authoringDraft = validateAuthoringDraftContract(record.authoringDraft);
  const metadata = validateCorrectionMetadata(record.correctionMetadata);
  if (metadata.exactParityClaimMade !== false) {
    throw new Error("correctionMetadata.exactParityClaimMade must be false");
  }
  if (authoringDraft.sourceProvenance.publicExposureAllowed) {
    throw new Error("corrected saved copy must keep source material private");
  }

  const savedPlanId = requireString(record.savedPlanId, "savedPlanId");
  const sourceDefaultPlanId = requireString(record.sourceDefaultPlanId, "sourceDefaultPlanId");
  const planId = requireString(record.planId, "planId");
  const displayName = requireString(record.displayName, "displayName");
  const versionLabel = requireString(record.versionLabel, "versionLabel");
  if (authoringDraft.sourceDefaultPlanId !== sourceDefaultPlanId) {
    throw new Error("authoringDraft.sourceDefaultPlanId must match sourceDefaultPlanId");
  }
  if (authoringDraft.planId !== planId) {
    throw new Error("authoringDraft.planId must match planId");
  }
  if (authoringDraft.displayName !== displayName) {
    throw new Error("authoringDraft.displayName must match displayName");
  }

  return {
    savedPlanId,
    sourceDefaultPlanId,
    planId,
    displayName,
    versionLabel,
    authoringDraft,
    sourceProvenance: authoringDraft.sourceProvenance,
    correctionMetadata: metadata,
    syntheticDataOnly: requireLiteral(record.syntheticDataOnly, true, "syntheticDataOnly")
  };
}

export function validateSourceCorrectionAudit(value: unknown): SourceCorrectionAudit {
  assertNoForbiddenSourcePayload(value, "sourceCorrectionAudit");
  const audit = requireRecord(value, "sourceCorrectionAudit");
  requireExactKeys(audit, "sourceCorrectionAudit", [
    "planId",
    "correctedSavedCopyPath",
    "sourceFixtureUnchanged",
    "privateSourcePayloadStored",
    "exactParityClaimMade",
    "visualAuditStatus",
    "visualEvidencePath",
    "routeAuditStatus",
    "roomsMissingDoor",
    "roomsMissingPathNode",
    "unreachableRoomIds",
    "pathSyncStatus",
    "simulationReadyExportStatus",
    "blockingIssues",
    "warningIssues",
    "promotionRecommendation",
    "promotionCandidateStatus",
    "limitations"
  ]);
  return {
    planId: requireString(audit.planId, "planId"),
    correctedSavedCopyPath: requireRelativePath(audit.correctedSavedCopyPath, "correctedSavedCopyPath"),
    sourceFixtureUnchanged: requireLiteral(audit.sourceFixtureUnchanged, true, "sourceFixtureUnchanged"),
    privateSourcePayloadStored: requireLiteral(audit.privateSourcePayloadStored, false, "privateSourcePayloadStored"),
    exactParityClaimMade: requireLiteral(audit.exactParityClaimMade, false, "exactParityClaimMade"),
    visualAuditStatus: requireString(audit.visualAuditStatus, "visualAuditStatus"),
    visualEvidencePath: requireRelativePath(audit.visualEvidencePath, "visualEvidencePath"),
    routeAuditStatus: requireString(audit.routeAuditStatus, "routeAuditStatus"),
    roomsMissingDoor: requireStringArray(audit.roomsMissingDoor, "roomsMissingDoor"),
    roomsMissingPathNode: requireStringArray(audit.roomsMissingPathNode, "roomsMissingPathNode"),
    unreachableRoomIds: requireStringArray(audit.unreachableRoomIds, "unreachableRoomIds"),
    pathSyncStatus: requireString(audit.pathSyncStatus, "pathSyncStatus"),
    simulationReadyExportStatus: requireString(audit.simulationReadyExportStatus, "simulationReadyExportStatus"),
    blockingIssues: requireStringArray(audit.blockingIssues, "blockingIssues"),
    warningIssues: requireStringArray(audit.warningIssues, "warningIssues"),
    promotionRecommendation: requireEnum(
      audit.promotionRecommendation,
      ["not_ready", "ready_for_manual_visual_review", "ready_for_future_promotion_review", "blocked_needs_authoring_fix"] as const,
      "promotionRecommendation"
    ),
    promotionCandidateStatus: requireEnum(
      audit.promotionCandidateStatus,
      PROMOTION_CANDIDATE_STATUSES,
      "promotionCandidateStatus"
    ),
    limitations: requireNonEmptyStringArray(audit.limitations, "limitations")
  };
}

export function validateSourcePlanCorrectionManifest(value: unknown): SourcePlanCorrectionManifest {
  assertNoForbiddenSourcePayload(value, "sourcePlanCorrectionManifest");
  const manifest = requireRecord(value, "sourcePlanCorrectionManifest");
  requireExactKeys(manifest, "sourcePlanCorrectionManifest", [
    "manifestVersion",
    "batch",
    "lastUpdatedIssue",
    "correctionScope",
    "sourcePrivacyStatus",
    "defaultFixtureMutationStatus",
    "planCorrections",
    "visualEvidence",
    "routeAuditStatus",
    "simulationReadyExportStatus",
    "promotionStatus",
    "goNoGoStatus"
  ]);
  const planCorrections = requireArray(manifest.planCorrections, "planCorrections").map(validateManifestEntry);
  if (new Set(planCorrections.map((entry) => entry.planId)).size !== planCorrections.length) {
    throw new Error("planCorrections planId values must be unique");
  }
  for (const entry of planCorrections) {
    if (entry.promotionStatus === "promoted") {
      throw new Error("corrected saved copies must not be promoted in Batch 291-300");
    }
    if (entry.privateSourcePayloadStored !== false) {
      throw new Error(`${entry.planId} stores private source payload`);
    }
  }

  return {
    manifestVersion: requireString(manifest.manifestVersion, "manifestVersion"),
    batch: requireLiteral(manifest.batch, "291-300", "batch"),
    lastUpdatedIssue: requireString(manifest.lastUpdatedIssue, "lastUpdatedIssue"),
    correctionScope: requireString(manifest.correctionScope, "correctionScope"),
    sourcePrivacyStatus: requireString(manifest.sourcePrivacyStatus, "sourcePrivacyStatus"),
    defaultFixtureMutationStatus: requireString(manifest.defaultFixtureMutationStatus, "defaultFixtureMutationStatus"),
    planCorrections,
    visualEvidence: requireStringRecord(manifest.visualEvidence, "visualEvidence"),
    routeAuditStatus: requireStringRecord(manifest.routeAuditStatus, "routeAuditStatus"),
    simulationReadyExportStatus: requireStringRecord(
      manifest.simulationReadyExportStatus,
      "simulationReadyExportStatus"
    ),
    promotionStatus: requirePromotionRecord(manifest.promotionStatus, "promotionStatus"),
    goNoGoStatus: requireString(manifest.goNoGoStatus, "goNoGoStatus")
  };
}

function validateCorrectionMetadata(value: unknown): SourcePlanCorrectionMetadata {
  const metadata = requireRecord(value, "correctionMetadata");
  requireExactKeys(metadata, "correctionMetadata", [
    "correctionIssue",
    "sourceReviewMode",
    "correctedObjectCounts",
    "changedRoomIds",
    "changedDoorIds",
    "addedRoomIds",
    "addedDoorIds",
    "generatedHallwayIds",
    "generatedBorderId",
    "renderedVisualEvidencePath",
    "exactParityClaimMade",
    "limitations"
  ]);
  return {
    correctionIssue: requireString(metadata.correctionIssue, "correctionIssue"),
    sourceReviewMode: requireEnum(metadata.sourceReviewMode, SOURCE_REVIEW_MODES, "sourceReviewMode"),
    correctedObjectCounts: validateObjectCounts(metadata.correctedObjectCounts),
    changedRoomIds: requireStringArray(metadata.changedRoomIds, "changedRoomIds"),
    changedDoorIds: requireStringArray(metadata.changedDoorIds, "changedDoorIds"),
    addedRoomIds: requireStringArray(metadata.addedRoomIds, "addedRoomIds"),
    addedDoorIds: requireStringArray(metadata.addedDoorIds, "addedDoorIds"),
    generatedHallwayIds: requireStringArray(metadata.generatedHallwayIds, "generatedHallwayIds"),
    generatedBorderId:
      metadata.generatedBorderId === null ? null : requireString(metadata.generatedBorderId, "generatedBorderId"),
    renderedVisualEvidencePath: requireRelativePath(metadata.renderedVisualEvidencePath, "renderedVisualEvidencePath"),
    exactParityClaimMade: requireLiteral(metadata.exactParityClaimMade, false, "exactParityClaimMade"),
    limitations: requireNonEmptyStringArray(metadata.limitations, "limitations")
  };
}

function validateObjectCounts(value: unknown): SourcePlanCorrectionMetadata["correctedObjectCounts"] {
  const counts = requireRecord(value, "correctedObjectCounts");
  requireExactKeys(counts, "correctedObjectCounts", ["rooms", "doors", "hallways", "stations", "zones"]);
  return {
    rooms: requireNonNegativeInteger(counts.rooms, "correctedObjectCounts.rooms"),
    doors: requireNonNegativeInteger(counts.doors, "correctedObjectCounts.doors"),
    hallways: requireNonNegativeInteger(counts.hallways, "correctedObjectCounts.hallways"),
    stations: requireNonNegativeInteger(counts.stations, "correctedObjectCounts.stations"),
    zones: requireNonNegativeInteger(counts.zones, "correctedObjectCounts.zones")
  };
}

function validateManifestEntry(value: unknown, index: number): SourcePlanCorrectionManifestEntry {
  const entry = requireRecord(value, `planCorrections[${index}]`);
  requireExactKeys(entry, `planCorrections[${index}]`, [
    "planId",
    "sourceDefaultPlanId",
    "correctedSavedCopyPath",
    "correctionNotesPath",
    "correctionAuditPath",
    "visualEvidencePath",
    "correctionStage",
    "privateSourcePayloadStored",
    "sourceFixtureUnchanged",
    "routeAuditStatus",
    "simulationReadyExportStatus",
    "promotionStatus",
    "promotionCandidateStatus",
    "limitations",
    "goNoGo"
  ]);
  return {
    planId: requireString(entry.planId, `planCorrections[${index}].planId`),
    sourceDefaultPlanId: requireString(entry.sourceDefaultPlanId, `planCorrections[${index}].sourceDefaultPlanId`),
    correctedSavedCopyPath: requireRelativePath(
      entry.correctedSavedCopyPath,
      `planCorrections[${index}].correctedSavedCopyPath`
    ),
    correctionNotesPath: requireRelativePath(entry.correctionNotesPath, `planCorrections[${index}].correctionNotesPath`),
    correctionAuditPath: requireRelativePath(entry.correctionAuditPath, `planCorrections[${index}].correctionAuditPath`),
    visualEvidencePath: requireRelativePath(entry.visualEvidencePath, `planCorrections[${index}].visualEvidencePath`),
    correctionStage: requireEnum(entry.correctionStage, SOURCE_CORRECTION_STAGES, `planCorrections[${index}].correctionStage`),
    privateSourcePayloadStored: requireLiteral(
      entry.privateSourcePayloadStored,
      false,
      `planCorrections[${index}].privateSourcePayloadStored`
    ),
    sourceFixtureUnchanged: requireLiteral(
      entry.sourceFixtureUnchanged,
      true,
      `planCorrections[${index}].sourceFixtureUnchanged`
    ),
    routeAuditStatus: requireString(entry.routeAuditStatus, `planCorrections[${index}].routeAuditStatus`),
    simulationReadyExportStatus: requireString(
      entry.simulationReadyExportStatus,
      `planCorrections[${index}].simulationReadyExportStatus`
    ),
    promotionStatus: requireEnum(entry.promotionStatus, PROMOTION_STATUSES, `planCorrections[${index}].promotionStatus`),
    promotionCandidateStatus: requireEnum(
      entry.promotionCandidateStatus,
      PROMOTION_CANDIDATE_STATUSES,
      `planCorrections[${index}].promotionCandidateStatus`
    ),
    limitations: requireNonEmptyStringArray(entry.limitations, `planCorrections[${index}].limitations`),
    goNoGo: requireString(entry.goNoGo, `planCorrections[${index}].goNoGo`)
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
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
  const text = requireString(value, label);
  if (/^[a-zA-Z]:[\\/]/.test(text) || text.startsWith("/") || text.includes("..")) {
    throw new Error(`${label} must be a repo-relative path`);
  }
  return text.replaceAll("\\", "/");
}

function requireStringArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((entry, index) => requireString(entry, `${label}[${index}]`));
}

function requireNonEmptyStringArray(value: unknown, label: string): string[] {
  const entries = requireStringArray(value, label);
  if (entries.length === 0) {
    throw new Error(`${label} must contain at least one entry`);
  }
  return entries;
}

function requireStringRecord(value: unknown, label: string): Record<string, string> {
  const record = requireRecord(value, label);
  const output: Record<string, string> = {};
  for (const [key, child] of Object.entries(record)) {
    output[key] = requireString(child, `${label}.${key}`);
  }
  return output;
}

function requirePromotionRecord(value: unknown, label: string): Record<string, PromotionStatus> {
  const record = requireRecord(value, label);
  const output: Record<string, PromotionStatus> = {};
  for (const [key, child] of Object.entries(record)) {
    output[key] = requireEnum(child, PROMOTION_STATUSES, `${label}.${key}`);
  }
  return output;
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value as number;
}

function requireLiteral<T extends string | boolean>(
  value: unknown,
  expected: T,
  label: string
): T {
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
