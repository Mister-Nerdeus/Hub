# Issue 721 Closeout

## Problem
Move Legacy Editor Toolbar to Advanced

## Summary
- Local validator status: passed.

## Files Changed
- Batch source, docs, scripts, manifest, and issue evidence as applicable.

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-editor-detailed-tools-advanced.mjs --stage detailed-toolbar-advanced --allow-partial --issue 721
- node scripts/check-editor-detailed-tools-advanced.mjs --stage normal-mode-hidden --allow-partial --issue 721
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-721
- docs/verification/editor-assignment-ux-manifest.json
- docs/project/editor-assignment-ux-status.md

## Known Limitations
- None beyond the issue scope.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
