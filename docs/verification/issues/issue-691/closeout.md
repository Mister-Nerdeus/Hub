# Issue 691 Closeout

## Problem
Split/door browser evidence artifact naming cleanup.

## Summary
- Local validation artifacts passed for this issue scope.

## Files Changed
- scripts/check-door-authoring-browser-regression.mjs
- scripts/check-split-room-browser-regression.mjs
- scripts/check-split-room-authoring-go-no-go.mjs
- scripts/check-split-door-artifact-naming.mjs
- scripts/lib/door-authoring-crash-hardening-utils.mjs
- scripts/lib/split-room-authoring-utils.mjs
- package.json
- docs/verification/issues/issue-688/browser-regression-proof.json
- docs/verification/issues/issue-688/browser-regression-proof-index.json
- docs/verification/issues/issue-688/door-browser-regression-proof.json
- docs/verification/issues/issue-688/split-room-browser-regression-proof.json
- docs/verification/issues/issue-688/final-split-room-audit.md
- docs/verification/issues/issue-688/go-no-go.md
- docs/verification/split-room-closeout-hardening-manifest.json
- docs/verification/issues/issue-691/

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-split-door-artifact-naming.mjs --stage artifact-inventory --allow-partial --issue 691
- node scripts/check-split-door-artifact-naming.mjs --stage door-proof-renamed --allow-partial --issue 691
- node scripts/check-split-door-artifact-naming.mjs --stage split-room-proof-renamed --allow-partial --issue 691
- node scripts/check-split-door-artifact-naming.mjs --stage generic-proof-negative --allow-partial --issue 691
- node scripts/check-split-door-artifact-naming.mjs --stage go-no-go-reference --allow-partial --issue 691
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-691
- docs/verification/split-room-closeout-hardening-manifest.json

## Known Limitations
- This issue changes local evidence naming and validators only; product behavior is unchanged.
- The generic browser proof artifact is index-only so door and split-room proof payloads cannot collide.

## Non-PHI Confirmation
- Non-PHI rules still pass.
