import { planBuilderReviewFlowSnapshot } from "./generated/planBuilderReviewFlowSnapshot";
import { createOperationalDemoOperatorSnapshot } from "./operationalDemoSnapshotAdapter";
import type { OperationalDemoOperatorPlan } from "@nerdeus/shared";
import type { PlanReviewFlowPlanId } from "./planBuilderReviewFlowTypes";

export type RenderedPlanPreviewPlanViewModel = {
  planId: PlanReviewFlowPlanId;
  displayName: string;
  safeRenderedEvidenceLabel: string;
  imageSrc: string;
  evidenceVerificationLabel: "Evidence verified";
  metadataVerificationLabel: "Metadata verified";
  canvasSummary: string;
  objectCountSummary: string;
  drawCountSummary: string;
  limitationSummary: string;
  routeStatusText: "Route ready" | "Route blocked";
  routeExportStatusText: "Route export ready" | "Route export blocked";
  manualReviewRequired: true;
  promotionBlocked: true;
  limitations: readonly string[];
  fallbackText: string;
};

export type RenderedPlanPreviewViewModel = {
  previewId: "plan-builder-rendered-preview-v1";
  plans: RenderedPlanPreviewPlanViewModel[];
  manualReviewRequiredNotice: string;
  promotionBlockedNotice: string;
};

export type RenderedPlanPreviewSourcePlan = {
  planId: PlanReviewFlowPlanId;
  displayName: string;
  safeRenderedEvidenceLabel: string;
  renderedEvidencePath: string;
  renderedEvidenceMetadataPath: string;
  renderedEvidenceHash: string;
  renderedEvidenceMetadataHash: string;
  routeReadinessStatus: "ready" | "blocked";
  simulationReadyExportStatus: "simulation_ready" | "blocked";
  limitations: readonly string[];
  renderedEvidenceMetadataSummary: {
    widthPx: number;
    heightPx: number;
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
    exactParityClaimMade: boolean;
    privateSourceScreenshotStored: boolean;
  };
};

export function createRenderedPlanPreviewViewModel(): RenderedPlanPreviewViewModel {
  const operatorSnapshot = createOperationalDemoOperatorSnapshot();
  const sourcePlansById = new Map(
    planBuilderReviewFlowSnapshot.plans.map((plan) => [plan.planId, plan])
  );

  return {
    previewId: "plan-builder-rendered-preview-v1",
    plans: operatorSnapshot.operatorPlans.map((operatorPlan) => {
      const sourcePlan = sourcePlansById.get(operatorPlan.planId);
      if (sourcePlan == null) {
        throw new Error(`missing rendered preview source for ${operatorPlan.planId}`);
      }
      return createRenderedPlanPreviewPlanViewModel(sourcePlan, operatorPlan);
    }),
    manualReviewRequiredNotice: "Manual review is required before promotion.",
    promotionBlockedNotice: "Promotion is blocked."
  };
}

export function createRenderedPlanPreviewPlanViewModel(
  plan: RenderedPlanPreviewSourcePlan,
  safeOperatorPlan?: OperationalDemoOperatorPlan
): RenderedPlanPreviewPlanViewModel {
  if (!isSafeRenderedEvidenceReference(plan.renderedEvidencePath)) {
    throw new Error(`unsafe rendered evidence reference for ${plan.planId}`);
  }
  if (!isSafeRenderedEvidenceMetadataReference(plan.renderedEvidenceMetadataPath)) {
    throw new Error(`unsafe rendered evidence metadata reference for ${plan.planId}`);
  }
  if (plan.renderedEvidenceMetadataSummary.exactParityClaimMade) {
    throw new Error(`rendered evidence must not claim exact source-document parity for ${plan.planId}`);
  }
  if (plan.renderedEvidenceMetadataSummary.privateSourceScreenshotStored) {
    throw new Error(`rendered evidence must not store private source screenshots for ${plan.planId}`);
  }

  const objectCounts = plan.renderedEvidenceMetadataSummary.objectCounts;
  const drawCounts = plan.renderedEvidenceMetadataSummary.drawCounts;

  return {
    planId: plan.planId,
    displayName: safeOperatorPlan?.displayName ?? plan.displayName,
    safeRenderedEvidenceLabel: safeOperatorPlan?.safeRenderedEvidenceReference.label ?? plan.safeRenderedEvidenceLabel,
    imageSrc: toPublicRenderedEvidenceUrl(
      safeOperatorPlan?.safeRenderedEvidenceReference.publicImageFileName ?? plan.renderedEvidencePath
    ),
    evidenceVerificationLabel: "Evidence verified",
    metadataVerificationLabel: "Metadata verified",
    canvasSummary: `${plan.renderedEvidenceMetadataSummary.widthPx} x ${plan.renderedEvidenceMetadataSummary.heightPx}px`,
    objectCountSummary: safeOperatorPlan?.safeRenderedEvidenceReference.objectCountSummary ?? [
      `${objectCounts.rooms} rooms`,
      `${objectCounts.hallways} hallways`,
      `${objectCounts.doors} doors`,
      `${objectCounts.nurseStations} stations`,
      `${objectCounts.zones} zones`,
      `${objectCounts.pathNodes} path nodes`,
      `${objectCounts.pathEdges} path edges`
    ].join(", "),
    drawCountSummary: safeOperatorPlan?.safeRenderedEvidenceReference.drawCountSummary ?? [
      `${drawCounts.roomsDrawn} rooms`,
      `${drawCounts.hallwaysDrawn} hallways`,
      `${drawCounts.doorsDrawn} doors`,
      `${drawCounts.stationsDrawn} stations`,
      `${drawCounts.zonesDrawn} zones`,
      `${drawCounts.pathNodesDrawn} path nodes`,
      `${drawCounts.pathEdgesDrawn} path edges`,
      `${drawCounts.labelsDrawn} labels`
    ].join(", "),
    limitationSummary: "Operational approximation only; not exact CAD/source parity and not clinical or staffing compliance.",
    routeStatusText: plan.routeReadinessStatus === "ready" ? "Route ready" : "Route blocked",
    routeExportStatusText: plan.simulationReadyExportStatus === "simulation_ready" ? "Route export ready" : "Route export blocked",
    manualReviewRequired: true,
    promotionBlocked: true,
    limitations: plan.limitations,
    fallbackText: "Rendered evidence image is unavailable in this app context; use the safe repo-relative reference."
  };
}

export function isSafeRenderedEvidenceReference(path: string): boolean {
  return isSafeRepoRelativePath(path) && /^docs\/verification\/rendered-plans\/plan-[2-5]-rendered-review\.png$/u.test(path);
}

export function isSafeRenderedEvidenceMetadataReference(path: string): boolean {
  return (
    isSafeRepoRelativePath(path) &&
    /^docs\/verification\/rendered-plans\/plan-[2-5]-rendered-review\.metadata\.json$/u.test(path)
  );
}

function isSafeRepoRelativePath(path: string): boolean {
  const lowered = path.toLowerCase();
  const forbiddenDocExtension = [".", "docx"].join("");
  return (
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.includes("..") &&
    !/^[a-z]:/iu.test(path) &&
    !lowered.includes("private") &&
    !lowered.includes("source-artifacts") &&
    !lowered.endsWith(forbiddenDocExtension)
  );
}

function toPublicRenderedEvidenceUrl(path: string): string {
  const fileName = path.split("/").at(-1);
  if (fileName == null || fileName.length === 0) {
    throw new Error(`unsafe rendered evidence reference: ${path}`);
  }
  return `/plan-builder-review-flow/rendered-plans/${fileName}`;
}
