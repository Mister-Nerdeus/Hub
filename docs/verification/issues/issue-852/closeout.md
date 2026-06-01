# Issue 852 Closeout

## Problem
Route Graph Validation

## Code Review
- Route graph validation emits floorplan-connectivity warnings for disconnected rooms and unknown destinations without clinical, staffing, or patient-outcome language.

## Files Changed
- packages/shared/src/floorplans/routeGraphValidation.ts
- apps/web/src/features/layout-editor/EditorValidationSummaryRow.tsx
- apps/web/src/features/layout-editor/LayoutValidationPanel.tsx
- scripts/check-route-graph-validation.mjs
- docs/verification/issues/issue-852/

## Commands Run
- node scripts/check-route-graph-validation.mjs --stage final --issue 852

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-852/route-graph-validation-output.json
- docs/verification/issues/issue-852/route-graph-validation-fixture.json

## Known Limitations
- Validation warnings are connectivity-only; they do not imply adequacy or outcome predictions.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, burden scoring, assignment persistence, or assignment recommendations were added.
