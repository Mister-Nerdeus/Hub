# Bundle Audit Trail Contract

The bundle audit trail contract records a deterministic local review trail for an exported operational evidence bundle.

This is local proof only. It is not legal audit compliance, tamper-proof security, reviewer identity proof, chain-of-custody, non-repudiation, or clinical safety certification.

## Contract

```ts
type BundleAuditTrailContract = {
  schemaVersion: "1.0.0";
  auditTrailId: string;
  exportId: string;
  createdAt: string;
  validationStatus: "passed" | "failed";
  integrity: ExportBundleIntegrityContract;
  reviewSteps: BundleAuditStep[];
  warnings: Warning[];
  limitations: string[];
};

type BundleAuditStep = {
  id: string;
  label: string;
  status: "passed" | "failed" | "not_run";
  message: string;
};
```

## Invariants

- `auditTrailId` must be non-empty.
- `exportId` must match `integrity.exportId`.
- `createdAt` must be ISO-compatible.
- Review step IDs must be unique.
- At least one review step is required.
- `validationStatus` must be `failed` when any step fails and `passed` when no step fails.
- Reviewer identity and user identity fields are not allowed.

## Required Limitations

- Local proof only.
- No legal/compliance claim.
- No tamper-proof claim.
- No clinical safety claim.

The trail stays fixture/proof based and does not add persistence, API endpoints, upload, download, signatures, encryption, optimization, or recommendations.
