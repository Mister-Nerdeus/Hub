# Issue 895 Closeout

## Problem
Split-Room Visual Screenshot Evidence Closeout

## Code Review
- Split-room visual evidence now uses rendered browser CSS and screenshots to prove unassigned targets stay white while badges, selected strokes, warnings, storage, and walls remain visible.

## Files Changed
- apps/web/src/features/layout-editor/LayoutEditorStage.css
- scripts/check-split-room-visual-screenshot-evidence.mjs
- package.json
- docs/verification/manual-scenario-foundation-manifest.json
- docs/verification/issues/issue-895

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-split-room-visual-screenshot-evidence.mjs --stage final --issue 895
- node scripts/check-split-room-unassigned-visual-state.mjs --stage final --issue 895
- node scripts/check-no-phi-fields.mjs
- docker compose config
- docker compose -f docker-compose.production.yml config
- docker compose build web
- docker compose -f docker-compose.production.yml build web

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-895/split-room-visual-screenshot-evidence-output.json
- docs/verification/issues/issue-895/computed-style-proof.json
- docs/verification/issues/issue-895/screenshot-index.json
- docs/verification/issues/issue-895/screenshots/split-room-visual-computed-proof.png
- docs/verification/issues/issue-895/screenshots/unassigned-split-room-browser.png
- docs/verification/issues/issue-895/screenshots/assigned-split-bed-badges-browser.png
- docs/verification/issues/issue-895/screenshots/storage-wall-disabled-browser.png
- docs/verification/issues/issue-895/test-output/shared.txt
- docs/verification/issues/issue-895/test-output/web.txt
- docs/verification/issues/issue-895/test-output/web-build.txt
- docs/verification/issues/issue-895/test-output/docker-compose-config.txt
- docs/verification/issues/issue-895/test-output/docker-compose-production-config.txt
- docs/verification/issues/issue-895/test-output/docker-compose-build-web.txt
- docs/verification/issues/issue-895/test-output/docker-compose-production-build-web.txt

## Known Limitations
- The screenshot harness renders focused SVG proof states with production CSS; it does not exercise editor gestures.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only scenario foundation task.
