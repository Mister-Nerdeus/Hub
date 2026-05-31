# Issue 770 Closeout

## Problem
Geometry Migration Guard

## Code Review
- New geometry contracts need a non-destructive migration path so older saved layouts still load and unknown visuals cannot silently become editable geometry.

## Summary
- Local validator status: passed.

## Files Changed
- packages/shared/src/floorplans/geometryMigration.ts
- apps/web/src/features/floorplans/floorplanMigration.ts
- packages/shared/src/index.ts
- scripts/check-geometry-migration-guard.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-770/

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web run build
- node scripts/check-geometry-migration-guard.mjs --stage existing-layout-loads --issue 770
- node scripts/check-geometry-migration-guard.mjs --stage unknown-artifact-quarantine --issue 770
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-770/existing-layout-loads-output.json
- docs/verification/issues/issue-770/unknown-artifact-quarantine-output.json
- docs/verification/issues/issue-770/manifest-update-output.json

## Known Limitations
- This guard quarantines unknown rendered visuals; later issues define the full reference overlay renderer and cleanup path.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
