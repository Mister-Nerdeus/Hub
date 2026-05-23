# Report Export JSON Bundle Contract

The report export JSON bundle packages deterministic local proof artifacts without persistence, API endpoints, file download behavior, PDF export, or screenshots.

## Contract

`ReportExportBundleContract`

- `schemaVersion`: `"1.0.0"`.
- `exportId`: non-empty local proof identifier.
- `exportType`: `"operational_report_bundle"`.
- `createdAt`: ISO-compatible timestamp.
- `label`: operational-only label.
- `reports`: non-empty `OperationalReportContract[]`.
- `comparison`: optional `ScenarioComparisonContract` or `null`.
- `limitations`: operational-only limitations.
- `metadata`: `ReportExportBundleMetadata`.

`ReportExportBundleMetadata`

- `appName`: non-empty application name.
- `appVersion`: non-empty application version.
- `generatedBy`: `"local-proof"`.
- `source`: `"synthetic-operational-data"`.

## Invariants

- `exportId` is non-empty.
- `createdAt` is ISO-compatible.
- `reports` is non-empty.
- Report IDs are unique.
- Reports validate before bundling.
- Comparison validates when present.
- Comparison items reference included reports.
- Limitations include operational-only, no optimizer, no recommendation, and no clinical safety claim language.
- Text rejects positive safety-certification and recommendation language.
- TypeScript and Python validators agree on valid and invalid fixtures.
- Builder output validates against the contract.

## Boundaries

The bundle is a JSON proof object only. It does not add export UI, file download behavior, PDF export, API endpoints, persistence, optimization, scenario recommendation, route calculation, delay calculation, task-completion simulation, EHR integration, or PHI.
