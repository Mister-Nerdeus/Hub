# Issue 837 Closeout

## Problem
Boundary / Entry / Door Destination Renderer

## Code Review
- The normal editor render path now includes layout-owned perimeter walls, entry/exit geometry, and visible door destination labels with warning styling for unknown destinations.

## Files Changed
- apps/web/src/features/layout-editor/PerimeterWallShape.tsx
- apps/web/src/features/layout-editor/EntryExitShape.tsx
- apps/web/src/features/layout-editor/DoorDestinationLabel.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- docs/verification/issues/issue-837/

## Commands Run
- node scripts/check-boundary-door-destination-renderer.mjs --stage final --issue 837

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-837/boundary-door-destination-renderer-output.json
- docs/verification/issues/issue-837/screenshot-index.json

## Known Limitations
- Issue 841 provides the hard browser screenshot proof; this issue checks renderer wiring.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, or assignment recommendations were added.
