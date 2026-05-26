export type DefaultFixturePromotionReadiness = {
  planId: string;
  currentDefaultFixturePath: string;
  correctedSavedCopyPath: string;
  correctedSavedCopyHash: string;
  renderedEvidencePresent: boolean;
  machineVisualSanityPassed: boolean;
  manualVisualReviewApproved: boolean;
  routeAuditPassedOrAccepted: boolean;
  simulationReadyExportAccepted: boolean;
  privateSourceBoundaryPassed: boolean;
  noPhiPassed: boolean;
  rollbackPlanPath: string;
  rollbackPlanHash: string;
  promotionAllowed: boolean;
  blockingReasons: string[];
};

export function validateDefaultFixturePromotionReadiness(value: unknown): DefaultFixturePromotionReadiness {
  const readiness = requireRecord(value, "defaultFixturePromotionReadiness");
  requireExactKeys(readiness, "defaultFixturePromotionReadiness", [
    "planId",
    "currentDefaultFixturePath",
    "correctedSavedCopyPath",
    "correctedSavedCopyHash",
    "renderedEvidencePresent",
    "machineVisualSanityPassed",
    "manualVisualReviewApproved",
    "routeAuditPassedOrAccepted",
    "simulationReadyExportAccepted",
    "privateSourceBoundaryPassed",
    "noPhiPassed",
    "rollbackPlanPath",
    "rollbackPlanHash",
    "promotionAllowed",
    "blockingReasons"
  ]);
  const result = {
    planId: requireString(readiness.planId, "planId"),
    currentDefaultFixturePath: requireRelativePath(readiness.currentDefaultFixturePath, "currentDefaultFixturePath"),
    correctedSavedCopyPath: requireRelativePath(readiness.correctedSavedCopyPath, "correctedSavedCopyPath"),
    correctedSavedCopyHash: requireSha256(readiness.correctedSavedCopyHash, "correctedSavedCopyHash"),
    renderedEvidencePresent: requireBoolean(readiness.renderedEvidencePresent, "renderedEvidencePresent"),
    machineVisualSanityPassed: requireBoolean(readiness.machineVisualSanityPassed, "machineVisualSanityPassed"),
    manualVisualReviewApproved: requireBoolean(readiness.manualVisualReviewApproved, "manualVisualReviewApproved"),
    routeAuditPassedOrAccepted: requireBoolean(readiness.routeAuditPassedOrAccepted, "routeAuditPassedOrAccepted"),
    simulationReadyExportAccepted: requireBoolean(readiness.simulationReadyExportAccepted, "simulationReadyExportAccepted"),
    privateSourceBoundaryPassed: requireBoolean(readiness.privateSourceBoundaryPassed, "privateSourceBoundaryPassed"),
    noPhiPassed: requireBoolean(readiness.noPhiPassed, "noPhiPassed"),
    rollbackPlanPath: requireRelativePath(readiness.rollbackPlanPath, "rollbackPlanPath"),
    rollbackPlanHash: requireSha256(readiness.rollbackPlanHash, "rollbackPlanHash"),
    promotionAllowed: requireBoolean(readiness.promotionAllowed, "promotionAllowed"),
    blockingReasons: requireStringArray(readiness.blockingReasons, "blockingReasons")
  };
  const requiredConditions = [
    ["rendered evidence", result.renderedEvidencePresent],
    ["machine visual sanity", result.machineVisualSanityPassed],
    ["manual visual review approval", result.manualVisualReviewApproved],
    ["route audit pass or accepted warning", result.routeAuditPassedOrAccepted],
    ["simulation-ready export acceptance", result.simulationReadyExportAccepted],
    ["private-source boundary pass", result.privateSourceBoundaryPassed],
    ["no-PHI pass", result.noPhiPassed],
    ["rollback plan", result.rollbackPlanPath.length > 0 && result.rollbackPlanHash.length === 64]
  ] as const;
  const missing = requiredConditions.filter(([, passed]) => !passed).map(([label]) => label);
  if (result.promotionAllowed && missing.length > 0) {
    throw new Error(`promotionAllowed requires ${missing.join(", ")}`);
  }
  if (!result.promotionAllowed && result.blockingReasons.length === 0) {
    throw new Error("blocked promotion readiness must list blockingReasons");
  }
  return result;
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

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value.map((entry, index) => requireString(entry, `${label}[${index}]`));
}
