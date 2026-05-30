# Issue 672 Closeout

## Problem
Door adjacent candidate eligibility and disabled reason model.

## Summary
- Local validation artifacts passed for this issue scope.

## Files Changed
- Door authoring source, scripts, manifest, project status, and issue evidence artifacts as applicable.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-door-candidate-eligibility.mjs --stage candidate-contract --allow-partial --issue 672
- node scripts/check-door-candidate-eligibility.mjs --stage solid-wall-blocked --allow-partial --issue 672
- node scripts/check-door-candidate-eligibility.mjs --stage support-zone-blocked --allow-partial --issue 672
- node scripts/check-door-candidate-eligibility.mjs --stage placeholder-selection --allow-partial --issue 672
- node scripts/check-door-candidate-eligibility.mjs --stage invalid-candidate-disabled --allow-partial --issue 672
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-672
- docs/verification/door-authoring-crash-hardening-manifest.json

## Known Limitations
- Candidate assignment now requires explicit user selection from a neutral placeholder.
- Invalid adjacent candidates are disabled with reason text and cannot dispatch assignment.
- Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators.

## Non-PHI Confirmation
- Non-PHI rules still pass.
