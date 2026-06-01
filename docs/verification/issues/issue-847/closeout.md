# Issue 847 Closeout

## Problem
Door Destination UX Polish

## Code Review
- Door destination labels and inspector copy use operational Leads to / Unknown wording, stay readable at normal zoom, and show destination labels in presentation mode.

## Files Changed
- apps/web/src/features/layout-editor/DoorDestinationLabel.tsx
- apps/web/src/features/layout-editor/DoorDestinationInspectorPanel.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- scripts/check-door-destination-ux-polish.mjs
- docs/verification/issues/issue-847/

## Commands Run
- node scripts/check-door-destination-ux-polish.mjs --stage final --issue 847

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-847/door-destination-ux-polish-output.json
- docs/verification/issues/issue-847/screenshot-index.json
- docs/verification/issues/issue-847/screenshots/

## Known Limitations
- Door destination warnings are floorplan-connectivity warnings only.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, burden scoring, assignment persistence, or assignment recommendations were added.
