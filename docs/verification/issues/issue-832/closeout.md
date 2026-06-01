# Issue 832 Closeout

## Problem
Legacy Split-Bay Quarantine Cleanup

## Code Review
- Legacy split-bay support remains only as compatibility code; normal rendering and current split-room actions use split-room naming and do not render SplitBayShape.

## Files Changed
- apps/web/src/features/layout-editor/layoutEditorReducer.ts
- apps/web/src/features/layout-editor/LayoutEditorStage.tsx
- apps/web/src/features/layout-editor/layoutObjectRenderPipeline.ts
- scripts/check-legacy-split-bay-quarantine.mjs
- docs/verification/issues/issue-832/

## Commands Run
- node scripts/check-legacy-split-bay-quarantine.mjs --stage final --issue 832

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-832/legacy-split-bay-quarantine-output.json

## Known Limitations
- Legacy split-bay data structures remain for migration and compatibility only.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, or assignment recommendations were added.
