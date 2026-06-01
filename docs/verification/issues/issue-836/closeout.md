# Issue 836 Closeout

## Problem
Door Destination / Leads-To Contract

## Code Review
- Doors and door-like support access points now have persisted operational leads-to labels, explicit unknown destination support, and travel-role metadata without clinical claims.

## Files Changed
- packages/shared/src/floorplans/doorDestinationContract.ts
- apps/web/src/features/layout-editor/doorDestinationViewModel.ts
- docs/verification/issues/issue-836/

## Commands Run
- node scripts/check-door-destination-contract.mjs --stage final --issue 836

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-836/door-destination-contract-output.json
- docs/verification/issues/issue-836/door-destination-fixture.json

## Known Limitations
- Travel roles are descriptive metadata only; they do not implement routing or simulation.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, or assignment recommendations were added.
