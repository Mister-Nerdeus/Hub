# Issue 337 Closeout

## Summary

Added manual review action cards and a safe action view model. Each repaired plan now shows review packet, review record template, rendered evidence, and route/export summary references with hashes while keeping manual review required and promotion blocked visible.

## Files Changed

- `apps/web/src/styles.css`
- `apps/web/src/features/floorplans/PlanBuilderLanding.tsx`
- `apps/web/src/features/floorplans/ManualReviewActions.tsx`
- `apps/web/src/features/floorplans/manualReviewActionsViewModel.ts`
- `apps/web/src/features/floorplans/__tests__/manualReviewActionsViewModel.test.ts`
- `scripts/check-plan-builder-ux-review-flow.mjs`
- `apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json`
- `apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.ts`
- `docs/verification/plan-builder-ux-review-flow-manifest.json`
- `docs/verification/issues/issue-337/`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`

## Commands Run

- See `commands.txt`.

## Tests Passed

- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-private-source-artifacts.mjs`
- `node scripts/check-manual-visual-review.mjs --stage final --issue 337`
- `node scripts/check-plan-builder-ux-review-flow.mjs --stage review-actions --allow-partial --issue 337`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 337`

## Evidence Artifacts

- `manual-review-actions-output.json`
- `plan-2-review-actions-output.json`
- `plan-3-review-actions-output.json`
- `plan-4-review-actions-output.json`
- `plan-5-review-actions-output.json`
- `unsafe-link-negative-output.json`
- `missing-link-negative-output.json`
- `approval-language-negative-output.json`
- `no-runtime-docs-parsing-output.json`
- `screenshots/manual-review-actions.png`
- `test-output/`

## Known Limitations

- The screenshot artifact is a reference image, not browser-rendered UI proof.
- Actions are safe repo-relative references, not runtime Markdown readers.
- Manual review remains required.
- Promotion remains blocked.

## Next Recommended Issue

GO for Issue 338. Operators can reliably identify the correct review artifacts without implying a review decision.

## Non-PHI Confirmation

Non-PHI rules still pass. No PHI, EHR data, private source payload, default fixture mutation, manual approval, or promotion was introduced.
