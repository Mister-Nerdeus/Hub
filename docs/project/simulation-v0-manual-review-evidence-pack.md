# Simulation v0 Manual Review Evidence Pack

## Scope

This pack is for human manual visual review of the Simulation v0 route in the ER Pod Shift Simulator.

Simulation v0 remains an internal synthetic dry-run review surface. The route is not a full-shift simulation, optimizer, assignment recommendation tool, staffing certification, clinical score, outcome predictor, EHR workflow, or production approval artifact.

## Required Evidence

Reviewers should use the issue evidence folder for the current batch:

- Route screenshot: `docs/verification/issues/issue-611/screenshots/simulation-v0-manual-review-route.png`
- Full route text snapshot: `docs/verification/issues/issue-611/route-text-snapshot-output.json`
- Section inventory: `docs/verification/issues/issue-611/section-inventory-output.json`
- Control inventory: included in `manual-review-evidence-pack-output.json`
- Timeline inventory: included in `manual-review-evidence-pack-output.json`
- Summary-card inventory: included in `manual-review-evidence-pack-output.json`
- Proof-panel inventory: included in `manual-review-evidence-pack-output.json`
- Export-control inventory: included in `manual-review-evidence-pack-output.json`
- No-claim boundary summary: `docs/verification/issues/issue-611/no-claim-boundary-output.json`

## Review Focus

Human review should answer whether the route is understandable, scannable, and ready for another review pass. The reviewer should inspect:

- Whether the route title and status clearly describe an internal synthetic dry-run.
- Whether profile and ratio controls are understandable without technical context.
- Whether the timeline can be read and inspected.
- Whether summary cards make workload placeholders easy to scan.
- Whether occupied-bed proof explains how synthetic occupied positions are selected.
- Whether artifact hash proof explains deterministic repeatability.
- Whether export controls clearly describe the synthetic review bundle.
- Whether limitations are visible without implying automated approval.

## No-Claim Boundary

The route and this pack must continue to state:

- Manual visual review remains required.
- Promotion remains blocked.
- No optimizer exists.
- No assignment recommendation is produced.
- No staffing certification is produced.
- No clinical scoring is produced.
- No outcome prediction is produced.
- No PHI, EHR data, real staff data, real facility identifiers, medication names, diagnosis text, or clinical notes are used.

## Known limitations

- This pack supports human manual visual review only.
- The scorecard is blank until a human reviewer completes it.
- Automated evidence proves route inventory and boundary wording, not usefulness or approval.
- Promotion remains blocked after this pack is generated.

## Reviewer Decision Area

Reviewer name:

Reviewer role:

Review date:

Decision: Pass / Needs repair / Blocked

Notes:
