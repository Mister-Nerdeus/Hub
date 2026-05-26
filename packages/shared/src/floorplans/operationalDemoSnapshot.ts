export const OPERATIONAL_DEMO_PRODUCT_DISPLAY_NAME = "ER Pod Shift Simulator" as const;

export type OperationalDemoPlanId = "plan-2" | "plan-3" | "plan-4" | "plan-5";
export type OperationalDemoRouteStatus = "ready" | "blocked";
export type OperationalDemoSimulationExportStatus = "simulation_ready" | "blocked";
export type OperationalDemoManualReviewStatus = "manual_review_required";
export type OperationalDemoPromotionStatus = "blocked";

export type OperationalDemoSourcePlan = {
  planId: OperationalDemoPlanId;
  displayName: string;
  safeReviewPacketLabel: string;
  safeReviewTemplateLabel: string;
  safeRenderedEvidenceLabel: string;
  routeReadinessStatus: OperationalDemoRouteStatus;
  simulationReadyExportStatus: OperationalDemoSimulationExportStatus;
  manualReviewStatus: OperationalDemoManualReviewStatus;
  promotionStatus: OperationalDemoPromotionStatus;
  reviewerDecisionSource: "none";
  canPromote: false;
  codexClaimedApproval: false;
  sampleRecordCountsAsApproval: false;
  exactParityClaimMade: false;
  privateSourcePayloadStored: false;
  renderedEvidenceMetadataSummary: {
    objectCounts: {
      rooms: number;
      hallways: number;
      doors: number;
      nurseStations: number;
      zones: number;
      pathNodes: number;
      pathEdges: number;
    };
    drawCounts: {
      roomsDrawn: number;
      hallwaysDrawn: number;
      doorsDrawn: number;
      stationsDrawn: number;
      zonesDrawn: number;
      pathNodesDrawn: number;
      pathEdgesDrawn: number;
      labelsDrawn: number;
    };
    exactParityClaimMade: false;
    privateSourceScreenshotStored: false;
  };
  reviewPacketPath?: string;
  reviewRecordTemplatePath?: string;
  renderedEvidencePath?: string;
  renderedEvidenceHash?: string;
  renderedEvidenceMetadataHash?: string;
};

export type OperationalDemoSnapshotOptions = {
  productDisplayName?: typeof OPERATIONAL_DEMO_PRODUCT_DISPLAY_NAME;
  plans: readonly OperationalDemoSourcePlan[];
  includeDeveloperEvidence?: boolean;
};

export type OperationalDemoSnapshot = {
  snapshotVersion: "1.0.0";
  productDisplayName: typeof OPERATIONAL_DEMO_PRODUCT_DISPLAY_NAME;
  manualReviewRequired: true;
  promotionStatus: OperationalDemoPromotionStatus;
  defaultFixtureMutationStatus: "unchanged";
  operatorPlans: OperationalDemoOperatorPlan[];
  developerEvidence?: OperationalDemoDeveloperEvidence[];
};

export type OperationalDemoOperatorPlan = {
  planId: OperationalDemoPlanId;
  displayName: string;
  routeReadinessLabel: "Route ready" | "Route blocked";
  simulationExportLabel: "Simulation-ready export" | "Simulation export blocked";
  manualReviewStatusLabel: "Manual review required";
  promotionStatusLabel: "Promotion blocked";
  safeRenderedEvidenceReference: {
    label: string;
    publicImageFileName: string;
    objectCountSummary: string;
    drawCountSummary: string;
  };
  safeReviewPacketReference: {
    label: string;
    actionLabel: "Open review packet";
  };
  safeReviewTemplateReference: {
    label: string;
    actionLabel: "Open review template";
  };
  reviewScope: {
    mayReview: readonly string[];
    mayNotReview: readonly string[];
  };
};

export type OperationalDemoDeveloperEvidence = {
  planId: OperationalDemoPlanId;
  reviewPacketPath: string;
  reviewRecordTemplatePath: string;
  renderedEvidencePath: string;
  renderedEvidenceHash: string;
  renderedEvidenceMetadataHash: string;
};

const PLAN_IDS = new Set<OperationalDemoPlanId>(["plan-2", "plan-3", "plan-4", "plan-5"]);

export function buildOperationalDemoSnapshot(
  options: OperationalDemoSnapshotOptions
): OperationalDemoSnapshot {
  const productDisplayName = options.productDisplayName ?? OPERATIONAL_DEMO_PRODUCT_DISPLAY_NAME;
  if (productDisplayName !== OPERATIONAL_DEMO_PRODUCT_DISPLAY_NAME) {
    throw new Error("productDisplayName must be ER Pod Shift Simulator");
  }

  const operatorPlans = options.plans.map(buildOperatorPlan);
  const snapshot: OperationalDemoSnapshot = {
    snapshotVersion: "1.0.0",
    productDisplayName,
    manualReviewRequired: true,
    promotionStatus: "blocked",
    defaultFixtureMutationStatus: "unchanged",
    operatorPlans
  };

  if (options.includeDeveloperEvidence === true) {
    snapshot.developerEvidence = options.plans.map(buildDeveloperEvidence);
  }

  assertNoOperatorLeakage(snapshot);
  return snapshot;
}

