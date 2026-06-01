# Issue 871 Closeout

## Problem
Assignment No-Recommendation Guard

## Code Review
- The guard scans the new assignment foundation files for blocked evaluative terms.

## Files Changed
- scripts/check-assignment-no-recommendation-guard.mjs
- docs/project/assignment-foundation-status.md
- docs/verification/issues/issue-871

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-assignment-no-recommendation-guard.mjs --stage final --issue 871
- node scripts/check-manual-assignment-browser-proof.mjs --stage final --issue 871
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-871/assignment-no-recommendation-guard-output.json
- docs/verification/issues/issue-871/assignment-contract-scan-output.json
- docs/verification/issues/issue-871/assignment-ui-copy-scan-output.json
- docs/verification/issues/issue-871/assignment-proof-artifact-scan-output.json

## Known Limitations
- The scan is scoped to the new assignment foundation files for this batch.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only assignment foundation task.
