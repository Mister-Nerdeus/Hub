# Read-Only Bundle Audit Builder Contract

`buildBundleAuditFromJson(jsonText, createdAt?)` is a pure local builder for reviewing report export bundle JSON text.

The builder does not read files, write files, call APIs, persist data, upload data, download data, export PDFs, sign data, encrypt data, optimize assignments, recommend scenarios, simulate task completion, calculate walking routes, or calculate delay.

## Output

```ts
type BundleAuditResult = {
  ok: boolean;
  bundle?: ReportExportBundleContract;
  integrity?: ExportBundleIntegrityContract;
  auditTrail: BundleAuditTrailContract;
  summary: ReportExportBundleImportSummary;
};
```

## Review Steps

The builder emits deterministic review steps:

- Parse JSON text.
- Validate export bundle contract.
- Compute deterministic integrity hash.
- Summarize export bundle.

Invalid JSON or invalid bundle content returns `ok: false` and still emits a validating audit trail with the failed step and later steps marked `not_run`.

## Boundaries

The result is local proof only for synthetic operational evidence. It does not claim tamper-proof security, legal compliance, clinical safety, care outcomes, or reviewer identity.
