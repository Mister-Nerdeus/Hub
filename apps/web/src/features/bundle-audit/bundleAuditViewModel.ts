import {
  buildBundleAuditFromJson,
  type BundleAuditResult,
  type BundleAuditStep
} from "@nerdeus/shared";

import {
  phase9BundleAuditInvalidJsonText,
  phase9BundleAuditValidJsonText
} from "../../fixtures/phase9BundleAuditProof";

export type BundleAuditStepViewModel = {
  id: string;
  label: string;
  status: BundleAuditStep["status"];
  message: string;
};

export type BundleAuditResultViewModel = {
  ok: boolean;
  statusLabel: string;
  exportId: string;
  validationStatus: string;
  hash: string;
  reportCount: number;
  hasComparison: boolean;
  comparisonId: string;
  scenarioIds: string[];
  reportIds: string[];
  reviewSteps: BundleAuditStepViewModel[];
  limitations: string[];
  failureMessage: string;
};

export type BundleAuditProofViewModel = {
  label: string;
  localProofLabel: string;
  validAudit: BundleAuditResultViewModel;
  invalidAudit: BundleAuditResultViewModel;
};

export type BundleAuditProofInput = {
  validJsonText?: string;
  invalidJsonText?: string;
};

export function createBundleAuditProofViewModel(
  input: BundleAuditProofInput = {}
): BundleAuditProofViewModel {
  return {
    label: "API-free bundle audit proof",
    localProofLabel: "Local proof only",
    validAudit: toViewModel(
      buildBundleAuditFromJson(input.validJsonText ?? phase9BundleAuditValidJsonText)
    ),
    invalidAudit: toViewModel(
      buildBundleAuditFromJson(input.invalidJsonText ?? phase9BundleAuditInvalidJsonText)
    )
  };
}

function toViewModel(result: BundleAuditResult): BundleAuditResultViewModel {
  return {
    ok: result.ok,
    statusLabel: result.ok ? "Audit passed" : "Audit failed",
    exportId: result.summary.exportId,
    validationStatus: result.auditTrail.validationStatus,
    hash: result.integrity?.canonicalJsonHash ?? result.auditTrail.integrity.canonicalJsonHash,
    reportCount: result.summary.reportCount,
    hasComparison: result.summary.hasComparison,
    comparisonId: result.summary.comparisonId ?? "None",
    scenarioIds: result.summary.scenarioIds,
    reportIds: result.summary.reportIds,
    reviewSteps: result.auditTrail.reviewSteps.map((step) => ({ ...step })),
    limitations: result.auditTrail.limitations,
    failureMessage:
      result.auditTrail.reviewSteps.find((step) => step.status === "failed")?.message ?? "None"
  };
}
