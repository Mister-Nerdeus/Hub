# Issue 736 Closeout

## Problem
Preserve Room Move/Resize

## Code Review
- The full-page editor layout could have disconnected room drag or resize handlers; the source regression gate now verifies the actual multiline reducer dispatches and component callbacks.

## Summary
- Room move preservation status: passed.
- Room resize preservation status: passed.

## Files Changed
- scripts/check-editor-workspace-layout.mjs
- docs/verification/workspace-ux-foundation-manifest.json
- docs/verification/issues/issue-736/

## Commands Run
- node scripts/check-editor-workspace-layout.mjs --stage room-move-preserved --allow-partial --issue 736
- node scripts/check-editor-workspace-layout.mjs --stage room-resize-preserved --allow-partial --issue 736
- npm --workspace apps/web run build
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Passed: room move preservation gate.
- Passed: room resize preservation gate.
- Passed: web build.
- Passed: non-PHI scanner.

## Evidence Artifacts
- docs/verification/issues/issue-736/test-output/room-move-preserved.txt
- docs/verification/issues/issue-736/test-output/room-resize-preserved.txt
- docs/verification/issues/issue-736/test-output/web-build.txt

## Known Limitations
- This is a source-level preservation gate; browser drag coverage remains in the broader editor regression/screenshot sweep.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
