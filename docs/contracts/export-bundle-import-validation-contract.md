# Export Bundle Import Validation Contract

Phase 8 adds local JSON parsing and review utilities for operational report export bundles.

## API

`parseReportExportBundleJson(jsonText: string): ReportExportBundleContract`

- Parses JSON text supplied by the caller.
- Throws a clear `Invalid report export bundle JSON` error for malformed JSON.
- Validates the parsed value with `validateReportExportBundleContract`.
- Returns a validated `ReportExportBundleContract`.

`summarizeReportExportBundle(bundle: ReportExportBundleContract): ReportExportBundleImportSummary`

- Validates the bundle before summarizing.
- Returns `exportId`, `reportCount`, `hasComparison`, `comparisonId`, sorted `scenarioIds`, sorted `reportIds`, and deterministic limitations.

## Summary Shape

```text
{
  exportId: string;
  reportCount: number;
  hasComparison: boolean;
  comparisonId?: string | null;
  scenarioIds: string[];
  reportIds: string[];
  limitations: string[];
}
```

## Boundaries

The utilities are shared local validation helpers only. They do not read files, persist data, call APIs, upload files, download files, export PDF, optimize, recommend, rank scenarios, calculate routes, calculate delay, simulate task completion, make clinical safety claims, or allow PHI.
