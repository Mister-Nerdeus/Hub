# Simulation v0 Clean Repair GO / NO-GO

Decision: GO for Expanded Simulation v0 User-Facing Refinement.

This reissues the Issue 590 decision after the false-positive repair batch. The clean decision is based on local-first evidence for Issues 591-599 and committed-state checks. Simulation v0 remains an internal synthetic dry-run only until the next-batch readiness contract is complete.

## Audit Basis
- Actual room placement now uses the shared 10 by 10 default source.
- Committed ISSUE_EVIDENCE_INDEX.json is non-empty, valid JSON, and indexed through Issue 599.
- Current-batch docs contracts pass; historical docs backlog remains scoped as non-blocking by policy.
- Visible product copy policy fails closed for generic legacy visible-copy variants.
- Simulation UI status is derived from proof truth and no longer hardcodes pending proof language.
- Final repair gate independently revalidates committed source and artifacts.
- Clean committed-state gate verifies required repair evidence is tracked.
- Runtime seed changes operational runtime fields while preserving neutral workload task IDs.

## Boundaries
- No full-shift simulation was added.
- No optimizer or assignment recommendation was added.
- No clinical safety score, staffing compliance certification, or patient outcome prediction was added.
- No PHI, EHR data, real patient data, real staff data, or real facility identifiers were added.
- Manual visual review remains required.
- Promotion remains blocked.

## Remaining Non-Repair Work
Issue 600 must define the readiness contract for Issues 601-610 before expanded user-facing refinement starts.
