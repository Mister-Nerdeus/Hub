import {
  parseReportExportBundleJson,
  summarizeReportExportBundle,
  type ReportExportBundleImportSummary
} from "@nerdeus/shared";

import {
  invalidPhase8ExportBundleJsonText,
  phase8ExportBundleJsonText
} from "../../fixtures/phase8ExportBundleReview";

export type ExportBundleReviewResult =
  | {
      ok: true;
      summary: ReportExportBundleImportSummary;
    }
  | {
      ok: false;
      error: string;
    };

export type ExportBundleReviewViewModel = {
  label: string;
  operationalOnlyLabel: string;
  validReview: ExportBundleReviewResult;
  invalidReview: ExportBundleReviewResult;
};

export type ExportBundleReviewInput = {
  validJsonText?: string;
  invalidJsonText?: string;
};

export function createExportBundleReviewViewModel(
  input: ExportBundleReviewInput = {}
): ExportBundleReviewViewModel {
  return {
    label: "API-free export bundle review proof",
    operationalOnlyLabel: "Operational-only local export bundle review",
    validReview: reviewBundleJson(input.validJsonText ?? phase8ExportBundleJsonText),
    invalidReview: reviewBundleJson(input.invalidJsonText ?? invalidPhase8ExportBundleJsonText)
  };
}

function reviewBundleJson(jsonText: string): ExportBundleReviewResult {
  try {
    const bundle = parseReportExportBundleJson(jsonText);
    return {
      ok: true,
      summary: summarizeReportExportBundle(bundle)
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
