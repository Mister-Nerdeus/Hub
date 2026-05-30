# Issue 675 Closeout

## Problem
Door action recovery snapshots before door mutations.

## Summary
- Local validation artifacts passed for this issue scope.

## Files Changed
- Door authoring source, scripts, manifest, project status, and issue evidence artifacts as applicable.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-door-action-recovery-snapshots.mjs --stage snapshot-contract --allow-partial --issue 675
- node scripts/check-door-action-recovery-snapshots.mjs --stage before-door-action --allow-partial --issue 675
- node scripts/check-door-action-recovery-snapshots.mjs --stage failed-action-restore --allow-partial --issue 675
- node scripts/check-door-action-recovery-snapshots.mjs --stage scoped-record --allow-partial --issue 675
- node scripts/check-door-action-recovery-snapshots.mjs --stage export-snapshot --allow-partial --issue 675
- node scripts/check-door-action-recovery-snapshots.mjs --stage final --issue 675
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-675
- docs/verification/door-authoring-crash-hardening-manifest.json

## Known Limitations
- Door and support-access mutations now capture a last-valid snapshot before dispatch.
- Failed door actions preserve the previous valid editable layout and append warnings.
- Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators.

## Non-PHI Confirmation
- Non-PHI rules still pass.
