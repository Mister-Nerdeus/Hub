# Issue 838 Closeout

## Problem
Door Destination Inspector and Editing Controls

## Code Review
- Normal inspector controls can edit door leads-to values and entry/exit destination kind and labels while technical IDs remain in advanced metadata.

## Files Changed
- apps/web/src/features/layout-editor/DoorDestinationInspectorPanel.tsx
- apps/web/src/features/layout-editor/EntryExitInspectorPanel.tsx
- apps/web/src/features/layout-editor/layoutInspectorViewModel.ts
- apps/web/src/features/layout-editor/layoutEditorReducer.ts
- docs/verification/issues/issue-838/

## Commands Run
- node scripts/check-door-destination-inspector.mjs --stage final --issue 838

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-838/door-destination-inspector-output.json
- docs/verification/issues/issue-838/screenshot-index.json

## Known Limitations
- Issue 841 performs browser-level edit/save/reload proof.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, or assignment recommendations were added.
