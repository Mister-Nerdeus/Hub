# Phase 6 Reporting Evidence

Phase 6 proves that the simulator can inspect and explain generated operational task workload through validated reports without optimization, route calculation, delay calculation, clinical safety claims, or task-completion simulation.

## Scope Proven

- Operational report contract exists in TypeScript and Python.
- Operational summary report builder produces a validated operational summary report.
- Nurse workload report builder produces validated per-nurse task-count and estimated-minute summaries.
- Unassigned task report builder exposes unassigned task IDs and room IDs.
- Warning report builder exposes warning severity counts and warning code counts.
- API-free web proof displays local synthetic report outputs and limitations.

## Evidence Artifacts

- Operational report contract: `docs/contracts/operational-report-contract.md`.
- Operational summary and nurse workload builders: `docs/contracts/operational-summary-report-builder-contract.md`.
- Unassigned task and warning builders: `docs/contracts/unassigned-task-warning-report-contract.md`.
- Issue 054 validation output: `docs/verification/issues/issue-054/validation-output.txt`.
- Issue 055 report output: `docs/verification/issues/issue-055/report-output.json`.
- Issue 056 report output: `docs/verification/issues/issue-056/report-output.json`.
- Issue 057 report proof output: `docs/verification/issues/issue-057/report-proof-output.json`.
- Issue 057 screenshot: `docs/verification/issues/issue-057/screenshots/report-proof.png`.
- Issue 058 report output: `docs/verification/issues/issue-058/report-output.json`.
- Issue 058 validation output: `docs/verification/issues/issue-058/validation-output.txt`.
- Issue 058 negative proof output: `docs/verification/issues/issue-058/negative-proof-output.txt`.

## Boundary Confirmation

No PHI was added.
No optimizer was added.
No task completion simulation was added.
No walking route calculation was added.
No delay calculation was added.
No clinical safety claims were added.
No PDF export, API endpoint, report persistence, reassignment suggestion, or auto-fix behavior was added.

Reports are operational inspection summaries only and use synthetic operational data.
