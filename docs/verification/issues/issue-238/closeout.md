# Issue 238 Closeout - Plan 1 App Render Visual Parity Proof

## Summary

Issue 238 proves the repaired Plan 1 JSON fixture renders through the app floorplan/editor pipeline as the full layout rather than the old simplified 8-room version. The render proof is derived from JSON fixture data and includes screenshot evidence.

## Files Changed

- `apps/web/src/features/layout-editor/LayoutEditorStage.tsx`
- `apps/web/src/features/floorplans/FloorplanLibrary.tsx`
- `apps/web/src/features/layout-editor/layoutEditorState.ts`
- `apps/web/src/fixtures/defaultPlans.ts`
- `apps/web/src/features/layout-editor/plan1AppRenderVisualParity.test.ts`
- `scripts/check-plan-1-visual-parity.mjs`
- `docs/project/plan-1-visual-parity-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-238/*`

## Commands Run

- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 238`
- `msedge --headless --screenshot` for before/after evidence-only PNG files

## Tests Passed / Failed

- PASS: `npm --workspace apps/web test` executed 69 web test files.
- PASS: `npm --workspace apps/web run build` completed successfully. Vite reported the existing large chunk warning.
- PASS: `node scripts/check-no-phi-fields.mjs` found no PHI-like fields.
- PASS: `node scripts/check-plan-1-visual-parity.mjs --allow-partial --issue 238` had no required Issue 238 app render failures. The remaining grey-block annotation gap is expected until final deferred handling.
- PASS: `node scripts/check-docs-contracts.mjs` after evidence artifacts were present.

## Evidence Artifacts

- `first-failure.txt`
- `plan-1-render-before-output.json`
- `plan-1-render-after-output.json`
- `plan-1-label-render-coverage-output.json`
- `plan-1-render-object-count-output.json`
- `plan-1-old-render-negative-output.json`
- `plan-1-visual-parity-review.md`
- `screenshots/plan-1-before-current-render.png`
- `screenshots/plan-1-after-updated-render.png`
- `test-output/web.txt`
- `test-output/web-build.txt`
- `test-output/no-phi.txt`
- `test-output/plan-1-visual-parity-gate.txt`
- `test-output/docs-gate.txt`

## Known Limitations

- The before screenshot is an evidence placeholder because no old local simplified render screenshot was available after Issues 232-236 had already repaired the fixture.
- The after screenshot is generated from the app render pipeline and JSON fixture data as a local evidence artifact; it is not a runtime asset or source-image overlay.
- Grey unlabeled source blocks remain pending/deferred.
- No nurse assignment, scoring, simulation, optimizer, reports, production deployment, PHI, EHR integration, DOCX exposure, or exact-CAD behavior was added.

## Non-PHI Confirmation

No PHI, patient identity, EHR integration, DOCX/source image exposure, clinical safety certification language, optimizer behavior, scoring, or simulation behavior was added.

## GO / NO-GO for Issue 239

- GO: Plan 1 render proof exists, required labels render, the old simplified layout is absent, and screenshot evidence exists.

## Rendered Room Count

- 23.

## Rendered Station Count

- 2.

## Visual Parity Gaps

- Grey unlabeled source blocks remain deferred/pending.

## Next Recommended Issue

- Issue 239: editor export integrity for edited Plan 1.
