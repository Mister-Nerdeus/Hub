import type { FloorplanViewMode } from "./viewMode";
import { createOperationalDemoDeveloperSnapshot, createOperationalDemoOperatorSnapshot } from "./operationalDemoSnapshotAdapter";

export type DeveloperEvidenceViewModel = {
  evidenceId: "operational-demo-developer-evidence-v1";
  mode: FloorplanViewMode;
  operatorSummary: {
    manualReviewRequired: true;
    promotionBlocked: true;
    rawProofDetailsVisible: boolean;
  };
  reviewerArtifacts: { planId: string; label: string }[];
  developerEvidence: {
    planId: string;
    reviewPacketPath: string;
    reviewRecordTemplatePath: string;
    renderedEvidencePath: string;
    renderedEvidenceHash: string;
    renderedEvidenceMetadataHash: string;
  }[];
};

export function createDeveloperEvidenceViewModel(mode: FloorplanViewMode): DeveloperEvidenceViewModel {
  const operatorSnapshot = createOperationalDemoOperatorSnapshot();
  const developerSnapshot = createOperationalDemoDeveloperSnapshot();
  return {
    evidenceId: "operational-demo-developer-evidence-v1",
    mode,
    operatorSummary: {
      manualReviewRequired: true,
      promotionBlocked: true,
      rawProofDetailsVisible: mode === "developer"
    },
    reviewerArtifacts: operatorSnapshot.operatorPlans.map((plan) => ({
      planId: plan.planId,
      label: plan.safeRenderedEvidenceReference.label
    })),
    developerEvidence: mode === "developer" ? developerSnapshot.developerEvidence ?? [] : []
  };
}
