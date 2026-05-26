# Issue 336 Closeout

## Summary

Added a safe rendered plan preview panel and view model. The panel consumes the generated snapshot, validates safe rendered evidence references, shows safe rendered images plus hashes and draw/object summaries, and keeps manual review required and promotion blocked visible.

## Files Changed

- `apps/web/src/styles.css`
- `apps/web/src/features/floorplans/PlanBuilderLanding.tsx`
- `apps/web/src/features/floorplans/RenderedPlanPreviewPanel.tsx`
- `apps/web/src/features/floorplans/renderedPlanPreviewViewModel.ts`
- `apps/web/src/features/floorplans/__tests__/renderedPlanPreviewViewModel.test.ts`
- `apps/web/public/plan-builder-review-flow/rendered-plans/`
- `scripts/check-plan-builder-ux-review-flow.mjs`
- `apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json`
- `apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.ts`
- `docs/verification/plan-builder-ux-review-flow-manifest.json`
- `docs/verification/issues/issue-336/`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`

## Commands Run

- See `commands.txt`.

## Tests Passed

- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-private-source-artifacts.mjs`
- `node scripts/check-manual-visual-review.mjs --stage final --issue 336`
- `node scripts/check-plan-builder-ux-review-flow.mjs --stage rendered-preview --allow-partial --issue 336`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 336`

## Evidence Artifacts

- `rendered-preview-view-model-output.json`
- `plan-2-preview-output.json`
- `plan-3-preview-output.json`
- `plan-4-preview-output.json`
- `plan-5-preview-output.json`
- `draw-count-summary-output.json`
- `private-source-image-negative-output.json`
- `exact-parity-negative-output.json`
- `screenshots/rendered-plan-preview.png`
- `test-output/`

## Known Limitations

- The screenshot artifact is a reference image, not browser-rendered UI proof.
- Manual review remains required.
- Promotion remains blocked.

## Next Recommended Issue

GO for Issue 337. Human reviewers can safely inspect rendered plans inside the app while promotion remains blocked.

## Non-PHI Confirmation

Non-PHI rules still pass. No PHI, EHR data, private source payload, default fixture mutation, manual approval, or promotion was introduced.
