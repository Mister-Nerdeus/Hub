import type {
  BundleAuditStep,
  BundleAuditTrailContract,
  ExportBundleIntegrityContract,
  ReportExportBundleContract,
  ReportExportBundleImportSummary
} from "../contracts.js";
import { validateBundleAuditTrailContract } from "../contracts.js";
import {
  buildExportBundleIntegrity,
  EXPORT_BUNDLE_INTEGRITY_LIMITATIONS,
  hashCanonicalJson
} from "./exportBundleIntegrity.js";
import {
  parseReportExportBundleJson,
  summarizeReportExportBundle
} from "./parseReportExportBundle.js";

export type BundleAuditResult = {
  ok: boolean;
  bundle?: ReportExportBundleContract;
  integrity?: ExportBundleIntegrityContract;
  auditTrail: BundleAuditTrailContract;
  summary: ReportExportBundleImportSummary;
};

export const BUNDLE_AUDIT_CREATED_AT = "2026-05-22T00:00:00Z";

export const BUNDLE_AUDIT_LIMITATIONS = [
  "Local proof only for deterministic export bundle audit review.",
  "No legal/compliance claim is made.",
  "No tamper-proof claim is made.",
  "No clinical safety claim is made.",
  "No persistence, API endpoint, upload, download, signature, encryption, optimizer, or recommendation behavior is included."
];

export function buildBundleAuditFromJson(
  jsonText: string,
  createdAt = BUNDLE_AUDIT_CREATED_AT
): BundleAuditResult {
  const parseStep = createStep("parse-json", "Parse JSON text", "not_run", "Not run.");
  const validateStep = createStep(
    "validate-bundle",
    "Validate export bundle contract",
    "not_run",
    "Not run."
  );
  const integrityStep = createStep(
    "compute-integrity",
    "Compute deterministic integrity hash",
    "not_run",
    "Not run."
  );
  const summaryStep = createStep(
    "summarize-bundle",
    "Summarize export bundle",
    "not_run",
    "Not run."
  );
  const steps = [parseStep, validateStep, integrityStep, summaryStep];

  try {
    JSON.parse(jsonText);
    parseStep.status = "passed";
    parseStep.message = "JSON text parsed locally.";
  } catch (error) {
    parseStep.status = "failed";
    parseStep.message = `JSON parse failed locally: ${errorMessage(error)}`;
    const auditTrail = buildAuditTrail({
      auditTrailId: "bundle-audit-trail-unavailable",
      exportId: "unavailable",
      createdAt,
      integrity: buildUnavailableIntegrity(createdAt),
      steps
    });
    return {
      ok: false,
      auditTrail,
      summary: buildUnavailableSummary()
    };
  }

  let bundle: ReportExportBundleContract;
  try {
    bundle = parseReportExportBundleJson(jsonText);
    validateStep.status = "passed";
    validateStep.message = "Report export bundle contract validated locally.";
  } catch (error) {
    validateStep.status = "failed";
    validateStep.message = `Report export bundle validation failed locally: ${errorMessage(error)}`;
    const auditTrail = buildAuditTrail({
      auditTrailId: "bundle-audit-trail-unavailable",
      exportId: "unavailable",
      createdAt,
      integrity: buildUnavailableIntegrity(createdAt),
      steps
    });
    return {
      ok: false,
      auditTrail,
      summary: buildUnavailableSummary()
    };
  }

  const integrity = buildExportBundleIntegrity(bundle, createdAt);
  integrityStep.status = "passed";
  integrityStep.message = "Deterministic sha256 integrity hash computed locally.";

  const summary = summarizeReportExportBundle(bundle);
  summaryStep.status = "passed";
  summaryStep.message = "Export bundle summary built locally.";

  const auditTrail = buildAuditTrail({
    auditTrailId: `${bundle.exportId}-audit-trail`,
    exportId: bundle.exportId,
    createdAt,
    integrity,
    steps
  });

  return {
    ok: true,
    bundle,
    integrity,
    auditTrail,
    summary
  };
}

function buildAuditTrail(input: {
  auditTrailId: string;
  exportId: string;
  createdAt: string;
  integrity: ExportBundleIntegrityContract;
  steps: BundleAuditStep[];
}): BundleAuditTrailContract {
  return validateBundleAuditTrailContract({
    schemaVersion: "1.0.0",
    auditTrailId: input.auditTrailId,
    exportId: input.exportId,
    createdAt: input.createdAt,
    validationStatus: input.steps.some((step) => step.status === "failed") ? "failed" : "passed",
    integrity: input.integrity,
    reviewSteps: input.steps,
    warnings: [],
    limitations: [...BUNDLE_AUDIT_LIMITATIONS]
  });
}

function buildUnavailableIntegrity(createdAt: string): ExportBundleIntegrityContract {
  return {
    schemaVersion: "1.0.0",
    integrityId: "unavailable-integrity",
    exportId: "unavailable",
    createdAt,
    algorithm: "sha256",
    canonicalJsonHash: hashCanonicalJson(""),
    canonicalJsonLength: 0,
    limitations: [...EXPORT_BUNDLE_INTEGRITY_LIMITATIONS]
  };
}

function buildUnavailableSummary(): ReportExportBundleImportSummary {
  return {
    exportId: "unavailable",
    reportCount: 0,
    hasComparison: false,
    comparisonId: null,
    scenarioIds: [],
    reportIds: [],
    limitations: [...BUNDLE_AUDIT_LIMITATIONS]
  };
}

function createStep(
  id: string,
  label: string,
  status: BundleAuditStep["status"],
  message: string
): BundleAuditStep {
  return {
    id,
    label,
    status,
    message
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
