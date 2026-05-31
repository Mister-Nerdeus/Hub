# Issue 785 Closeout

## Problem
Render Layer Order

## Code Review
- The editor did not expose one deterministic render layer order, and grid labels were positioned below primary geometry.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/layout-editor/renderLayerOrder.ts
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- scripts/check-render-layer-order.mjs
- docs/verification/geometry-truth-repair-manifest.json
- docs/verification/issues/issue-785/

## Commands Run
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-render-layer-order.mjs --stage layer-order --issue 785
- node scripts/check-render-layer-order.mjs --stage labels-handles-top --issue 785
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-785/layer-order-output.json
- docs/verification/issues/issue-785/labels-handles-top-output.json
- docs/verification/issues/issue-785/manifest-update-output.json

## Known Limitations
- This issue fixes deterministic layer declaration and label position; later split-bed work adds a dedicated bed-position layer.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
