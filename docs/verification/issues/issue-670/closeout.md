# Issue 670 Closeout

## Problem
Browser reproduction harness detects forced editor recovery and proves normal top-pod door work stays out of recovery.

## Summary
- Local validation artifacts passed for this issue scope.

## Files Changed
- Door authoring source, scripts, manifest, project status, and issue evidence artifacts as applicable.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-door-authoring-crash-reproduction.mjs --stage red-mode-detects-recovery --allow-partial --issue 670
- node scripts/check-door-authoring-crash-reproduction.mjs --stage left-pod --allow-partial --issue 670
- node scripts/check-door-authoring-crash-reproduction.mjs --stage right-pod --allow-partial --issue 670
- node scripts/check-door-authoring-crash-reproduction.mjs --stage grey-wall-adjacent --allow-partial --issue 670
- node scripts/check-door-authoring-crash-reproduction.mjs --stage recovery-screen-negative --allow-partial --issue 670
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-670
- docs/verification/door-authoring-crash-hardening-manifest.json

## Known Limitations
- This issue adds harness coverage only; product repair is handled by later issues.
- Candidate assignment is attempted when an enabled candidate exists; no unsafe automatic candidate is selected.

## Non-PHI Confirmation
- Non-PHI rules still pass.
