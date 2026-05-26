# Batch 341-350 Code Review Findings

## Resolved Findings

1. `scripts/check-human-review-intake.mjs` wrote `human-review-intake-gate-output.json` and the mapped gate output before running stage checks. A later stage failure could leave stale passing evidence next to a failing process. The gate now writes those outputs after all stage checks finish.

2. `packages/shared/src/floorplans/humanReviewIntakeManifest.ts` allowed inconsistent submitted-record manifest states, such as approved decisions without explicit reviewer source or present reviewer identity. Manifest validation now rejects submitted records that do not carry coherent reviewer decision, identity, authority, invalid-record, and dry-run status combinations.

3. `packages/shared/src/floorplans/humanReviewPromotionRecheck.ts` could report `allPlansDryRunReady` from `dryRunStatus` alone even when blocking reasons still existed. Recheck status now derives blocking states from approval, identity, authority, route/export, and boundary status before allowing dry-run readiness.

4. Docker build context did not explicitly exclude submitted human review records or promotion dry-run artifacts. `.dockerignore` now excludes `docs/manual-review/submitted` and `docs/promotion-dry-run`.

## Review Result

GO for additional human review intake / UX work.
NO-GO for promotion-review until valid submitted structured human review records exist.