function buildOperatorPlan(plan: OperationalDemoSourcePlan): OperationalDemoOperatorPlan {
  validatePlanBoundary(plan);
  const objectCounts = plan.renderedEvidenceMetadataSummary.objectCounts;
  const drawCounts = plan.renderedEvidenceMetadataSummary.drawCounts;
  return {
    planId: plan.planId,
    displayName: plan.displayName,
    routeReadinessLabel: plan.routeReadinessStatus === "ready" ? "Route ready" : "Route blocked",
    simulationExportLabel: plan.simulationReadyExportStatus === "simulation_ready"
      ? "Simulation-ready export"
      : "Simulation export blocked",
    manualReviewStatusLabel: "Manual review required",
    promotionStatusLabel: "Promotion blocked",
    safeRenderedEvidenceReference: {
      label: plan.safeRenderedEvidenceLabel,
      publicImageFileName: `${plan.planId}-rendered-review.png`,
      objectCountSummary: [
        `${objectCounts.rooms} rooms`,
        `${objectCounts.hallways} halls`,
        `${objectCounts.doors} doors`,
        `${objectCounts.nurseStations} stations`,
        `${objectCounts.zones} zones`
      ].join(", "),
      drawCountSummary: [
        `${drawCounts.roomsDrawn} rooms drawn`,
        `${drawCounts.hallwaysDrawn} halls drawn`,
        `${drawCounts.doorsDrawn} doors drawn`,
        `${drawCounts.labelsDrawn} labels drawn`
      ].join(", ")
    },
    safeReviewPacketReference: {
      label: plan.safeReviewPacketLabel,
      actionLabel: "Open review packet"
    },
    safeReviewTemplateReference: {
      label: plan.safeReviewTemplateLabel,
      actionLabel: "Open review template"
    },
    reviewScope: {
      mayReview: [
        "Operational layout plausibility",
        "Rendered preview readability",
        "Route/export readiness evidence"
      ],
      mayNotReview: [
        "Clinical safety",
        "Staffing compliance",
        "Default fixture promotion",
        "Exact source-document parity"
      ]
    }
  };
}

function buildDeveloperEvidence(plan: OperationalDemoSourcePlan): OperationalDemoDeveloperEvidence {
  validatePlanBoundary(plan);
  return {
    planId: plan.planId,
    reviewPacketPath: requireSafeEvidencePath(plan.reviewPacketPath, "reviewPacketPath"),
    reviewRecordTemplatePath: requireSafeEvidencePath(plan.reviewRecordTemplatePath, "reviewRecordTemplatePath"),
    renderedEvidencePath: requireSafeEvidencePath(plan.renderedEvidencePath, "renderedEvidencePath"),
    renderedEvidenceHash: requireHash(plan.renderedEvidenceHash, "renderedEvidenceHash"),
    renderedEvidenceMetadataHash: requireHash(plan.renderedEvidenceMetadataHash, "renderedEvidenceMetadataHash")
  };
}

function validatePlanBoundary(plan: OperationalDemoSourcePlan): void {
  if (!PLAN_IDS.has(plan.planId)) {
    throw new Error(`unsupported operational demo plan: ${plan.planId}`);
  }
  if (
    plan.manualReviewStatus !== "manual_review_required" ||
    plan.promotionStatus !== "blocked" ||
    plan.reviewerDecisionSource !== "none" ||
    plan.canPromote !== false ||
    plan.codexClaimedApproval !== false ||
    plan.sampleRecordCountsAsApproval !== false ||
    plan.exactParityClaimMade !== false ||
    plan.privateSourcePayloadStored !== false
  ) {
    throw new Error(`${plan.planId} violates manual review or promotion boundaries`);
  }
  if (
    plan.renderedEvidenceMetadataSummary.exactParityClaimMade !== false ||
    plan.renderedEvidenceMetadataSummary.privateSourceScreenshotStored !== false
  ) {
    throw new Error(`${plan.planId} rendered evidence violates preview boundaries`);
  }
}

function assertNoOperatorLeakage(snapshot: OperationalDemoSnapshot): void {
  const operatorPayload = JSON.stringify(snapshot.operatorPlans);
  const forbidden = [
    /manual_review_required/u,
    /simulation_ready/u,
    /docs\/verification/u,
    /docs\/manual-review/u,
    /packages\/shared/u,
    /\.docx\b/iu,
    /[A-Za-z]:[\\/]/u,
    /\b[A-Fa-f0-9]{64}\b/u,
    /\bapproved\b/iu,
    /\bpromotion complete\b/iu
  ];
  for (const pattern of forbidden) {
    if (pattern.test(operatorPayload)) {
      throw new Error(`operator snapshot contains forbidden proof detail: ${pattern}`);
    }
  }
}

function requireSafeEvidencePath(value: string | undefined, label: string): string {
  if (value == null || value.length === 0) {
    throw new Error(`${label} is required for developer evidence`);
  }
  const lower = value.toLowerCase();
  if (
    value.startsWith("/") ||
    value.includes("\\") ||
    value.includes("..") ||
    /^[a-z]:/iu.test(value) ||
    lower.includes("private") ||
    lower.endsWith(".docx")
  ) {
    throw new Error(`${label} is not a safe repo-relative evidence path`);
  }
  return value;
}

function requireHash(value: string | undefined, label: string): string {
  if (value == null || !/^[a-f0-9]{64}$/u.test(value)) {
    throw new Error(`${label} must be a sha256 hash`);
  }
  return value;
}
