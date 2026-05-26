# Issue 335 Closeout

## Summary

Added Plan Builder status badge and filter UX for review candidates. The view models keep route ready, simulation ready, manual review required, default fixture unchanged, and promotion blocked as separate states, and review candidates sort ahead of lower-priority documentation entries.

## Files Changed

- `apps/web/src/styles.css`
- `apps/web/src/features/floorplans/PlanBuilderLibrary.tsx`
- `apps/web/src/features/floorplans/PlanLibraryFilters.tsx`
- `apps/web/src/features/floorplans/PlanStatusBadge.tsx`
- `apps/web/src/features/floorplans/planBuilderLibraryViewModel.ts`
- `apps/web/src/features/floorplans/planStatusViewModel.ts`
- `apps/web/src/features/floorplans/__tests__/planStatusViewModel.test.ts`
- `scripts/check-plan-builder-ux-review-flow.mjs`
- `apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json`
- `apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.ts`
- `docs/verification/plan-builder-ux-review-flow-manifest.json`
- `docs/verification/issues/issue-335/`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`

## Commands Run

- See `commands.txt`.

## Tests Passed

- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-private-source-artifacts.mjs`
- `node scripts/check-manual-visual-review.mjs --stage final --issue 335`
- `node scripts/check-plan-builder-ux-review-flow.mjs --stage status-and-filters --allow-partial --issue 335`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 335`

## Evidence Artifacts

- `status-badge-view-model-output.json`
- `route-ready-badge-output.json`
- `simulation-ready-badge-output.json`
- `manual-review-required-badge-output.json`
- `promotion-blocked-badge-output.json`
- `filters-output.json`
- `review-candidate-sort-output.json`
- `false-approval-negative-output.json`
- `screenshots/plan-status-badges.png`
- `screenshots/plan-library-filters.png`
- `test-output/`

## Known Limitations

- Screenshot artifacts are reference images, not browser-rendered UI proof.
- Manual review remains required.
- Promotion remains blocked.

## Next Recommended Issue

GO for Issue 336. Status visibility is clear enough to proceed to safe rendered preview work.

## Non-PHI Confirmation

Non-PHI rules still pass. No PHI, EHR data, private source payload, default fixture mutation, manual approval, or promotion was introduced.
