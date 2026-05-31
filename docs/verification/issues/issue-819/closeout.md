# Issue 819 Closeout

## Problem
Wire Single-Room Split-Room Conversion into Reducer

## Code Review
- Reducer now creates splitRooms from one selected parent room and selects the split_room_parent object without creating child-room rectangles.

## Files Changed
- apps/web/src/features/layout-editor/layoutEditorReducer.ts
- apps/web/src/features/layout-editor/splitRoomActions.ts
- docs/verification/issues/issue-819/

## Commands Run
- node scripts/check-split-room-reducer-wiring.mjs --stage reducer-action --issue 819
- node scripts/check-split-room-reducer-wiring.mjs --stage uses-single-room-conversion --issue 819
- node scripts/check-split-room-reducer-wiring.mjs --stage no-pair-resolution-normal-flow --issue 819
- node scripts/check-split-room-reducer-wiring.mjs --stage parent-footprint-preserved --issue 819
- node scripts/check-split-room-reducer-wiring.mjs --stage no-fake-child-rooms --issue 819

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-819/test-output/check-split-room-reducer-wiring.txt
- docs/verification/issues/issue-819/manifest-update-output.json

## Known Limitations
- None beyond the issue scope.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
