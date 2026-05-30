# Issue 673 Closeout

## Problem
Add Door preflight and patient-room door tooling semantics.

## Summary
- Local validation artifacts passed for this issue scope.

## Files Changed
- Door authoring source, scripts, manifest, project status, and issue evidence artifacts as applicable.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-add-door-preflight.mjs --stage preflight-contract --allow-partial --issue 673
- node scripts/check-add-door-preflight.mjs --stage patient-room-door --allow-partial --issue 673
- node scripts/check-add-door-preflight.mjs --stage solid-wall-reject --allow-partial --issue 673
- node scripts/check-add-door-preflight.mjs --stage storage-reject --allow-partial --issue 673
- node scripts/check-add-door-preflight.mjs --stage support-access-separation --allow-partial --issue 673
- node scripts/check-add-door-preflight.mjs --stage missing-selection --allow-partial --issue 673
- node scripts/check-add-door-preflight.mjs --stage warning-visible --allow-partial --issue 673
- node scripts/check-add-door-preflight.mjs --stage final --issue 673
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-673
- docs/verification/door-authoring-crash-hardening-manifest.json

## Known Limitations
- Add Door is preflighted for patient-room targets before dispatch.
- Storage, support-only, solid-wall, and provider/pharmacy targets produce warnings or disabled controls instead of door mutations.
- Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators.

## Non-PHI Confirmation
- Non-PHI rules still pass.
