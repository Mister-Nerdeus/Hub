# Deterministic Timestamp Contract

Phase 8 keeps proof timestamps deterministic while allowing user-facing review/export builders to receive explicit timestamp input.

Explicit createdAt input is allowed only as a caller-supplied value that still validates through the emitted contract.

## Contract

- Report, comparison, and export builders must use deterministic proof defaults when `createdAt` is omitted.
- Report builders accept explicit `createdAt` input and write it to `report.createdAt` exactly.
- Explicit `createdAt` input must validate through the same ISO-compatible timestamp validation used by the output contract.
- Invalid explicit `createdAt` input must fail validation.
- There is no automatic current-time generation in shared builders.

## Deterministic Proof Defaults

The default timestamp values are proof fixtures, not real generation timestamps:

- Operational reports: `OPERATIONAL_REPORT_CREATED_AT`.
- Scenario comparison: `SCENARIO_COMPARISON_CREATED_AT`.
- Report export bundle: `REPORT_EXPORT_BUNDLE_CREATED_AT`.

These defaults keep fixture output reproducible. UI or review work that needs to show a specific generation timestamp must pass an explicit `createdAt` input rather than reading the current clock in shared builders.

## Boundaries

This contract does not change report calculations, report contents other than timestamp selection, API endpoints, persistence, PDF export, file download behavior, optimizer behavior, scenario recommendation, clinical safety claims, or PHI.
