# Issue 828 Closeout

## Problem
Replace Placeholder Screenshot Proof with Real Browser Screenshots

## Code Review
- Final geometry hardening proof now rejects placeholder screenshot generation and depends on browser-rendered screenshot artifacts.

## Files Changed
- scripts/check-convert-room-to-split-room.mjs
- scripts/check-real-screenshot-proof-required.mjs
- scripts/check-split-room-hard-browser-regression.mjs
- docs/verification/issues/issue-828/

## Commands Run
- node scripts/check-real-screenshot-proof-required.mjs --stage no-placeholder-final-proof --issue 828
- node scripts/check-split-room-screenshot-proof.mjs --stage real-browser-screenshots --issue 828

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-828/test-output/check-real-screenshot-proof-required.txt
- docs/verification/issues/issue-828/manifest-update-output.json

## Known Limitations
- Issue 829 generates the browser screenshots consumed as final proof.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, or assignment recommendations were added.
