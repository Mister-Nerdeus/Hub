# Issue 826 Closeout

## Problem
Wall Selection Behavior Hardening

## Code Review
- Selectable walls now have click and keyboard handlers, and locked outer walls can be selected and inspected without enabling edits.

## Files Changed
- apps/web/src/features/layout-editor/WallShape.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/layoutSelectionModel.ts
- apps/web/src/features/layout-editor/layoutInspectorViewModel.ts
- docs/verification/issues/issue-826/

## Commands Run
- node scripts/check-wall-selection-behavior.mjs --stage wall-click-selection --issue 826
- node scripts/check-wall-selection-behavior.mjs --stage wall-keyboard-selection --issue 826
- node scripts/check-wall-selection-behavior.mjs --stage selectable-contract-has-handler --issue 826

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-826/test-output/check-wall-selection-behavior.txt
- docs/verification/issues/issue-826/screenshot-index.json

## Known Limitations
- Screenshot index is populated by issue 829 hard browser proof.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
